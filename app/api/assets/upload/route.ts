import { NextResponse } from "next/server";
import { createKnowledgeAsset } from "@/lib/assets-store";
import {
  DocumentParseError,
  parseUploadToAssetInput
} from "@/lib/document-parser";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { KnowledgeAsset } from "@/types/assets";

export const runtime = "nodejs";

export async function POST(
  request: Request
): Promise<NextResponse<ApiSuccess<KnowledgeAsset> | ApiError>> {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "请求必须使用 multipart/form-data 上传文件。" },
      { status: 400 }
    );
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "请选择要上传的参考资料文件。" },
      { status: 400 }
    );
  }

  try {
    const input = await parseUploadToAssetInput(file);
    const asset = await createKnowledgeAsset(input);

    return NextResponse.json({ data: asset }, { status: 201 });
  } catch (error) {
    if (error instanceof DocumentParseError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: formatApiError(error) },
      { status: 500 }
    );
  }
}

function formatApiError(error: unknown): string {
  return error instanceof Error ? error.message : "上传参考资料失败。";
}
