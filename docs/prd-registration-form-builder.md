# Registration Form Builder PRD

Last updated: July 20, 2026

## Summary

Blues Dance Vienna needs a reusable registration system for classes and future
events. The product should let an admin define registration forms, publish a
participant-facing form, manage capacity-sensitive class options, review
submissions, and connect payment records to Stripe or PayPal.

The current repo contains a strong local MVP. The main product path is built:
persisted form definitions, public form rendering, field and option editing,
conditional rules, capacity checks, submission storage, registration review,
admin authentication, Heroku preparation, and payment API routes. The remaining
work is mostly production launch, form lifecycle controls, participant-facing
payment UX, and broader verification.

## Problem

Creating a new class or event registration flow is too manual. The team needs a
repeatable way to collect participant details, define custom questions, show
conditional fields, prevent overbooking, track payment status, and review
registrations without rebuilding one-off forms.

The goal is not to clone a general-purpose form-builder platform. The goal is a
focused registration builder that fits recurring Blues Dance Vienna workflows
and can evolve in small, reliable slices.

## Goals

- Let admins create and manage registration forms for classes and events.
- Let admins configure common field types, labels, helper text, placeholders,
  required state, sort order, options, and basic conditional visibility.
- Let admins mark selected options with capacity limits.
- Let participants submit public forms without seeing admin navigation.
- Disable full options in the UI and re-check capacity on the server.
- Store form definitions, answers, registrations, payment records, and provider
  metadata in Postgres.
- Prepare the app for Heroku and Heroku Postgres deployment.
- Keep Stripe and PayPal integrations separate so either provider can be used.

## Non-Goals

- Full generic survey-builder complexity.
- Multi-page forms.
- File uploads.
- Repeating sections.
- Discount codes or complex pricing logic.
- Email automation.
- Export tooling in the MVP.
- Public discovery of admin login URLs.

## Users

- Admin: Blues Dance Vienna organizer who configures forms, monitors capacity,
  reviews registrations, and checks payment status.
- Participant: Student or event attendee who fills out a public registration
  form from a shared link.
- Developer/operator: Person who runs migrations, configures production
  environment variables, and deploys to Heroku.

## Current Implementation Status

| Area | Status | Notes |
| --- | --- | --- |
| Next.js app foundation | Done | App Router, TypeScript, SCSS Modules, Ariakit, pnpm, lint, typecheck, and build scripts exist. |
| Prisma/Postgres model | Done | Forms, fields, options, conditional rules, registrations, answers, and payments are modeled. |
| Seed data | Done | Sample Blues Foundations form and seeded registrations are available. |
| Admin authentication | Done | Dashboard routes are protected by password/session token, with login URL gated by `ADMIN_LOGIN_TOKEN`. |
| Dashboard form list | Done with polish needed | Lists persisted forms and counts. One dashboard card still contains stale "Next: Field editing" copy. |
| Dashboard field editor | Done | Admins can add/update field label, key, type, required state, sort order, placeholder, and help text. |
| Option editor | Done | Admins can add/update select options and optional capacity limits. |
| Conditional rules | Done | Admins can configure one visibility rule per field with equals, not-equals, and includes. |
| Public form renderer | Done | Renders persisted forms and separates public navigation from admin navigation. |
| Public conditional visibility | Done | Client and server both evaluate visible fields from submitted answers. |
| Availability endpoint | Done | Capacity-managed options expose counts, remaining slots, and full state. |
| Registration submission | Done | Saves registrations and answers, validates required fields, validates options, and re-checks capacity in a transaction. |
| Registration review | Done | Dashboard page lists submissions, participant summary, payment status, and answers. |
| Stripe payment APIs | Partial | Checkout session and webhook handling exist, but no public checkout UX is wired into the registration flow. |
| PayPal payment APIs | Partial | Order creation and capture exist, but no public checkout UX is wired into the registration flow. |
| Heroku preparation | Done | Procfile, deployment docs, production env check, migration deploy script, Prisma CLI availability, and production SSL handling exist. |
| Production deployment | Not done | No Heroku app/Postgres/config/deploy evidence exists in the repo. |
| Form lifecycle controls | Done | Dashboard can create a brand-new form, then edit title, slug, description, status, submit label, and success message from the form detail page. |
| End-to-end/API coverage | Partial | Unit tests cover condition evaluation and availability math. Submission, auth, payment, and browser flows need more coverage. |

## Functional Requirements

### Admin Dashboard

- Show all forms with status, field count, capacity option count, and
  registration count.
- Open a form detail page from the dashboard.
- Add and update fields with supported MVP field types.
- Add and update select options.
- Add optional capacity to select options.
- Configure basic visibility rules for fields.
- Review submitted registrations and their answers.
- Show payment status alongside registration status.
- Protect dashboard routes behind admin session authentication.

### Public Registration

- Render only the selected public form by slug.
- Render supported field types: text, textarea, email, phone, single select,
  multi select, boolean, date, and number.
- Show/hide conditional fields based on participant answers.
- Disable capacity-managed options that are already full.
- Submit answers to a server endpoint.
- Validate required visible fields on the server.
- Reject invalid selected options.
- Re-check capacity during submission before saving the registration.
- Store participant name and email summaries when available.
- Return the form success message after a successful submission.

### Payments

- Store payment records separately from registration answers.
- Support Stripe checkout session creation for a registration.
- Support Stripe webhook processing for completed checkout sessions.
- Support PayPal order creation for a registration.
- Support PayPal capture and payment-status updates.
- Keep provider-specific IDs and raw provider metadata for reconciliation.
- Future step: expose a participant-facing payment handoff after registration
  when a paid class or event requires payment.

### Deployment And Operations

- Run locally with Postgres and `.env` values.
- Generate the Prisma client before builds and typechecks.
- Run migrations locally and with Heroku one-off dynos.
- Check required production environment variables before launch.
- Use SSL for production Postgres connections.
- Deploy to Heroku with Heroku Postgres.

## Data Model

- Form: title, slug, description, status, submit button label, success message,
  timestamps.
- Field: form, key, label, help text, placeholder, type, required state, sort
  order, config.
- FieldOption: field, label, value, sort order, optional capacity, optional
  future pricing metadata.
- ConditionalRule: form, target field, source field, operator, comparison value,
  action.
- Registration: form, status, submitted timestamp, participant summary fields,
  payment status.
- Answer: registration, field, selected option when relevant, structured value.
- Payment: registration, provider, provider session ID, provider payment ID,
  amount, currency, status, raw provider metadata.

## API And Route Surface

- `GET /dashboard`: admin form list.
- `GET /dashboard/forms/[slug]`: admin form detail and editor controls.
- `GET /dashboard/forms/[slug]/registrations`: registration review.
- Server actions under `src/app/dashboard/forms/[slug]/actions.ts`: field,
  option, and conditional-rule mutations.
- `GET /forms/[slug]`: public form.
- `GET /api/forms/[slug]/availability`: capacity availability.
- `POST /api/forms/[slug]/registrations`: registration submission.
- `POST /api/payments/stripe/checkout`: Stripe checkout session creation.
- `POST /api/payments/stripe/webhook`: Stripe webhook handling.
- `POST /api/payments/paypal/orders`: PayPal order creation.
- `POST /api/payments/paypal/orders/[orderId]/capture`: PayPal capture.

## Acceptance Criteria

- An admin can log in and open the dashboard.
- An admin can view the seeded form and update fields, options, capacities, and
  conditional visibility rules.
- A participant can open the public form, complete visible fields, and submit a
  registration.
- A full capacity-managed option is disabled in the UI.
- The server rejects a registration that selects a full option.
- A successful registration appears in the dashboard review page.
- Stripe and PayPal payment records can be created through their API routes when
  valid credentials and registration IDs are provided.
- Production deployment can pass `pnpm env:check`, apply Prisma migrations, and
  serve the public form and admin dashboard.

## Remaining Work

### P0: Launch Blockers

1. Create or choose the Heroku app.
2. Attach Heroku Postgres and set the production `DATABASE_URL`.
3. Set production config vars:
   `DATABASE_SSL`, `ADMIN_PASSWORD`, `ADMIN_LOGIN_TOKEN`,
   `ADMIN_SESSION_TOKEN`, `NEXT_PUBLIC_APP_URL`, `STRIPE_SECRET_KEY`,
   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`,
   `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and `PAYPAL_ENVIRONMENT`.
4. Run `pnpm env:check` in the Heroku environment.
5. Run `pnpm prisma:migrate:deploy` against Heroku Postgres.
6. Seed production only if the sample form should exist there.
7. Deploy the app to Heroku.
8. Smoke-test production routes: admin login, dashboard, public form, successful
   registration, capacity rejection, and registration review.
9. Configure Stripe webhook URL in Stripe and verify webhook delivery.
10. Verify PayPal sandbox or live order creation and capture.

### P1: Product Gaps Before Repeated Real Use

1. Wire participant-facing payment UX into the public registration flow when a
   paid class or event requires payment.
2. Decide how price is configured for a form or option and connect that to the
   existing `priceCents` and `currency` option fields.
3. Add clearer server-action error handling for duplicate field keys, duplicate
   option values, invalid capacities, and failed saves.
4. Add API/integration tests for registration submission, capacity rejection,
   admin auth behavior, Stripe webhook handling, and PayPal capture handling.
5. Add at least one browser-level smoke test for the public registration flow.

### P2: Later Enhancements

1. Registration export.
2. Registration cancellation or status management from the dashboard.
3. Waitlist support for full classes.
4. Email confirmation and admin notification.
5. More robust payment reconciliation and refund handling.
6. Additional conditional logic actions or multiple rules per field.

## Open Decisions

- Should production start with only the seeded Blues Foundations form, or should
  form creation ship before the first production event?
- Should payment be required immediately after registration, optional, or
  manually reconciled at first?
- Should each option carry its own price, or should the form/event define one
  shared price?
- Should full classes reject submissions outright or offer a waitlist option?
- Which registration fields are required by policy before real participants use
  the system?

## Implementation Checklist

- [x] Scaffold Next.js app with TypeScript, SCSS, Ariakit, Prisma, linting, and
  local scripts.
- [x] Add Blues Dance Vienna visual direction and application shell.
- [x] Define Prisma schema and initial migration.
- [x] Add sample form seed data.
- [x] Build Prisma-backed dashboard form list and form detail routes.
- [x] Build field editor for MVP field types.
- [x] Build option editing with optional capacity.
- [x] Build conditional rule editing.
- [x] Build public form renderer from persisted form definitions.
- [x] Add conditional visibility behavior.
- [x] Add availability endpoint and disabled full option states.
- [x] Add registration submission with server-side validation and capacity
  re-checking.
- [x] Add dashboard registration review.
- [x] Add focused tests for conditional visibility and availability math.
- [x] Add admin authentication and separate public navigation.
- [x] Add Stripe checkout and webhook API routes.
- [x] Add PayPal order and capture API routes.
- [x] Add Heroku deployment documentation and production env preflight.
- [x] Add production-safe Prisma migration command and SSL-aware Postgres
  connection handling.
- [x] Add form creation and form metadata/status editing.
- [ ] Connect participant-facing payment UX if payments are required for launch.
- [ ] Connect Heroku Postgres and production config vars.
- [ ] Deploy to Heroku.
- [ ] Smoke-test production.
- [ ] Expand integration and browser-level test coverage.
