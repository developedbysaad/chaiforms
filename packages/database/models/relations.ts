import { relations } from "drizzle-orm";

import { accessKeyVerifications } from "./access-key-verifications";
import { analyticsEvents } from "./analytics";
import { endpointAudit } from "./endpoint-audit";
import { fields } from "./fields";
import { formIntegrations } from "./form-integrations";
import { forms } from "./forms";
import { googleConnections } from "./google-connections";
import { responses } from "./responses";
import { responseValues } from "./response-values";
import { sessions } from "./sessions";
import { themes } from "./themes";
import { users } from "./users";

export const usersRelations = relations(users, ({ one, many }) => ({
  forms: many(forms),
  sessions: many(sessions),
  googleConnection: one(googleConnections, {
    fields: [users.id],
    references: [googleConnections.userId],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const themesRelations = relations(themes, ({ many }) => ({
  forms: many(forms),
}));

export const formsRelations = relations(forms, ({ one, many }) => ({
  user: one(users, { fields: [forms.userId], references: [users.id] }),
  theme: one(themes, { fields: [forms.themeId], references: [themes.id] }),
  fields: many(fields),
  responses: many(responses),
  analyticsEvents: many(analyticsEvents),
  verifications: many(accessKeyVerifications),
  audit: many(endpointAudit),
  integrations: many(formIntegrations),
}));

export const formIntegrationsRelations = relations(formIntegrations, ({ one }) => ({
  form: one(forms, { fields: [formIntegrations.formId], references: [forms.id] }),
}));

export const googleConnectionsRelations = relations(googleConnections, ({ one }) => ({
  user: one(users, { fields: [googleConnections.userId], references: [users.id] }),
}));

export const fieldsRelations = relations(fields, ({ one, many }) => ({
  form: one(forms, { fields: [fields.formId], references: [forms.id] }),
  values: many(responseValues),
}));

export const responsesRelations = relations(responses, ({ one, many }) => ({
  form: one(forms, { fields: [responses.formId], references: [forms.id] }),
  values: many(responseValues),
}));

export const responseValuesRelations = relations(responseValues, ({ one }) => ({
  response: one(responses, {
    fields: [responseValues.responseId],
    references: [responses.id],
  }),
  field: one(fields, { fields: [responseValues.fieldId], references: [fields.id] }),
}));

export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  form: one(forms, { fields: [analyticsEvents.formId], references: [forms.id] }),
}));

export const accessKeyVerificationsRelations = relations(
  accessKeyVerifications,
  ({ one }) => ({
    form: one(forms, {
      fields: [accessKeyVerifications.formId],
      references: [forms.id],
    }),
  }),
);

export const endpointAuditRelations = relations(endpointAudit, ({ one }) => ({
  form: one(forms, { fields: [endpointAudit.formId], references: [forms.id] }),
  actor: one(users, { fields: [endpointAudit.actorId], references: [users.id] }),
}));
