import { NextResponse } from "next/server";
import { createPayPalOrder } from "@/lib/payments/paypal";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    registrationId?: string;
    amountCents?: number;
    currency?: string;
    returnUrl?: string;
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

  try {
    const order = await createPayPalOrder({
      registrationId: body.registrationId,
      amountCents: body.amountCents,
      currency: body.currency,
      returnUrl: body.returnUrl,
      cancelUrl: body.cancelUrl,
    });

    return NextResponse.json(order, {
      status: 201,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "PayPal order failed.",
      },
      {
        status: 400,
      },
    );
  }
}
