import { NextResponse } from "next/server";
import {
  AssetValidationError,
  createKnowledgeAsset,
  getKnowledgeAssets
} from "@/lib/assets-store";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { KnowledgeAsset } from "@/types/assets";

export const runtime = "nodejs";

export async function GET(): Promise<
  NextResponse<ApiSuccess<KnowledgeAsset[]> | ApiError>
> {
  try {
    const assets = await getKnowledgeAssets();
    return NextResponse.json({ data: assets });
  } catch (error) {
    return NextResponse.json(
      { error: formatApiError(error) },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request
): Promise<NextResponse<ApiSuccess<KnowledgeAsset> | ApiError>> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, {
      status: 400
    });
  }

  try {
    const asset = await createKnowledgeAsset(
      isRecord(payload) ? payload : {}
    );

    return NextResponse.json({ data: asset }, { status: 201 });
  } catch (error) {
    if (error instanceof AssetValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

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
