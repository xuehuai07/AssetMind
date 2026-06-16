import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import type { CreateKnowledgeAssetInput } from "@/types/assets";

export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

type SupportedDocumentType = "txt" | "md" | "pdf" | "docx";

const SUPPORTED_EXTENSIONS = new Set<SupportedDocumentType>([
  "txt",
  "md",
  "pdf",
  "docx"
]);

export class DocumentParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentParseError";
  }
}

export async function parseUploadToAssetInput(
  file: File
): Promise<CreateKnowledgeAssetInput> {
  if (file.size === 0) {
    throw new DocumentParseError("上传文件为空，请选择包含正文的参考资料。");
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    throw new DocumentParseError("文件超过 10MB 上限，请压缩或拆分后再上传。");
  }

  const extension = getSupportedExtension(file.name);

  if (!extension) {
    throw new DocumentParseError("暂不支持该格式，请上传 txt、md、pdf 或 docx 文件。");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const content = normalizeExtractedText(await extractText(buffer, extension));

  if (!content) {
    throw new DocumentParseError(
      "未能从文件中提取有效文本。扫描版 PDF 或图片型文档需要先转换为可复制文本。"
    );
  }

  return {
    title: getTitleFromFileName(file.name),
    content,
    tags: ["参考资料", extension.toUpperCase()],
    source: {
      type: "upload",
      fileName: file.name,
      mimeType: file.type || undefined,
      size: file.size
    }
  };
}

async function extractText(
  buffer: Buffer,
  extension: SupportedDocumentType
): Promise<string> {
  if (extension === "txt" || extension === "md") {
    return buffer.toString("utf8");
  }

  if (extension === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

function getSupportedExtension(fileName: string): SupportedDocumentType | null {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (!extension || !SUPPORTED_EXTENSIONS.has(extension as SupportedDocumentType)) {
    return null;
  }

  return extension as SupportedDocumentType;
}

function getTitleFromFileName(fileName: string): string {
  const trimmed = fileName.trim();
  const withoutExtension = trimmed.replace(/\.[^.]+$/, "");
  return withoutExtension || "未命名参考资料";
}

function normalizeExtractedText(value: string): string {
  return value
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
