import { and, db, eq } from "@repo/database";
import { fields, forms } from "@repo/database/schema";

/** Drizzle instance type, derived from the exported `db` to avoid coupling to a named export. */
type Database = typeof db;

/**
 * Thrown when the caller does not own (or there is no) form/field. The transport
 * layer (tRPC) maps this to NOT_FOUND. We deliberately raise the same error for
 * "not yours" and "doesn't exist" so ownership can't be probed.
 *
 * Kept transport-agnostic (a plain Error subclass) so @repo/services doesn't
 * depend on @trpc/server.
 */
export class OwnershipError extends Error {
  /** Marker matching the tRPC error code the server should surface. */
  readonly code = "NOT_FOUND" as const;

  constructor(message = "Not found") {
    super(message);
    this.name = "OwnershipError";
  }
}

/**
 * NOT_FOUND is intentional. Don't reveal whether the form exists if the user
 * doesn't own it — same response shape as "doesn't exist".
 */
export async function assertFormOwner(
  db: Database,
  formId: string,
  userId: string,
): Promise<void> {
  const form = await db.query.forms.findFirst({
    where: and(eq(forms.id, formId), eq(forms.userId, userId)),
    columns: { id: true },
  });
  if (!form) {
    throw new OwnershipError();
  }
}

export async function assertFieldOwner(
  db: Database,
  fieldId: string,
  userId: string,
): Promise<{ formId: string }> {
  const row = await db.query.fields.findFirst({
    where: eq(fields.id, fieldId),
    columns: { id: true, formId: true },
    with: { form: { columns: { userId: true } } },
  });
  if (!row || row.form?.userId !== userId) {
    throw new OwnershipError();
  }
  return { formId: row.formId };
}
