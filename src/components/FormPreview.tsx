"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import {
  type FieldBlueprint,
  type FormBlueprint,
  isOptionFull,
} from "@/lib/form-blueprint";
import styles from "./FormPreview.module.scss";

type FormValue = string | boolean | string[];
type FormValues = Record<string, FormValue>;

type FormPreviewProps = {
  form: FormBlueprint;
};

function evaluateFieldVisibility(field: FieldBlueprint, values: FormValues) {
  if (!field.visibleWhen) {
    return true;
  }

  const currentValue = values[field.visibleWhen.sourceFieldKey];
  const expectedValue = field.visibleWhen.value;

  if (field.visibleWhen.operator === "equals") {
    return currentValue === expectedValue;
  }

  if (field.visibleWhen.operator === "not-equals") {
    return currentValue !== expectedValue;
  }

  if (field.visibleWhen.operator === "includes") {
    return Array.isArray(currentValue) && currentValue.includes(String(expectedValue));
  }

  return true;
}

export function FormPreview({ form }: FormPreviewProps) {
  const [values, setValues] = useState<FormValues>({});
  const [submitState, setSubmitState] = useState<
    | { status: "idle" }
    | { status: "submitting" }
    | { status: "success"; message: string }
    | { status: "error"; errors: string[] }
  >({ status: "idle" });

  const visibleFields = useMemo(
    () => form.fields.filter((field) => evaluateFieldVisibility(field, values)),
    [form.fields, values],
  );

  function setFieldValue(key: string, value: FormValue) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function toggleMultiSelect(key: string, optionValue: string, checked: boolean) {
    const currentValue = values[key];
    const selectedValues = Array.isArray(currentValue) ? currentValue : [];
    const nextValues = checked
      ? [...selectedValues, optionValue]
      : selectedValues.filter((value) => value !== optionValue);

    setFieldValue(key, nextValues);
  }

  return (
    <form
      className={styles.form}
      onSubmit={async (event) => {
        event.preventDefault();

        setSubmitState({ status: "submitting" });

        const response = await fetch(`/api/forms/${form.slug}/registrations`, {
          body: JSON.stringify({ answers: values }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        });
        const result = (await response.json()) as
          | { ok: true; message: string }
          | { ok: false; errors: string[] };

        if (result.ok) {
          setSubmitState({ status: "success", message: result.message });
          setValues({});
          return;
        }

        setSubmitState({ status: "error", errors: result.errors });
      }}
    >
      <div className={styles.fields}>
        {visibleFields.map((field) => (
          <div className={styles.field} key={field.key}>
            <label htmlFor={field.key}>
              {field.label}
              {field.required ? <span>*</span> : null}
            </label>
            {field.helpText ? <p>{field.helpText}</p> : null}
            <FieldControl
              field={field}
              onChange={setFieldValue}
              onMultiSelectChange={toggleMultiSelect}
              value={values[field.key]}
            />
          </div>
        ))}
      </div>

      {submitState.status === "success" ? (
        <p className={styles.successMessage}>{submitState.message}</p>
      ) : null}
      {submitState.status === "error" ? (
        <div className={styles.errorMessage} role="alert">
          {submitState.errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}

      <button
        className={styles.submitButton}
        disabled={submitState.status === "submitting"}
        type="submit"
      >
        {submitState.status === "submitting" ? "Submitting..." : form.submitButtonLabel}
      </button>
    </form>
  );
}

type FieldControlProps = {
  field: FieldBlueprint;
  value: FormValue | undefined;
  onChange: (key: string, value: FormValue) => void;
  onMultiSelectChange: (key: string, optionValue: string, checked: boolean) => void;
};

function FieldControl({
  field,
  value,
  onChange,
  onMultiSelectChange,
}: FieldControlProps) {
  if (field.type === "textarea") {
    return (
      <textarea
        id={field.key}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
          onChange(field.key, event.target.value)
        }
        placeholder={field.placeholder}
        rows={4}
        value={typeof value === "string" ? value : ""}
      />
    );
  }

  if (field.type === "single-select") {
    return (
      <div className={styles.optionStack}>
        {(field.options ?? []).map((option) => {
          const full = isOptionFull(option);

          return (
            <label className={styles.option} data-disabled={full} key={option.id}>
              <input
                checked={value === option.value}
                disabled={full}
                name={field.key}
                onChange={() => onChange(field.key, option.value)}
                type="radio"
              />
              <span>{option.label}</span>
              {typeof option.capacity === "number" ? (
                <small>
                  {option.registeredCount ?? 0}/{option.capacity}
                </small>
              ) : null}
            </label>
          );
        })}
      </div>
    );
  }

  if (field.type === "multi-select") {
    const selectedValues = Array.isArray(value) ? value : [];

    return (
      <div className={styles.optionStack}>
        {(field.options ?? []).map((option) => {
          const full = isOptionFull(option);

          return (
            <label className={styles.option} data-disabled={full} key={option.id}>
              <input
                checked={selectedValues.includes(option.value)}
                disabled={full}
                onChange={(event) =>
                  onMultiSelectChange(field.key, option.value, event.target.checked)
                }
                type="checkbox"
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    );
  }

  if (field.type === "boolean") {
    return (
      <label className={styles.switch}>
        <input
          checked={value === true}
          onChange={(event) => onChange(field.key, event.target.checked)}
          type="checkbox"
        />
        <span>Yes</span>
      </label>
    );
  }

  const inputType =
    field.type === "phone" ? "tel" : field.type === "number" ? "number" : field.type;

  return (
    <input
      id={field.key}
      onChange={(event: ChangeEvent<HTMLInputElement>) =>
        onChange(field.key, event.target.value)
      }
      placeholder={field.placeholder}
      type={inputType}
      value={typeof value === "string" ? value : ""}
    />
  );
}
