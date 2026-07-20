# Classes Register App

Generic registration form builder for Blues Dance Vienna classes and future
events.

## Local Development

Install dependencies:

```bash
pnpm install
```

Copy the environment template:

```bash
cp .env.example .env
```

Adjust `DATABASE_URL` in `.env` to match your local Postgres role and database.

Start the app:

```bash
pnpm dev
```

Useful scripts:

```bash
pnpm lint
pnpm typecheck
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
pnpm test
```

## Local MVP

The local MVP includes persisted form definitions, field and option editing,
conditional visibility rules, capacity availability, public registration
submission, dashboard registration review, and focused Node tests for core form
behavior.

Stripe checkout scaffolding is available at
`POST /api/payments/stripe/checkout`; Stripe webhooks are handled at
`POST /api/payments/stripe/webhook`.

PayPal order scaffolding is available at `POST /api/payments/paypal/orders`;
captures are handled at `POST /api/payments/paypal/orders/{orderId}/capture`.

Heroku deployment notes live in
[`docs/heroku-deployment.md`](docs/heroku-deployment.md).

This project expects Node `20.19.0` or newer. The app is being developed
locally first, then prepared for Heroku and Heroku Postgres after the MVP is
reviewed.
