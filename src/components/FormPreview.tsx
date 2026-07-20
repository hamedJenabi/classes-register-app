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
      onSubmit={(event) => {
        event.preventDefault();
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

      <button className={styles.submitButton} type="submit">
        {form.submitButtonLabel}
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
