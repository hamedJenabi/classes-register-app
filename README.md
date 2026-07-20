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
```

This project expects Node `20.19.0` or newer. The app is being developed
locally first, then prepared for Heroku and Heroku Postgres after the MVP is
reviewed.
