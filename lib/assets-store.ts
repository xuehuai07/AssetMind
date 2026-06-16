import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CreateKnowledgeAssetInput, KnowledgeAsset } from "@/types/assets";

const DATA_DIR = path.join(process.cwd(), "data");
const ASSETS_FILE = path.join(
  DATA_DIR,
  process.env.ASSETMIND_ASSETS_FILE_NAME ?? "knowledge-assets.json"
);

type ValidationResult =
  | {
      ok: true;
      value: Omit<KnowledgeAsset, "id" | "createdAt">;
    }
  | {
      ok: false;
      error: string;
    };

export async function getKnowledgeAssets(): Promise<KnowledgeAsset[]> {
  let raw: string;

  try {
    raw = await readFile(ASSETS_FILE, "utf8");
  } catch (error) {
    throw new Error(
      `Unable to read knowledge assets file: ${formatUnknownError(error)}`
    );
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Knowledge assets file contains invalid JSON: ${formatUnknownError(error)}`
    );
  }

  if (!isKnowledgeAssetArray(parsed)) {
    throw new Error("Knowledge assets file does not match the expected schema.");
  }

  return parsed;
}

export async function createKnowledgeAsset(
  input: CreateKnowledgeAssetInput
): Promise<KnowledgeAsset> {
  const validation = validateCreateAssetInput(input);

  if (!validation.ok) {
    throw new AssetValidationError(validation.error);
  }

  const assets = await getKnowledgeAssets();
  const asset: KnowledgeAsset = {
    id: crypto.randomUUID(),
    ...validation.value,
    createdAt: new Date().toISOString()
  };

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(
    ASSETS_FILE,
    `${JSON.stringify([...assets, asset], null, 2)}\n`,
    "utf8"
  );

  return asset;
}

export class AssetValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssetValidationError";
  }
}

export function validateCreateAssetInput(
  input: CreateKnowledgeAssetInput
): ValidationResult {
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const content = typeof input.content === "string" ? input.content.trim() : "";
  const tags = normalizeTags(input.tags);

  if (!title) {
    return { ok: false, error: "Title is required." };
  }

  if (!content) {
    return { ok: false, error: "Content is required." };
  }

  return {
    ok: true,
    value: {
      title,
      content,
      tags
    }
  };
}

function normalizeTags(value: unknown): string[] {
  const rawTags = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,，]/)
      : [];

  return Array.from(
    new Set(
      rawTags
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  );
}

function isKnowledgeAssetArray(value: unknown): value is KnowledgeAsset[] {
  return Array.isArray(value) && value.every(isKnowledgeAsset);
}

function isKnowledgeAsset(value: unknown): value is KnowledgeAsset {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.content === "string" &&
    Array.isArray(value.tags) &&
    value.tags.every((tag) => typeof tag === "string") &&
    typeof value.createdAt === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function formatUnknownError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
