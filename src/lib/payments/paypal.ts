import { PaymentProvider, PaymentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

type PayPalOrderInput = {
  registrationId: string;
  amountCents: number;
  currency: string;
  returnUrl?: string;
  cancelUrl?: string;
};

function getPayPalBaseUrl() {
  return process.env.PAYPAL_ENVIRONMENT === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export async function createPayPalOrder(input: PayPalOrderInput) {
  const registration = await prisma.registration.findUnique({
    where: {
      id: input.registrationId,
    },
    select: {
      id: true,
    },
  });

  if (!registration) {
    throw new Error("Registration not found.");
  }

  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: registration.id,
          amount: {
            currency_code: input.currency.toUpperCase(),
            value: formatPayPalAmount(input.amountCents),
          },
        },
      ],
      application_context:
        input.returnUrl || input.cancelUrl
          ? {
              return_url: input.returnUrl,
              cancel_url: input.cancelUrl,
            }
          : undefined,
    }),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const order = (await response.json()) as {
    id?: string;
    status?: string;
    links?: Array<{ href: string; rel: string }>;
    message?: string;
  };

  if (!response.ok || !order.id) {
    throw new Error(order.message ?? "PayPal order creation failed.");
  }

  await prisma.payment.create({
    data: {
      registrationId: registration.id,
      provider: PaymentProvider.PAYPAL,
      providerSessionId: order.id,
      amountCents: input.amountCents,
      currency: input.currency.toUpperCase(),
      status: PaymentStatus.PENDING,
      metadata: order,
    },
  });

  return {
    id: order.id,
    status: order.status,
    approvalUrl:
      order.links?.find((link) => link.rel === "approve")?.href ?? null,
  };
}

export async function capturePayPalOrder(orderId: string) {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(
    `${getPayPalBaseUrl()}/v2/checkout/orders/${orderId}/capture`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );
  const capture = (await response.json()) as {
    id?: string;
    status?: string;
    message?: string;
    purchase_units?: Array<{
      reference_id?: string;
      payments?: {
        captures?: Array<{
          id?: string;
          status?: string;
        }>;
      };
    }>;
  };

  if (!response.ok) {
    throw new Error(capture.message ?? "PayPal capture failed.");
  }

  const registrationId = capture.purchase_units?.[0]?.reference_id;
  const captureId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.id;

  await prisma.payment.updateMany({
    where: {
      provider: PaymentProvider.PAYPAL,
      providerSessionId: orderId,
    },
    data: {
      providerPaymentId: captureId,
      status:
        capture.status === "COMPLETED" ? PaymentStatus.PAID : PaymentStatus.PENDING,
      metadata: capture,
    },
  });

  if (registrationId && capture.status === "COMPLETED") {
    await prisma.registration.update({
      where: {
        id: registrationId,
      },
      data: {
        paymentStatus: PaymentStatus.PAID,
      },
    });
  }

  return capture;
}

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are required.");
  }

  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    body: "grant_type=client_credentials",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString(
        "base64",
      )}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });
  const token = (await response.json()) as {
    access_token?: string;
    error_description?: string;
  };

  if (!response.ok || !token.access_token) {
    throw new Error(token.error_description ?? "PayPal authentication failed.");
  }

  return token.access_token;
}

function formatPayPalAmount(amountCents: number) {
  return (amountCents / 100).toFixed(2);
}
