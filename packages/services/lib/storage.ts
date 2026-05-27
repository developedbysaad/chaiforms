import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "../env";

/**
 * Cloudflare R2 (S3-compatible) storage for the file_upload field type.
 *
 * Everything here is gated behind isStorageConfigured(): if any R2 env var is
 * absent the feature is simply unavailable — core forms keep working with zero
 * file-upload config. Callers MUST check isStorageConfigured() (or handle the
 * thrown error) before relying on the client / URLs.
 */

const DEFAULT_PRESIGN_TTL_SECONDS = 300; // 5 minutes is plenty for a single PUT.

/** True only when every R2 env var needed to talk to the bucket is present. */
export function isStorageConfigured(): boolean {
  return Boolean(
    env.R2_ACCOUNT_ID &&
      env.R2_ACCESS_KEY_ID &&
      env.R2_SECRET_ACCESS_KEY &&
      env.R2_BUCKET &&
      env.R2_PUBLIC_BASE_URL,
  );
}

let client: S3Client | null = null;

/** Lazily build (and cache) the S3 client pointed at the R2 account endpoint. */
function getClient(): S3Client {
  if (!isStorageConfigured()) {
    throw new Error("R2 storage is not configured");
  }
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      forcePathStyle: true,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID as string,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY as string,
      },
    });
  }
  return client;
}

export interface CreatePresignedUploadInput {
  /** Namespaced object key (e.g. uploads/<formId>/<fieldId>/<id>-<name>). */
  key: string;
  contentType: string;
  /**
   * Upper bound on the object size. Enforced server-side in the presign router
   * (which rejects oversized requests before signing) — we deliberately do NOT
   * sign a fixed ContentLength, since that would force the PUT body to be
   * exactly this many bytes rather than the actual (smaller) file.
   */
  maxBytes: number;
}

/**
 * Return a presigned PUT URL the browser uploads the file to directly. The URL
 * is bound to the exact key + content-type.
 */
export async function createPresignedUpload(
  input: CreatePresignedUploadInput,
): Promise<string> {
  // maxBytes is validated upstream; intentionally not bound into the signature.
  void input.maxBytes;
  const cmd = new PutObjectCommand({
    Bucket: env.R2_BUCKET as string,
    Key: input.key,
    ContentType: input.contentType,
  });
  return getSignedUrl(getClient(), cmd, { expiresIn: DEFAULT_PRESIGN_TTL_SECONDS });
}

/** Build a public read/download URL for a stored object key. */
export function publicUrl(key: string): string {
  const base = (env.R2_PUBLIC_BASE_URL ?? "").replace(/\/$/, "");
  return `${base}/${key.replace(/^\/+/, "")}`;
}
