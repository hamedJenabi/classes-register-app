# Registration Form Builder PRD

## Problem Statement

Blues Dance Vienna needs a reusable registration system for dance classes and future events. Today, creating a new registration flow requires too much manual work and does not provide a clean way to define custom questions, conditional fields, class capacity, payment status, or exported registration data.

The first product goal is not to clone a full form-builder platform. The goal is to create a focused generic form builder that can support the recurring registration needs of Blues Dance Vienna while staying simple enough to build, test, and deploy in MVP steps.

## Solution

Build a Next.js application with an admin dashboard for creating registration forms and a public form renderer for participants. Admins can create forms, add fields, configure options, define conditional visibility rules, and mark class options with capacities. Participants fill out a public form; options that are already full are disabled based on backend availability. Submitted data is stored in Postgres and can later be connected to Stripe and PayPal payment flows.

The product will run locally during MVP development and be designed for Heroku deployment with Heroku Postgres later.

## User Stories

1. As an admin, I want to create a new registration form, so that I can register students for a new dance class or event.
2. As an admin, I want to edit a form title, description, slug, and status, so that I can prepare drafts before publishing.
3. As an admin, I want to add text fields, so that I can collect names and short answers.
4. As an admin, I want to add textarea fields, so that I can collect longer notes.
5. As an admin, I want to add email fields, so that I can contact registered students.
6. As an admin, I want to add phone fields, so that I can contact students if needed.
7. As an admin, I want to add date fields, so that I can collect date-based information.
8. As an admin, I want to add number fields, so that I can collect numeric information.
9. As an admin, I want to add single-select fields, so that a student can choose one class option.
10. As an admin, I want to add multi-select fields, so that a student can choose multiple class options.
11. As an admin, I want to add checkbox or yes/no fields, so that I can collect consent and simple boolean choices.
12. As an admin, I want to configure labels, helper text, placeholders, required state, and sort order for fields, so that public forms are understandable and polished.
13. As an admin, I want to configure option labels and values, so that class choices can be clear to students and stable in the database.
14. As an admin, I want to set capacity on class options, so that the system can prevent overbooking.
15. As an admin, I want to leave capacity empty for non-capacity options, so that normal form choices do not behave like classes.
16. As an admin, I want to define conditional rules for fields, so that a field can appear only when another answer matches the rule.
17. As an admin, I want a conditional rule to support equals, does not equal, and includes, so that basic show/hide logic covers the first registration flows.
18. As a participant, I want to see only fields that are relevant to my earlier answers, so that the form feels shorter and clearer.
19. As a participant, I want unavailable class options to be disabled, so that I do not register for a full class.
20. As a participant, I want the submit action to re-check capacity on the backend, so that I get a reliable result even if someone else submits at the same time.
21. As an admin, I want registration answers stored in Postgres, so that data survives deploys and can be reviewed later.
22. As an admin, I want to view submitted registrations in the dashboard, so that I can manage attendance.
23. As an admin, I want payment provider records stored separately from registration answers, so that Stripe and PayPal can be connected independently.
24. As an admin, I want Stripe and PayPal to be separate integrations, so that each can use its own account and environment variables.
25. As a developer, I want the app to run locally first, so that MVP decisions can be validated before Heroku deployment.
26. As a developer, I want database migrations to be reliable, so that local and Heroku Postgres schema changes stay in sync.

## Implementation Decisions

- Use Next.js App Router with TypeScript.
- Use SCSS Modules for component and page styling.
- Use Ariakit for accessible UI primitives.
- Use Prisma for schema modeling, migrations, generated database client, and Heroku Postgres compatibility.
- Prefer Prisma over Ley for this project because the data model will evolve quickly and typed schema access is valuable for a form builder.
- Use a dark Blues Dance Vienna visual direction based on the supplied screenshot: near-black surfaces, warm amber highlights, high-contrast white typography, and photography-led brand feel.
- Build a generic form builder, not a one-off dance-class form.
- Keep MVP field types limited to text, textarea, email, phone, single select, multi select, checkbox/yes-no, date, and number.
- Keep MVP conditional logic limited to showing a target field when a source field equals, does not equal, or includes a value.
- Store form definitions separately from registrations.
- Store answers as structured values so field types can evolve without requiring a new table per form.
- Store selectable options as first-class records rather than only JSON config, because class options need capacity and availability checks.
- Add optional capacity to selectable options. An option with capacity behaves as a capacity-managed class option.
- Compute availability from submitted registrations and selected capacity-managed options.
- Disable full options in the public form based on a backend availability response.
- Re-check capacity during submission on the server to prevent overbooking.
- Store payment records separately from registrations.
- Stripe and PayPal integrations are out of the first local schema/dashboard MVP but the schema should leave room for both providers.
- Admin authentication is not part of the first local builder milestone, but it is required before production deployment.

## Proposed Data Model

- Form: title, slug, description, status, submit button label, success message, timestamps.
- Field: form, key, label, help text, placeholder, type, required state, sort order, config.
- FieldOption: field, label, value, sort order, optional capacity, optional price metadata later.
- ConditionalRule: target field, source field, operator, comparison value, action.
- Registration: form, status, submitted timestamp, participant summary fields, payment status.
- Answer: registration, field, selected option when relevant, structured value.
- Payment: registration, provider, provider session id, provider payment id, amount, currency, status, raw provider metadata.

## API Contracts

- Admin form list: returns forms with status and summary counts.
- Admin form detail: returns a form definition with fields, options, and conditional rules.
- Admin form mutation endpoints: create and update forms, fields, options, and rules.
- Public form detail: returns only published form definitions needed by participants.
- Availability endpoint: returns capacity state for capacity-managed options.
- Submission endpoint: validates required fields, evaluates submitted field values, re-checks option capacity, writes registration and answers, and returns success or capacity errors.
- Payment endpoints later: create Stripe checkout session, handle Stripe webhook, create PayPal order, capture PayPal order, and store provider-specific payment records.

## Testing Decisions

- Test the form renderer at the behavior level: fields render by type, required validation appears, conditional fields show and hide based on answers, and disabled full options cannot be selected.
- Test capacity at the API level: availability returns full options, submission rejects a full option, and submission accepts an option with remaining capacity.
- Test server-side submission behavior rather than only client state, because capacity protection must work without trusting the browser.
- Test Prisma-backed data access through the highest practical seam available in the app once the first endpoints exist.
- Keep early tests focused on form definition, conditional visibility, registration submission, and capacity checks.
- Add payment integration tests later around webhook/order handling once Stripe and PayPal credentials and sandbox flows are introduced.

## Out of Scope

- File uploads.
- Repeating sections.
- Multi-page forms.
- Discount codes.
- Complex pricing logic.
- Email automation.
- Export tooling.
- Production admin authentication in the first local milestone.
- Stripe and PayPal implementation in the first schema/dashboard milestone.
- Publishing PRDs to GitHub issues from Codex.

## Implementation Steps

1. Scaffold the Next.js app with TypeScript, SCSS, Ariakit, Prisma, linting, and local environment templates.
2. Add the dark Blues Dance Vienna design system and application shell.
3. Define the Prisma schema for forms, fields, options, conditional rules, registrations, answers, and payment records.
4. Add seed data for one sample Blues Dance Vienna registration form.
5. Build the dashboard form list and form detail routes.
6. Build the field editor for MVP field types.
7. Build option editing with optional capacity.
8. Build the conditional rule editor.
9. Build the public form renderer.
10. Add conditional visibility behavior on the public form.
11. Add the availability endpoint and disabled full option states.
12. Add registration submission with server-side validation and capacity re-checking.
13. Add dashboard registration review.
14. Add tests for renderer behavior, availability, and submission capacity handling.
15. Commit the local MVP.
16. Add Stripe checkout and webhook flow.
17. Add PayPal order and capture flow.
18. Prepare Heroku deployment files and documentation.
19. Connect Heroku Postgres and production environment variables.
20. Deploy after local MVP review.

## Backend And Deployment Inputs Needed Later

- Heroku app name.
- Heroku Postgres `DATABASE_URL`.
- Production public URL.
- Admin authentication decision.
- Stripe secret key.
- Stripe publishable key.
- Stripe webhook secret.
- Stripe checkout success URL and cancel URL.
- PayPal client ID.
- PayPal secret.
- PayPal environment mode.
- PayPal webhook or capture handling preference.

## Further Notes

The first production risk is capacity correctness, not visual polish. The UI can disable full classes for a good participant experience, but the backend must remain the source of truth and reject over-capacity submissions. Payments should be added only after registration saving and capacity checks work reliably.
