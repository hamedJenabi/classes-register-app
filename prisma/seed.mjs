import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const form = {
  id: "seed_form_blues_foundations",
  title: "Blues Foundations Registration",
  slug: "blues-foundations",
  description: "A local preview for the first generic registration form.",
  status: "DRAFT",
  submitButtonLabel: "Register",
  successMessage: "Thanks for registering. We will be in touch soon.",
};

const fields = [
  {
    id: "seed_field_name",
    key: "name",
    label: "Full name",
    type: "TEXT",
    required: true,
    placeholder: "Your name",
  },
  {
    id: "seed_field_email",
    key: "email",
    label: "Email",
    type: "EMAIL",
    required: true,
    placeholder: "you@example.com",
  },
  {
    id: "seed_field_phone",
    key: "phone",
    label: "Phone",
    type: "PHONE",
    placeholder: "+43 ...",
  },
  {
    id: "seed_field_class",
    key: "class",
    label: "Class option",
    type: "SINGLE_SELECT",
    required: true,
    helpText: "Full options are disabled from backend availability.",
  },
  {
    id: "seed_field_has_partner",
    key: "has_partner",
    label: "Are you registering with a partner?",
    type: "BOOLEAN",
  },
  {
    id: "seed_field_partner_name",
    key: "partner_name",
    label: "Partner name",
    type: "TEXT",
    placeholder: "Partner full name",
  },
  {
    id: "seed_field_notes",
    key: "notes",
    label: "Anything we should know?",
    type: "TEXTAREA",
    placeholder: "Accessibility, role preference, schedule notes...",
  },
];

const options = [
  {
    id: "seed_option_beginner_tuesday",
    fieldId: "seed_field_class",
    label: "Beginner blues, Tuesday",
    value: "beginner-tuesday",
    capacity: 18,
  },
  {
    id: "seed_option_intermediate_thursday",
    fieldId: "seed_field_class",
    label: "Intermediate blues, Thursday",
    value: "intermediate-thursday",
    capacity: 16,
  },
];

const rule = {
  id: "seed_rule_partner_name_visible",
  targetFieldId: "seed_field_partner_name",
  sourceFieldId: "seed_field_has_partner",
  operator: "EQUALS",
  comparisonValue: true,
  action: "SHOW",
};

const seededClassSelections = [
  ...Array.from({ length: 11 }, (_, index) => ({
    registrationId: `seed_registration_beginner_${String(index + 1).padStart(2, "0")}`,
    answerId: `seed_answer_beginner_${String(index + 1).padStart(2, "0")}`,
    participantName: `Beginner Student ${index + 1}`,
    participantEmail: `beginner${index + 1}@example.com`,
    optionId: "seed_option_beginner_tuesday",
    value: "beginner-tuesday",
  })),
  ...Array.from({ length: 16 }, (_, index) => ({
    registrationId: `seed_registration_intermediate_${String(index + 1).padStart(2, "0")}`,
    answerId: `seed_answer_intermediate_${String(index + 1).padStart(2, "0")}`,
    participantName: `Intermediate Student ${index + 1}`,
    participantEmail: `intermediate${index + 1}@example.com`,
    optionId: "seed_option_intermediate_thursday",
    value: "intermediate-thursday",
  })),
];

function requireDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed the database.");
  }

  return process.env.DATABASE_URL;
}

async function seed() {
  const pool = new Pool({ connectionString: requireDatabaseUrl() });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingForm = await client.query(
      `SELECT id FROM "Form" WHERE slug = $1`,
      [form.slug],
    );
    const formId = existingForm.rows[0]?.id ?? form.id;

    await client.query(`DELETE FROM "Registration" WHERE "formId" = $1`, [
      formId,
    ]);
    await client.query(`DELETE FROM "ConditionalRule" WHERE "formId" = $1`, [
      formId,
    ]);
    await client.query(`DELETE FROM "Field" WHERE "formId" = $1`, [formId]);

    if (existingForm.rowCount) {
      await client.query(
        `
          UPDATE "Form"
          SET title = $2,
              description = $3,
              status = $4::"FormStatus",
              "submitButtonLabel" = $5,
              "successMessage" = $6,
              "updatedAt" = NOW()
          WHERE id = $1
        `,
        [
          formId,
          form.title,
          form.description,
          form.status,
          form.submitButtonLabel,
          form.successMessage,
        ],
      );
    } else {
      await client.query(
        `
          INSERT INTO "Form" (
            id, title, slug, description, status, "submitButtonLabel",
            "successMessage", "createdAt", "updatedAt"
          )
          VALUES ($1, $2, $3, $4, $5::"FormStatus", $6, $7, NOW(), NOW())
        `,
        [
          formId,
          form.title,
          form.slug,
          form.description,
          form.status,
          form.submitButtonLabel,
          form.successMessage,
        ],
      );
    }

    for (const [index, field] of fields.entries()) {
      await client.query(
        `
          INSERT INTO "Field" (
            id, "formId", key, label, "helpText", placeholder, type, required,
            "sortOrder", config, "createdAt", "updatedAt"
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7::"FieldType", $8,
            $9, $10::jsonb, NOW(), NOW()
          )
        `,
        [
          field.id,
          formId,
          field.key,
          field.label,
          field.helpText ?? null,
          field.placeholder ?? null,
          field.type,
          field.required ?? false,
          index,
          null,
        ],
      );
    }

    for (const [index, option] of options.entries()) {
      await client.query(
        `
          INSERT INTO "FieldOption" (
            id, "fieldId", label, value, "sortOrder", capacity, "priceCents",
            currency, "createdAt", "updatedAt"
          )
          VALUES ($1, $2, $3, $4, $5, $6, NULL, NULL, NOW(), NOW())
        `,
        [
          option.id,
          option.fieldId,
          option.label,
          option.value,
          index,
          option.capacity,
        ],
      );
    }

    await client.query(
      `
        INSERT INTO "ConditionalRule" (
          id, "formId", "targetFieldId", "sourceFieldId", operator,
          "comparisonValue", action, "sortOrder", "createdAt", "updatedAt"
        )
        VALUES (
          $1, $2, $3, $4, $5::"ConditionOperator",
          $6::jsonb, $7::"ConditionalAction", 0, NOW(), NOW()
        )
      `,
      [
        rule.id,
        formId,
        rule.targetFieldId,
        rule.sourceFieldId,
        rule.operator,
        JSON.stringify(rule.comparisonValue),
        rule.action,
      ],
    );

    for (const selection of seededClassSelections) {
      await client.query(
        `
          INSERT INTO "Registration" (
            id, "formId", status, "submittedAt", "participantName",
            "participantEmail", "paymentStatus", "createdAt", "updatedAt"
          )
          VALUES (
            $1, $2, $3::"RegistrationStatus", NOW(), $4,
            $5, $6::"PaymentStatus", NOW(), NOW()
          )
        `,
        [
          selection.registrationId,
          formId,
          "SUBMITTED",
          selection.participantName,
          selection.participantEmail,
          "NOT_REQUIRED",
        ],
      );

      await client.query(
        `
          INSERT INTO "Answer" (
            id, "registrationId", "fieldId", "fieldOptionId", value
          )
          VALUES ($1, $2, $3, $4, $5::jsonb)
        `,
        [
          selection.answerId,
          selection.registrationId,
          "seed_field_class",
          selection.optionId,
          JSON.stringify(selection.value),
        ],
      );
    }

    await client.query("COMMIT");

    console.log(
      `Seeded "${form.title}" with ${fields.length} fields, ${options.length} options, and ${seededClassSelections.length} registrations.`,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
