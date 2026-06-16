import { NextResponse } from "next/server";
import { getKnowledgeAssets } from "@/lib/assets-store";
import { searchKnowledgeAssets } from "@/lib/retrieval";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { SearchResult } from "@/types/retrieval";

export const runtime = "nodejs";

export async function POST(
  request: Request
): Promise<NextResponse<ApiSuccess<SearchResult[]> | ApiError>> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "请求体必须是有效 JSON。" },
      { status: 400 }
    );
  }

  const query = isRecord(payload) && typeof payload.query === "string"
    ? payload.query.trim()
    : "";

  if (!query) {
    return NextResponse.json({ error: "请输入检索内容。" }, { status: 400 });
  }

  try {
    const assets = await getKnowledgeAssets();
    const results = searchKnowledgeAssets(query, assets);

    return NextResponse.json({ data: results });
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
  return error instanceof Error ? error.message : "检索接口异常。";
}
