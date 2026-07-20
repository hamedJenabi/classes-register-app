import { NextResponse } from "next/server";
import {
  submitRegistration,
  type SubmissionAnswers,
} from "@/lib/submissions";

type RegistrationRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function POST(request: Request, context: RegistrationRouteContext) {
  const { slug } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    answers?: SubmissionAnswers;
  } | null;

  if (!body?.answers) {
    return NextResponse.json(
      {
        ok: false,
        errors: ["Answers are required."],
      },
      {
        status: 400,
      },
    );
  }

  const result = await submitRegistration(slug, body.answers);

  return NextResponse.json(result, {
    status: result.ok ? 201 : 400,
  });
}
