import { and, db, eq, gte, lte } from "@repo/database";
import { forms, responses } from "@repo/database/schema";

import { publicUrl } from "./storage";

/**
 * Normalized, format-agnostic export dataset built straight from the DB —
 * the single source of truth. CSV / XLSX / PDF formatters all consume this,
 * and a re-export is just another read. Handles both form surfaces:
 *   - hosted forms   → one column per field, values from response_values
 *   - endpoint forms → columns are the union of payload keys (first-seen order)
 */
export interface ExportDataset {
  form: { id: string; title: string; slug: string; type: "hosted" | "endpoint" };
  columns: string[];
  rows: (string | number | null)[][];
  generatedAt: Date;
  total: number;
}

export interface ExportFilters {
  from?: Date;
  to?: Date;
}

const META_COLUMNS = ["Submitted at", "Submitter email", "Submitter name", "Completion (ms)"];
const ENDPOINT_CONTROL_KEYS = new Set([
  "access_key",
  "botcheck",
  "h-captcha-response",
  "g-recaptcha-response",
  "redirect",
]);

function cellValue(v: unknown): string | number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") {
    // file_upload values → "filename (public URL)" so exports link to the file.
    const f = v as Record<string, unknown>;
    if (typeof f.key === "string" && typeof f.name === "string") {
      return `${f.name} (${publicUrl(f.key)})`;
    }
    // Address-style objects → "a, b, c" of their non-empty parts.
    const parts = Object.values(v).filter((x) => x !== null && x !== undefined && x !== "");
    return parts.length ? parts.join(", ") : null;
  }
  // Don't dump a multi-KB signature data-URL into a cell.
  if (typeof v === "string" && v.startsWith("data:image")) return "[signature]";
  return String(v);
}

export async function buildExportDataset(
  formId: string,
  filters: ExportFilters = {},
): Promise<ExportDataset> {
  const form = await db.query.forms.findFirst({
    where: eq(forms.id, formId),
    with: { fields: { orderBy: (f, { asc }) => [asc(f.order)] } },
  });
  if (!form) throw new Error("Form not found");

  const where = and(
    eq(responses.formId, formId),
    filters.from ? gte(responses.createdAt, filters.from) : undefined,
    filters.to ? lte(responses.createdAt, filters.to) : undefined,
  );

  const formMeta = {
    id: form.id,
    title: form.title,
    slug: form.slug,
    type: form.type as "hosted" | "endpoint",
  };

  if (form.type === "endpoint") {
    const rows = await db.query.responses.findMany({
      where,
      orderBy: (r, { desc }) => [desc(r.createdAt)],
    });
    // Union of payload keys across all rows, preserving first-seen order.
    const keys: string[] = [];
    const seen = new Set<string>();
    for (const r of rows) {
      const payload = (r.payload ?? {}) as Record<string, unknown>;
      for (const k of Object.keys(payload)) {
        if (ENDPOINT_CONTROL_KEYS.has(k) || seen.has(k)) continue;
        seen.add(k);
        keys.push(k);
      }
    }
    const data = rows.map((r) => {
      const payload = (r.payload ?? {}) as Record<string, unknown>;
      return [
        r.createdAt.toISOString(),
        r.submitterEmail ?? null,
        r.submitterName ?? null,
        r.completionTime ?? null,
        ...keys.map((k) => cellValue(payload[k])),
      ];
    });
    return {
      form: formMeta,
      columns: [...META_COLUMNS, ...keys],
      rows: data,
      generatedAt: new Date(),
      total: rows.length,
    };
  }

  // Hosted form: one column per answerable field (page breaks carry no value).
  const rows = await db.query.responses.findMany({
    where,
    with: { values: true },
    orderBy: (r, { desc }) => [desc(r.createdAt)],
  });
  const cols = form.fields.filter((f) => f.type !== "page_break");
  const fieldIds = cols.map((f) => f.id);
  const data = rows.map((r) => {
    const byField = new Map(r.values.map((v) => [v.fieldId, v.value]));
    return [
      r.createdAt.toISOString(),
      r.submitterEmail ?? null,
      r.submitterName ?? null,
      r.completionTime ?? null,
      ...fieldIds.map((id) => cellValue(byField.get(id))),
    ];
  });
  return {
    form: formMeta,
    columns: [...META_COLUMNS, ...cols.map((f) => f.label)],
    rows: data,
    generatedAt: new Date(),
    total: rows.length,
  };
}
