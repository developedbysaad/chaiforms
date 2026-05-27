import type { RouterOutputs } from "@repo/trpc/client";

export type AdminStats = RouterOutputs["admin"]["getStats"];
export type AdminForm = RouterOutputs["admin"]["listForms"]["items"][number];
export type AdminUser = RouterOutputs["admin"]["listUsers"]["items"][number];

export type FormStatus = "draft" | "published" | "archived";
export type FormVisibility = "public" | "unlisted";
export type UserRole = "user" | "admin";
