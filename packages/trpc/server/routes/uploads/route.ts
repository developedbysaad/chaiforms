import { eq, schema } from "@repo/database";
import { createPresignedUpload, isStorageConfigured, publicUrl } from "@repo/services";
import { TRPCError } from "@trpc/server";
import { customAlphabet } from "nanoid";
import { z } from "zod";

import { publicProcedure, router } from "../../trpc";

// Default per-field size cap (MB) when the field doesn't set its own. Keep in
// sync with the builder's default and the validator's maxSizeMb max.
const DEFAULT_MAX_SIZE_MB = 10;
const MB = 1024 * 1024;

const objectId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);

/** Object-key prefix that scopes every upload to a single form. */
export function uploadPrefix(formId: string): string {
  return `uploads/${formId}/`;
}

/** A submitted file_upload key MUST live under its form's prefix. */
export function isKeyForForm(key: string, formId: string): boolean {
  return key.startsWith(uploadPrefix(formId));
}

/** Strip path separators / unsafe chars from a client filename. */
function safeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file";
  return base.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "file";
}

/** Does a content type match any accepted mime/extension hint? */
function matchesAccepted(contentType: string, filename: string, accepted: string[]): boolean {
  if (accepted.length === 0) return true;
  const ct = contentType.toLowerCase();
  const lowerName = filename.toLowerCase();
  return accepted.some((raw) => {
    const hint = raw.trim().toLowerCase();
    if (!hint) return false;
    if (hint.startsWith(".")) return lowerName.endsWith(hint);
    if (hint.endsWith("/*")) return ct.startsWith(hint.slice(0, -1)); // image/* → image/
    return ct === hint;
  });
}

export const uploadsRouter = router({
  // Lets the builder + renderer know whether the file_upload field is usable.
  // publicBaseUrl is non-empty only when configured — the dashboard uses it to
  // build download links for stored files.
  status: publicProcedure.query(() => ({
    configured: isStorageConfigured(),
    publicBaseUrl: isStorageConfigured() ? publicUrl("").replace(/\/$/, "") : null,
  })),

  // Public form fillers call this to get a presigned PUT URL for one file.
  presign: publicProcedure
    .input(
      z.object({
        formSlug: z.string(),
        fieldId: z.string().uuid(),
        filename: z.string().min(1).max(300),
        contentType: z.string().min(1).max(200),
        size: z.number().int().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!isStorageConfigured()) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "File uploads are not configured on this instance",
        });
      }

      const form = await ctx.db.query.forms.findFirst({
        where: eq(schema.forms.slug, input.formSlug),
        with: { fields: true },
      });
      if (!form || form.type !== "hosted" || form.status !== "published") {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const field = form.fields.find(
        (f) => f.id === input.fieldId && f.type === "file_upload",
      );
      if (!field) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Upload field not found" });
      }

      const cfg = field.config ?? {};
      const maxBytes = (cfg.maxSizeMb ?? DEFAULT_MAX_SIZE_MB) * MB;
      if (input.size > maxBytes) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `File exceeds the ${cfg.maxSizeMb ?? DEFAULT_MAX_SIZE_MB} MB limit`,
        });
      }
      if (!matchesAccepted(input.contentType, input.filename, cfg.acceptedTypes ?? [])) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "File type not allowed" });
      }

      // Server-generated, namespaced key — never trust a client-provided key.
      const key = `${uploadPrefix(form.id)}${field.id}/${objectId()}-${safeFilename(
        input.filename,
      )}`;

      const url = await createPresignedUpload({
        key,
        contentType: input.contentType,
        maxBytes,
      });

      return { url, key };
    }),
});
