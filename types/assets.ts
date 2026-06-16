export type KnowledgeAssetSource = {
  type: "manual" | "upload";
  fileName?: string;
  mimeType?: string;
  size?: number;
};

export type KnowledgeAsset = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  source?: KnowledgeAssetSource;
};

export type CreateKnowledgeAssetInput = {
  title?: unknown;
  content?: unknown;
  tags?: unknown;
  source?: unknown;
};
