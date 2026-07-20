import { createHmac, timingSafeEqual } from "node:crypto";
import { PaymentProvider, PaymentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

const STRIPE_CHECKOUT_SESSION_URL =
  "https://api.stripe.com/v1/checkout/sessions";

export type StripeCheckoutInput = {
  registrationId: string;
  amountCents: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
};

export async function createStripeCheckoutSession(input: StripeCheckoutInput) {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is required.");
  }

  const registration = await prisma.registration.findUnique({
    where: {
      id: input.registrationId,
    },
    select: {
      id: true,
      participantEmail: true,
    },
  });

  if (!registration) {
    throw new Error("Registration not found.");
  }

  const body = new URLSearchParams({
    mode: "payment",
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": input.currency.toLowerCase(),
    "line_items[0][price_data][unit_amount]": String(input.amountCents),
    "line_items[0][price_data][product_data][name]":
      "Blues Dance Vienna registration",
    "metadata[registrationId]": registration.id,
  });

  if (registration.participantEmail) {
    body.set("customer_email", registration.participantEmail);
  }

  const response = await fetch(STRIPE_CHECKOUT_SESSION_URL, {
    body,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });
  const session = (await response.json()) as {
    id?: string;
    url?: string;
    payment_intent?: string;
    error?: {
      message?: string;
    };
  };

  if (!response.ok || !session.id || !session.url) {
    throw new Error(session.error?.message ?? "Stripe checkout failed.");
  }

  await prisma.payment.create({
    data: {
      registrationId: registration.id,
      provider: PaymentProvider.STRIPE,
      providerSessionId: session.id,
      providerPaymentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : null,
      amountCents: input.amountCents,
      currency: input.currency.toUpperCase(),
      status: PaymentStatus.PENDING,
      metadata: session,
    },
  });

  return {
    id: session.id,
    url: session.url,
  };
}

export async function handleStripeWebhook(payload: string, signature: string | null) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (webhookSecret) {
    verifyStripeSignature(payload, signature, webhookSecret);
  }

  const event = JSON.parse(payload) as {
    type?: string;
    data?: {
      object?: {
        id?: string;
        payment_intent?: string;
        metadata?: {
          registrationId?: string;
        };
      };
    };
  };
  const object = event.data?.object;

  if (event.type === "checkout.session.completed" && object?.id) {
    await prisma.payment.updateMany({
      where: {
        provider: PaymentProvider.STRIPE,
        providerSessionId: object.id,
      },
      data: {
        providerPaymentId:
          typeof object.payment_intent === "string"
            ? object.payment_intent
            : undefined,
        status: PaymentStatus.PAID,
      },
    });

    if (object.metadata?.registrationId) {
      await prisma.registration.update({
        where: {
          id: object.metadata.registrationId,
        },
        data: {
          paymentStatus: PaymentStatus.PAID,
        },
      });
    }
  }

  return {
    received: true,
  };
}

export function verifyStripeSignature(
  payload: string,
  signature: string | null,
  secret: string,
) {
  if (!signature) {
    throw new Error("Stripe signature is required.");
  }

  const parts = Object.fromEntries(
    signature.split(",").flatMap((part) => {
      const [key, value] = part.split("=");
      return key && value ? [[key, value]] : [];
    }),
  );

  if (!parts.t || !parts.v1) {
    throw new Error("Stripe signature is malformed.");
  }

  const signedPayload = `${parts.t}.${payload}`;
  const expectedSignature = createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");
  const received = Buffer.from(parts.v1, "hex");
  const expected = Buffer.from(expectedSignature, "hex");

  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw new Error("Stripe signature verification failed.");
  }
}
