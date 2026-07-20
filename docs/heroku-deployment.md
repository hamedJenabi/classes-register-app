# Heroku Deployment

This app is prepared for Heroku with Heroku Postgres, Prisma migrations, and
Next.js server rendering.

## Required Add-ons

- Heroku Postgres.

## Required Config Vars

```bash
DATABASE_URL=
NEXT_PUBLIC_APP_URL=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_ENVIRONMENT=sandbox
```

`NEXT_PUBLIC_APP_URL` should be the production app URL, for example
`https://your-app-name.herokuapp.com`.

## First Deploy

```bash
heroku create your-app-name
heroku addons:create heroku-postgresql:essential-0
heroku config:set NEXT_PUBLIC_APP_URL=https://your-app-name.herokuapp.com
git push heroku main
heroku run pnpm prisma:migrate
heroku run pnpm prisma:seed
```

Use the actual branch name instead of `main` if the release branch differs.

## Later Deploys

```bash
git push heroku main
heroku run pnpm prisma:migrate
```

Only run `pnpm prisma:seed` in production when you intentionally want to reset
the sample form data.

## Payment Webhooks

Stripe webhook URL:

```text
https://your-app-name.herokuapp.com/api/payments/stripe/webhook
```

PayPal capture is handled by the app route:

```text
https://your-app-name.herokuapp.com/api/payments/paypal/orders/{orderId}/capture
```

Admin authentication is still required before production use.
