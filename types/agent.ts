import type { KnowledgeAsset } from "@/types/assets";
import type { SearchResult } from "@/types/retrieval";

export type Citation = {
  assetId: string;
  title: string;
  snippet: string;
};

export type AgentTraceStep = {
  id: string;
  label: string;
  status: "completed" | "skipped" | "failed";
  summary: string;
};

export type AgentTrace = {
  query: string;
  normalizedQuery: string;
  retrievedAssets: Array<{
    assetId: string;
    title: string;
    score: number;
    matchedTerms: string[];
  }>;
  scores: Array<{
    assetId: string;
    title: string;
    score: number;
  }>;
  finalAnswer: string;
  steps: AgentTraceStep[];
};

export type AskResponse = {
  answer: string;
  citations: Citation[];
  results: SearchResult[];
  trace: AgentTrace;
  provider: {
    name: string;
    mode: "mock" | "deepseek" | "deepseek-general" | "strict-no-evidence";
    model?: string;
  };
};

export type AnswerProviderInput = {
  question: string;
  normalizedQuestion: string;
  results: SearchResult[];
  assets: KnowledgeAsset[];
};

export type AnswerProviderOutput = {
  answer: string;
  citations: Citation[];
  provider: AskResponse["provider"];
};

export type AnswerProvider = {
  generateAnswer(input: AnswerProviderInput): Promise<AnswerProviderOutput>;
};

export type AskOptions = {
  apiKey?: string;
  model?: string;
};
