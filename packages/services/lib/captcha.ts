import type { CaptchaProvider } from "@repo/database/schema";

import { env } from "../env";

/**
 * Verify an h-captcha-response or g-recaptcha-response token server-side.
 * Returns `true` if the captcha is satisfied OR the form has no captcha enabled.
 */
export async function verifyCaptcha(opts: {
  provider: CaptchaProvider;
  secret: string | null;
  token: string | undefined;
  remoteIp?: string;
}): Promise<boolean> {
  if (opts.provider === "none") return true;
  if (!opts.secret || !opts.token) return false;

  const url =
    opts.provider === "hcaptcha" ? env.HCAPTCHA_VERIFY_URL : env.RECAPTCHA_VERIFY_URL;

  const body = new URLSearchParams({
    secret: opts.secret,
    response: opts.token,
    ...(opts.remoteIp ? { remoteip: opts.remoteIp } : {}),
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) return false;
    const json = (await res.json()) as { success?: boolean };
    return !!json.success;
  } catch (err) {
    console.error("[captcha] verification call failed:", err);
    return false;
  }
}
