import { NextResponse } from "next/server";
import { answerQuestion } from "@/lib/agent";
import { getKnowledgeAssets } from "@/lib/assets-store";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { AskResponse } from "@/types/agent";

export const runtime = "nodejs";

export async function POST(
  request: Request
): Promise<NextResponse<ApiSuccess<AskResponse> | ApiError>> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const question = isRecord(payload) && typeof payload.question === "string"
    ? payload.question.trim()
    : "";

  if (!question) {
    return NextResponse.json(
      { error: "Question is required." },
      { status: 400 }
    );
  }

  try {
    const assets = await getKnowledgeAssets();
    const response = await answerQuestion(question, assets);

    return NextResponse.json({ data: response });
  } catch (error) {
    return NextResponse.json(
      { error: formatApiError(error) },
      { status: 500 }
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function formatApiError(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected server error.";
}
