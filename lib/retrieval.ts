import type { KnowledgeAsset } from "@/types/assets";
import type { SearchResult } from "@/types/retrieval";

const MAX_RESULTS = 3;
const SNIPPET_RADIUS = 34;
const COMMON_CHINESE_TERMS = [
  "AIOS",
  "Agent",
  "知识库",
  "工具调用",
  "工作流",
  "多智能体",
  "智能体",
  "数字资产",
  "智能检索",
  "问答",
  "企业",
  "权限",
  "控制",
  "可观测性",
  "客户案例",
  "产品说明",
  "销售资料",
  "业务流程",
  "上下文记忆",
  "结果校验",
  "任务拆解"
];

type WeightedMatch = {
  term: string;
  weight: number;
};

export function searchKnowledgeAssets(
  query: string,
  assets: KnowledgeAsset[]
): SearchResult[] {
  const normalizedQuery = normalizeText(query);
  const terms = tokenizeQuery(normalizedQuery);

  if (terms.length === 0) {
    return [];
  }

  return assets
    .map((asset) => scoreAsset(asset, terms))
    .filter((result): result is SearchResult => result !== null)
    .sort((left, right) => right.score - left.score)
    .slice(0, MAX_RESULTS);
}

export function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{Script=Han}a-z0-9]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeQuery(query: string): string[] {
  const normalized = normalizeText(query);
  const segments = normalized.split(" ").filter(Boolean);
  const tokens = new Set<string>();
  const compactQuery = normalized.replace(/\s+/g, "");
  const matchedBusinessTerms = new Set<string>();

  for (const term of COMMON_CHINESE_TERMS) {
    const normalizedTerm = normalizeText(term).replace(/\s+/g, "");
    if (normalizedTerm && compactQuery.includes(normalizedTerm)) {
      matchedBusinessTerms.add(normalizedTerm);
      tokens.add(normalizedTerm);
    }
  }

  for (const segment of segments) {
    if (containsHan(segment)) {
      if (!isCoveredByBusinessTerm(segment, matchedBusinessTerms)) {
        collectChineseTokens(segment, tokens, matchedBusinessTerms);
      }
    } else if (segment.length >= 2) {
      tokens.add(segment);
    }
  }

  return Array.from(tokens).filter((token) => token.length >= 2);
}

function scoreAsset(asset: KnowledgeAsset, terms: string[]): SearchResult | null {
  const title = normalizeText(asset.title).replace(/\s+/g, "");
  const content = normalizeText(asset.content).replace(/\s+/g, "");
  const tags = asset.tags.map((tag) => normalizeText(tag).replace(/\s+/g, ""));
  const matches: WeightedMatch[] = [];

  for (const term of terms) {
    let weight = 0;

    if (title.includes(term)) {
      weight += 8;
    }

    if (tags.some((tag) => tag.includes(term))) {
      weight += 5;
    }

    if (content.includes(term)) {
      weight += 2;
    }

    if (weight > 0) {
      matches.push({ term, weight });
    }
  }

  if (matches.length === 0) {
    return null;
  }

  const weightedScore = matches.reduce((sum, match) => sum + match.weight, 0);
  const coverage = matches.length / terms.length;
  const score = Number(Math.min(0.99, weightedScore / 24 + coverage * 0.35).toFixed(2));
  const matchedTerms = matches
    .sort((left, right) => right.weight - left.weight)
    .map((match) => match.term);

  return {
    assetId: asset.id,
    title: asset.title,
    snippet: createSnippet(asset.content, matchedTerms),
    score,
    matchedTerms
  };
}

function collectChineseTokens(
  segment: string,
  tokens: Set<string>,
  matchedBusinessTerms: Set<string>
): void {
  for (let size = 2; size <= Math.min(4, segment.length); size += 1) {
    for (let index = 0; index <= segment.length - size; index += 1) {
      const token = segment.slice(index, index + size);
      if (!isCoveredByBusinessTerm(token, matchedBusinessTerms)) {
        tokens.add(token);
      }
    }
  }
}

function isCoveredByBusinessTerm(
  token: string,
  matchedBusinessTerms: Set<string>
): boolean {
  return Array.from(matchedBusinessTerms).some(
    (term) => term !== token && term.includes(token)
  );
}

function createSnippet(content: string, matchedTerms: string[]): string {
  const compactContent = content.trim();
  const normalizedContent = normalizeText(compactContent).replace(/\s+/g, "");
  const firstMatch = matchedTerms.find((term) => normalizedContent.includes(term));

  if (!firstMatch) {
    return compactContent.slice(0, 96);
  }

  const matchIndex = normalizedContent.indexOf(firstMatch);
  const start = Math.max(0, matchIndex - SNIPPET_RADIUS);
  const end = Math.min(compactContent.length, matchIndex + firstMatch.length + SNIPPET_RADIUS);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < compactContent.length ? "..." : "";

  return `${prefix}${compactContent.slice(start, end)}${suffix}`;
}

function containsHan(value: string): boolean {
  return /\p{Script=Han}/u.test(value);
}
