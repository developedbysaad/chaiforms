import { customAlphabet } from "nanoid";

const SLUG_NANOID = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export function makeAutoSlug(title: string): string {
  const base = slugify(title) || "form";
  return `${base}-${SLUG_NANOID()}`;
}
