import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { fieldTypeOptions, formatFieldTypeLabel } from "@/lib/field-types";
import {
  formatFormStatus,
  getPersistedFormDefinition,
} from "@/lib/forms";
import {
  createFieldAction,
  createOptionAction,
  updateFieldAction,
  updateOptionAction,
} from "./actions";
import styles from "./page.module.scss";

type DashboardFormPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function DashboardFormPage({
  params,
}: DashboardFormPageProps) {
  const { slug } = await params;
  const form = await getPersistedFormDefinition(slug);

  if (!form) {
    notFound();
  }

  return (
    <AppShell
      eyebrow="Form detail"
      title={form.title}
      description={form.description}
      actions={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Preview", href: `/forms/${form.slug}` },
      ]}
    >
      <section className={styles.summary} aria-label="Form summary">
        <article>
          <span>Status</span>
          <strong>{formatFormStatus(form.status)}</strong>
        </article>
        <article>
          <span>Fields</span>
          <strong>{form.fields.length}</strong>
        </article>
        <article>
          <span>Capacity options</span>
          <strong>{form.capacityOptionCount}</strong>
        </article>
        <article>
          <span>Registrations</span>
          <strong>{form.registrationCount}</strong>
        </article>
      </section>

      <section className={styles.editorPanel} aria-label="Add field">
        <div className={styles.sectionHeader}>
          <div>
            <span>Field editor</span>
            <h2>Add a field</h2>
          </div>
          <p>{fieldTypeOptions.length} MVP field types</p>
        </div>

        <form action={createFieldAction} className={styles.fieldEditor}>
          <input name="formId" type="hidden" value={form.id} />
          <input name="formSlug" type="hidden" value={form.slug} />

          <label>
            Label
            <input name="label" placeholder="Dietary notes" required />
          </label>
          <label>
            Key
            <input name="key" placeholder="dietary_notes" />
          </label>
          <label>
            Type
            <select name="type" defaultValue="TEXT">
              {fieldTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sort order
            <input
              name="sortOrder"
              type="number"
              defaultValue={form.fields.length}
            />
          </label>
          <label className={styles.wideControl}>
            Placeholder
            <input name="placeholder" placeholder="Optional prompt text" />
          </label>
          <label className={styles.wideControl}>
            Help text
            <textarea
              name="helpText"
              placeholder="Optional helper copy for participants"
              rows={2}
            />
          </label>
          <label className={styles.checkboxControl}>
            <input name="required" type="checkbox" />
            Required
          </label>
          <button type="submit">Add field</button>
        </form>
      </section>

      <section className={styles.fields} aria-label="Form fields">
        {form.fields.map((field, index) => (
          <article className={styles.fieldCard} key={field.key}>
            <div className={styles.fieldHeader}>
              <div>
                <span>
                  {index + 1}. {formatFieldTypeLabel(field.dbType)}
                </span>
                <h2>{field.label}</h2>
              </div>
              {field.required ? <strong>Required</strong> : null}
            </div>

            <form action={updateFieldAction} className={styles.fieldEditor}>
              <input name="fieldId" type="hidden" value={field.id} />
              <input name="formSlug" type="hidden" value={form.slug} />

              <label>
                Label
                <input name="label" required defaultValue={field.label} />
              </label>
              <label>
                Key
                <input name="key" required defaultValue={field.key} />
              </label>
              <label>
                Type
                <select name="type" defaultValue={field.dbType}>
                  {fieldTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Sort order
                <input
                  name="sortOrder"
                  type="number"
                  defaultValue={field.sortOrder}
                />
              </label>
              <label className={styles.wideControl}>
                Placeholder
                <input
                  name="placeholder"
                  defaultValue={field.placeholder ?? ""}
                  placeholder="Optional prompt text"
                />
              </label>
              <label className={styles.wideControl}>
                Help text
                <textarea
                  name="helpText"
                  defaultValue={field.helpText ?? ""}
                  placeholder="Optional helper copy for participants"
                  rows={2}
                />
              </label>
              <label className={styles.checkboxControl}>
                <input
                  name="required"
                  type="checkbox"
                  defaultChecked={field.required}
                />
                Required
              </label>
              <button type="submit">Save field</button>
            </form>

            {field.visibleWhen ? (
              <p className={styles.meta}>
                Shows when {field.visibleWhen.sourceFieldKey}{" "}
                {formatConditionOperator(field.visibleWhen.operator)}{" "}
                {String(field.visibleWhen.value)}
              </p>
            ) : null}

            {field.options && field.options.length > 0 ? (
              <div className={styles.options}>
                {field.options.map((option) => (
                  <form
                    action={updateOptionAction}
                    className={styles.optionEditor}
                    key={option.id}
                  >
                    <input name="optionId" type="hidden" value={option.id} />
                    <input name="formSlug" type="hidden" value={form.slug} />
                    <label>
                      Label
                      <input
                        name="label"
                        required
                        defaultValue={option.label}
                      />
                    </label>
                    <label>
                      Value
                      <input
                        name="value"
                        required
                        defaultValue={option.value}
                      />
                    </label>
                    <label>
                      Sort
                      <input
                        name="sortOrder"
                        type="number"
                        defaultValue={option.sortOrder ?? 0}
                      />
                    </label>
                    <label>
                      Capacity
                      <input
                        name="capacity"
                        type="number"
                        min={0}
                        defaultValue={option.capacity ?? ""}
                      />
                    </label>
                    <small>
                      {typeof option.capacity === "number"
                        ? `${option.registeredCount ?? 0}/${option.capacity}`
                        : "Open"}
                    </small>
                    <button type="submit">Save option</button>
                  </form>
                ))}
              </div>
            ) : null}

            {isSelectField(field.dbType) ? (
              <form action={createOptionAction} className={styles.optionEditor}>
                <input name="fieldId" type="hidden" value={field.id} />
                <input name="formSlug" type="hidden" value={form.slug} />
                <label>
                  Label
                  <input name="label" placeholder="Beginner blues, Tuesday" required />
                </label>
                <label>
                  Value
                  <input name="value" placeholder="beginner-tuesday" />
                </label>
                <label>
                  Sort
                  <input name="sortOrder" type="number" />
                </label>
                <label>
                  Capacity
                  <input name="capacity" type="number" min={0} />
                </label>
                <small>New option</small>
                <button type="submit">Add option</button>
              </form>
            ) : null}
          </article>
        ))}
      </section>
    </AppShell>
  );
}

function formatConditionOperator(operator: string) {
  return operator.replaceAll("-", " ");
}

function isSelectField(dbType: string) {
  return dbType === "SINGLE_SELECT" || dbType === "MULTI_SELECT";
}
