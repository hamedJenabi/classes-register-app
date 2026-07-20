export type FieldType =
  | "text"
  | "textarea"
  | "email"
  | "phone"
  | "single-select"
  | "multi-select"
  | "boolean"
  | "date"
  | "number";

export type ConditionOperator = "equals" | "not-equals" | "includes";

export type FieldOptionBlueprint = {
  id: string;
  label: string;
  value: string;
  capacity?: number;
  registeredCount?: number;
};

export type ConditionalRuleBlueprint = {
  sourceFieldKey: string;
  operator: ConditionOperator;
  value: string | boolean | number;
};

export type FieldBlueprint = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: FieldOptionBlueprint[];
  visibleWhen?: ConditionalRuleBlueprint;
};

export type FormBlueprint = {
  title: string;
  slug: string;
  description: string;
  submitButtonLabel: string;
  fields: FieldBlueprint[];
};

export function isOptionFull(option: FieldOptionBlueprint) {
  return (
    typeof option.capacity === "number" &&
    typeof option.registeredCount === "number" &&
    option.registeredCount >= option.capacity
  );
}

export const sampleFormBlueprint: FormBlueprint = {
  title: "Blues Foundations Registration",
  slug: "blues-foundations",
  description: "A local preview for the first generic registration form.",
  submitButtonLabel: "Register",
  fields: [
    {
      key: "name",
      label: "Full name",
      type: "text",
      required: true,
      placeholder: "Your name",
    },
    {
      key: "email",
      label: "Email",
      type: "email",
      required: true,
      placeholder: "you@example.com",
    },
    {
      key: "phone",
      label: "Phone",
      type: "phone",
      placeholder: "+43 ...",
    },
    {
      key: "class",
      label: "Class option",
      type: "single-select",
      required: true,
      helpText: "Full options are disabled from backend availability.",
      options: [
        {
          id: "option-beginner",
          label: "Beginner blues, Tuesday",
          value: "beginner-tuesday",
          capacity: 18,
          registeredCount: 11,
        },
        {
          id: "option-intermediate",
          label: "Intermediate blues, Thursday",
          value: "intermediate-thursday",
          capacity: 16,
          registeredCount: 16,
        },
      ],
    },
    {
      key: "has_partner",
      label: "Are you registering with a partner?",
      type: "boolean",
    },
    {
      key: "partner_name",
      label: "Partner name",
      type: "text",
      placeholder: "Partner full name",
      visibleWhen: {
        sourceFieldKey: "has_partner",
        operator: "equals",
        value: true,
      },
    },
    {
      key: "notes",
      label: "Anything we should know?",
      type: "textarea",
      placeholder: "Accessibility, role preference, schedule notes...",
    },
  ],
};
