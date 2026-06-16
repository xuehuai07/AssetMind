import { NextResponse } from "next/server";
import { DeepSeekApiError, validateDeepSeekKey } from "@/lib/deepseek";
import type { ApiError, ApiSuccess } from "@/types/api";

type ValidateResponse = {
  enabled: true;
  provider: "DeepSeek";
  models: string[];
};

export const runtime = "nodejs";

export async function POST(
  request: Request
): Promise<NextResponse<ApiSuccess<ValidateResponse> | ApiError>> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "请求体必须是有效 JSON。" },
      { status: 400 }
    );
  }

  const apiKey = isRecord(payload) && typeof payload.apiKey === "string"
    ? payload.apiKey.trim()
    : "";

  if (!apiKey) {
    return NextResponse.json(
      { error: "请输入 DeepSeek API Key。" },
      { status: 400 }
    );
  }

  try {
    const result = await validateDeepSeekKey(apiKey);

    return NextResponse.json({
      data: {
        enabled: result.ok,
        provider: "DeepSeek",
        models: result.models
      }
    });
  } catch (error) {
    if (error instanceof DeepSeekApiError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "验证 DeepSeek Key 失败，请稍后重试。" },
      { status: 500 }
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
