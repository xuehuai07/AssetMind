import { normalizeText, searchKnowledgeAssets } from "@/lib/retrieval";
import type { KnowledgeAsset } from "@/types/assets";
import type {
  AgentTrace,
  AnswerProvider,
  AnswerProviderInput,
  AnswerProviderOutput,
  AskResponse,
  Citation
} from "@/types/agent";
import type { SearchResult } from "@/types/retrieval";

export const mockAnswerProvider: AnswerProvider = {
  async generateAnswer(input: AnswerProviderInput): Promise<AnswerProviderOutput> {
    const groundedResults = selectGroundedResults(input.results);

    if (groundedResults.length === 0) {
      return {
        answer:
          "当前知识资产中没有检索到足够相关的内容，因此不能基于已有资料给出可靠回答。建议补充相关知识资产后再提问。",
        citations: [],
        provider: {
          name: "Mock Answer Provider",
          mode: "mock"
        }
      };
    }

    const citations = createCitations(groundedResults);
    const evidence = groundedResults
      .slice(0, 2)
      .map((result) => `${result.title}：${result.snippet}`)
      .join(" ");

    return {
      answer: `基于检索到的知识资产，可以回答：${evidence}`,
      citations,
      provider: {
        name: "Mock Answer Provider",
        mode: "mock"
      }
    };
  }
};

export async function answerQuestion(
  question: string,
  assets: KnowledgeAsset[],
  provider: AnswerProvider = mockAnswerProvider
): Promise<AskResponse> {
  const normalizedQuestion = normalizeText(question);
  const results = searchKnowledgeAssets(question, assets);
  const providerOutput = await provider.generateAnswer({
    question,
    normalizedQuestion,
    results,
    assets
  });
  const trace = createTrace({
    question,
    normalizedQuestion,
    results,
    answer: providerOutput.answer
  });

  return {
    answer: providerOutput.answer,
    citations: providerOutput.citations,
    results,
    trace,
    provider: providerOutput.provider
  };
}

export function createDeepSeekProviderBoundary(): AnswerProvider {
  return {
    async generateAnswer(): Promise<AnswerProviderOutput> {
      throw new Error(
        "DeepSeek provider is intentionally not enabled in this phase. Configure DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, and DEEPSEEK_MODEL before implementing the provider."
      );
    }
  };
}

function createCitations(results: SearchResult[]): Citation[] {
  return results.map((result) => ({
    assetId: result.assetId,
    title: result.title,
    snippet: result.snippet
  }));
}

function selectGroundedResults(results: SearchResult[]): SearchResult[] {
  const [topResult] = results;

  if (!topResult) {
    return [];
  }

  const minimumScore = Math.max(0.2, topResult.score * 0.5);

  return results.filter((result) => result.score >= minimumScore);
}

function createTrace(input: {
  question: string;
  normalizedQuestion: string;
  results: SearchResult[];
  answer: string;
}): AgentTrace {
  const retrievedAssets = input.results.map((result) => ({
    assetId: result.assetId,
    title: result.title,
    score: result.score,
    matchedTerms: result.matchedTerms
  }));
  const scores = input.results.map((result) => ({
    assetId: result.assetId,
    title: result.title,
    score: result.score
  }));
  const hasResults = input.results.length > 0;

  return {
    query: input.question,
    normalizedQuery: input.normalizedQuestion,
    retrievedAssets,
    scores,
    finalAnswer: input.answer,
    steps: [
      {
        id: "query-normalization",
        label: "Query normalization",
        status: "completed",
        summary: `Normalized query: ${input.normalizedQuestion || "(empty)"}`
      },
      {
        id: "retrieval",
        label: "Retrieval",
        status: "completed",
        summary: hasResults
          ? `Retrieved ${input.results.length} relevant asset(s).`
          : "No relevant assets were retrieved."
      },
      {
        id: "scoring",
        label: "Scoring",
        status: hasResults ? "completed" : "skipped",
        summary: hasResults
          ? scores
              .map((score) => `${score.title}: ${score.score}`)
              .join("; ")
          : "Scoring skipped because retrieval returned no hits."
      },
      {
        id: "mock-answer-generation",
        label: "Mock answer generation",
        status: "completed",
        summary: hasResults
          ? "Generated answer from retrieved snippets and citations."
          : "Generated no-evidence answer."
      },
      {
        id: "final-answer",
        label: "Final answer",
        status: "completed",
        summary: input.answer
      }
    ]
  };
}
