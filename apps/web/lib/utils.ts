import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelative(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString();
}

export function applyThemeVars(config: {
  background: string;
  surface: string;
  text: string;
  textMuted?: string;
  accent: string;
  accentText: string;
  border: string;
  fontFamily: string;
  borderRadius: "none" | "sm" | "md" | "lg" | "full";
}): React.CSSProperties {
  const radiusMap = { none: "0", sm: "4px", md: "10px", lg: "16px", full: "9999px" };
  return {
    ["--form-bg" as never]: config.background,
    ["--form-surface" as never]: config.surface,
    ["--form-text" as never]: config.text,
    ["--form-text-muted" as never]: config.textMuted ?? config.text,
    ["--form-accent" as never]: config.accent,
    ["--form-accent-text" as never]: config.accentText,
    ["--form-border" as never]: config.border,
    ["--form-font" as never]: config.fontFamily,
    ["--form-radius" as never]: radiusMap[config.borderRadius] ?? "10px",
  };
}
