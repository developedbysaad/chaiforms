/**
 * Shared JSONB shapes — kept in one place so DB + validators + UI stay in sync.
 * Drizzle uses these via .$type<...>(), Zod re-implements them as schemas.
 */

// ---- Themes ---------------------------------------------------------------

export type ThemeBorderRadius = "none" | "sm" | "md" | "lg" | "full";

export interface ThemeConfig {
  // Colors
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  accent: string;
  accentText: string;
  border: string;
  error: string;

  // Typography
  fontFamily: string;
  fontUrl: string;
  headingWeight: number;

  // Shape
  borderRadius: ThemeBorderRadius;

  // Flair
  pattern?: string;
  logoEmoji?: string;
}

// ---- Forms ----------------------------------------------------------------

export type FormStatus = "draft" | "published" | "archived";
export type FormVisibility = "public" | "unlisted";

export interface ScoringOutcome {
  min: number;
  max: number;
  title: string;
  message: string;
}

export interface FormSettings {
  allowMultipleSubmissions: boolean;
  requireEmail: boolean;
  sendConfirmationEmail: boolean;
  notifyCreator: boolean;
  successMessage: string;
  redirectUrl: string | null;
  passwordHash: string | null;
  // Wave 2 — optional (older rows won't have them).
  layout?: "classic" | "one_per_page";
  showProgressBar?: boolean;
  confirmationEmailMessage?: string;
  scoring?: { enabled: boolean; outcomes: ScoringOutcome[] };
}

export const DEFAULT_FORM_SETTINGS: FormSettings = {
  allowMultipleSubmissions: true,
  requireEmail: false,
  sendConfirmationEmail: false,
  notifyCreator: true,
  successMessage: "Got it. Thanks for filling this out.",
  redirectUrl: null,
  passwordHash: null,
};

// ---- Fields ---------------------------------------------------------------

export type FieldType =
  | "short_text"
  | "long_text"
  | "email"
  | "number"
  | "single_select"
  | "multi_select"
  | "checkbox"
  | "rating"
  | "date"
  | "phone"
  | "url"
  | "linear_scale"
  | "ranking"
  | "address"
  | "time"
  | "signature"
  | "file_upload"
  | "page_break";

export type RatingStyle = "star" | "number" | "emoji";

export interface SelectOption {
  label: string;
  value: string;
  score?: number;
}

export type FieldConfig = {
  options?: SelectOption[];
  maxRating?: number;
  ratingStyle?: RatingStyle;
  min?: number;
  max?: number;
  step?: number;
  minLength?: number;
  maxLength?: number;
  minDate?: string;
  maxDate?: string;
  includeTime?: boolean;
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  hidden?: boolean;
  prefillKey?: string;
  // file_upload
  maxSizeMb?: number;
  acceptedTypes?: string[];
};

export type ConditionalOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "is_filled"
  | "is_empty";

export interface ConditionalRule {
  fieldId: string;
  operator: ConditionalOperator;
  value?: unknown;
}

export interface ConditionalLogic {
  showIf: ConditionalRule[];
}

// ---- Responses ------------------------------------------------------------

/** A file_upload answer: metadata + the R2 object key (never a public URL). */
export interface FileUploadValue {
  key: string;
  name: string;
  size: number;
  type: string;
}

export type ResponseValue =
  | string
  | string[]
  | number
  | boolean
  | FileUploadValue
  | Record<string, unknown>
  | null;

// ---- Analytics ------------------------------------------------------------

export type AnalyticsEventType = "view" | "start" | "submit" | "abandon";

export interface AnalyticsMetadata {
  fieldId?: string;
  [key: string]: unknown;
}

// ---- Endpoint forms -------------------------------------------------------

export type FormType = "hosted" | "endpoint";
export type CaptchaProvider = "none" | "hcaptcha" | "recaptcha" | "turnstile";

export interface EncryptedSecret {
  ciphertext: string;
  iv: string;
  authTag: string;
  salt: string;
}

export interface EndpointSettings {
  honeypotEnabled: boolean;
  captchaProvider: CaptchaProvider;
  captchaSiteKey: string | null;
  captchaSecret: EncryptedSecret | null;
  subjectTemplate: string;
  notifyEmails: string[];
  redirectUrl: string | null;
  webhookUrl: string | null;
  webhookSigningSecret: string | null;
  allowServerSide: boolean;
}

export const DEFAULT_ENDPOINT_SETTINGS: EndpointSettings = {
  honeypotEnabled: true,
  captchaProvider: "none",
  captchaSiteKey: null,
  captchaSecret: null,
  subjectTemplate: "New submission from {form_name}",
  notifyEmails: [],
  redirectUrl: null,
  webhookUrl: null,
  webhookSigningSecret: null,
  allowServerSide: false,
};

export type SubmissionType = "hosted" | "endpoint";

export type EndpointAuditAction =
  | "key_rotated"
  | "recipient_changed"
  | "captcha_toggled"
  | "allowlist_changed"
  | "verification_sent"
  | "verified";

// ---- Integrations ---------------------------------------------------------

export type IntegrationType = "discord" | "sheets";

export interface DiscordIntegrationConfig {
  webhookUrl: string;
}

export interface SheetsIntegrationConfig {
  spreadsheetId: string;
  sheetName: string;
}

export type FormIntegrationConfig = DiscordIntegrationConfig | SheetsIntegrationConfig;

/** Stored encrypted in `google_connections.tokensEnc` (JSON-stringified). */
export interface GoogleTokens {
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null;
}
