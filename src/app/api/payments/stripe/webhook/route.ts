import { NextResponse } from "next/server";
import { handleStripeWebhook } from "@/lib/payments/stripe";

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  try {
    const result = await handleStripeWebhook(payload, signature);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Stripe webhook failed.",
      },
      {
        status: 400,
      },
    );
  }
}
