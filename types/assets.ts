export type KnowledgeAsset = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
};

export type CreateKnowledgeAssetInput = {
  title?: unknown;
  content?: unknown;
  tags?: unknown;
};
