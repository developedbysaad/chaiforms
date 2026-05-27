"use client";

import { useEffect, useRef } from "react";

import type { FieldDefinition } from "@repo/services/validators";

import { FormRenderer } from "@/components/form-renderer";
import { trpc } from "@/lib/trpc";

interface FormFillerProps {
  slug: string;
  title: string;
  description?: string | null;
  fields: FieldDefinition[];
  theme: Parameters<typeof FormRenderer>[0]["theme"];
  successMessage?: string;
  password?: string;
  redirectUrl?: string | null;
  layout?: "classic" | "one_per_page";
  showProgressBar?: boolean;
  scoring?: { enabled: boolean; outcomes: { min: number; max: number; title: string; message: string }[] } | null;
}

export function FormFiller(props: FormFillerProps) {
  const submitMutation = trpc.public.submitResponse.useMutation();
  const trackMutation = trpc.public.trackEvent.useMutation();
  const startedRef = useRef(false);
  const viewedRef = useRef(false);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    trackMutation.mutate({ slug: props.slug, event: "view" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(values: Record<string, unknown>) {
    if (!startedRef.current) {
      startedRef.current = true;
      trackMutation.mutate({ slug: props.slug, event: "start" });
    }
    const completionTime = startTimeRef.current
      ? Date.now() - startTimeRef.current
      : undefined;
    // Derive the submitter's email from the actual email-type field (values are
    // keyed by field id), so confirmation emails + Reply-To work.
    const emailField = props.fields.find((f) => f.type === "email");
    const emailVal = emailField ? values[emailField.id] : undefined;
    const submitterEmail = typeof emailVal === "string" && emailVal ? emailVal : undefined;
    await submitMutation.mutateAsync({
      slug: props.slug,
      values,
      submitterEmail,
      submitterName: typeof values.name === "string" ? values.name : undefined,
      password: props.password,
      completionTime,
    });
  }

  // Track start on first interaction
  useEffect(() => {
    function onAnyInteraction() {
      if (startedRef.current) return;
      startedRef.current = true;
      startTimeRef.current = Date.now();
      trackMutation.mutate({ slug: props.slug, event: "start" });
    }
    document.addEventListener("focusin", onAnyInteraction, { once: true });
    return () => document.removeEventListener("focusin", onAnyInteraction);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FormRenderer
      slug={props.slug}
      title={props.title}
      description={props.description}
      fields={props.fields}
      theme={props.theme}
      successMessage={props.successMessage}
      redirectUrl={props.redirectUrl}
      layout={props.layout}
      showProgressBar={props.showProgressBar}
      scoring={props.scoring}
      onSubmit={handleSubmit}
    />
  );
}
