/**
 * Origin allowlist check. Supports exact match and wildcard subdomains
 * (e.g. "*.example.com" matches "https://www.example.com").
 */
export function originAllowed(origin: string | undefined, allowed: string[] | null): boolean {
  if (!allowed || allowed.length === 0) return false;
  if (!origin) return allowed.includes("*"); // explicit opt-in for server-side use
  let host: string;
  try {
    host = new URL(origin).host;
  } catch {
    return false;
  }
  for (const rule of allowed) {
    if (rule === "*") return true;
    let ruleHost: string;
    try {
      ruleHost = new URL(rule).host || rule.replace(/^https?:\/\//, "");
    } catch {
      ruleHost = rule;
    }
    if (ruleHost === host) return true;
    if (ruleHost.startsWith("*.")) {
      const suffix = ruleHost.slice(2);
      if (host === suffix || host.endsWith("." + suffix)) return true;
    }
  }
  return false;
}

export function normalizeOrigin(value: string): string {
  try {
    const u = new URL(value);
    return `${u.protocol}//${u.host}`;
  } catch {
    return value;
  }
}
