import { NextResponse } from "next/server";
import { getFormAvailability } from "@/lib/availability";

type AvailabilityRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_request: Request, context: AvailabilityRouteContext) {
  const { slug } = await context.params;
  const availability = await getFormAvailability(slug);

  if (!availability) {
    return NextResponse.json(
      { error: "Form not found." },
      {
        status: 404,
      },
    );
  }

  return NextResponse.json(availability);
}
