import "dotenv/config";

const requiredVariables = [
  "DATABASE_URL",
  "ADMIN_PASSWORD",
  "ADMIN_LOGIN_TOKEN",
  "ADMIN_SESSION_TOKEN",
  "NEXT_PUBLIC_APP_URL",
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "PAYPAL_CLIENT_ID",
  "PAYPAL_CLIENT_SECRET",
  "PAYPAL_ENVIRONMENT",
];

const secretVariables = [
  "ADMIN_PASSWORD",
  "ADMIN_LOGIN_TOKEN",
  "ADMIN_SESSION_TOKEN",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "PAYPAL_CLIENT_SECRET",
];

const missingVariables = requiredVariables.filter((name) => !process.env[name]);
const shortSecrets = secretVariables.filter((name) => {
  const value = process.env[name];

  return value && value.length < 16;
});
const paypalEnvironment = process.env.PAYPAL_ENVIRONMENT;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
const errors = [];

if (missingVariables.length > 0) {
  errors.push(`Missing required variables: ${missingVariables.join(", ")}`);
}

if (shortSecrets.length > 0) {
  errors.push(`Secrets should be at least 16 characters: ${shortSecrets.join(", ")}`);
}

if (
  paypalEnvironment &&
  paypalEnvironment !== "sandbox" &&
  paypalEnvironment !== "live"
) {
  errors.push("PAYPAL_ENVIRONMENT must be either sandbox or live.");
}

if (appUrl) {
  try {
    const url = new URL(appUrl);

    if (url.protocol !== "https:" && process.env.NODE_ENV === "production") {
      errors.push("NEXT_PUBLIC_APP_URL must use https in production.");
    }
  } catch {
    errors.push("NEXT_PUBLIC_APP_URL must be a valid URL.");
  }
}

if (errors.length > 0) {
  console.error("Environment check failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Environment check passed.");
