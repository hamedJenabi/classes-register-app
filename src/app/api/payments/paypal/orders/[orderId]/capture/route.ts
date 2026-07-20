import { NextResponse } from "next/server";
import { capturePayPalOrder } from "@/lib/payments/paypal";

type CaptureRouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function POST(_request: Request, context: CaptureRouteContext) {
  const { orderId } = await context.params;

  try {
    const capture = await capturePayPalOrder(orderId);

    return NextResponse.json(capture);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "PayPal capture failed.",
      },
      {
        status: 400,
      },
    );
  }
}
