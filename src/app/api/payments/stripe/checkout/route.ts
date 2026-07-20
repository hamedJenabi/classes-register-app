import { NextResponse } from "next/server";
import { createStripeCheckoutSession } from "@/lib/payments/stripe";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    registrationId?: string;
    amountCents?: number;
    currency?: string;
    successUrl?: string;
    cancelUrl?: string;
  } | null;

  if (!body?.registrationId || !body.amountCents || !body.currency) {
    return NextResponse.json(
      {
        error: "registrationId, amountCents, and currency are required.",
      },
      {
        status: 400,
      },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const session = await createStripeCheckoutSession({
      registrationId: body.registrationId,
      amountCents: body.amountCents,
      currency: body.currency,
      successUrl: body.successUrl ?? `${appUrl}/dashboard`,
      cancelUrl: body.cancelUrl ?? `${appUrl}/dashboard`,
    });

    return NextResponse.json(session, {
      status: 201,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Stripe checkout failed.",
      },
      {
        status: 400,
      },
    );
  }
}
