import {
  DEFAULT_DEEPSEEK_MODEL,
  generateDeepSeekAnswer,
  generateDeepSeekGeneralAnswer,
  normalizeDeepSeekModel
} from "@/lib/deepseek";
import { normalizeText, searchKnowledgeAssets } from "@/lib/retrieval";
import type { KnowledgeAsset } from "@/types/assets";
import type {
  AgentTrace,
  AnswerProvider,
  AnswerProviderInput,
  AnswerProviderOutput,
  AskOptions,
  AskResponse,
  Citation
} from "@/types/agent";
import type { SearchResult } from "@/types/retrieval";

const MIN_EVIDENCE_SCORE = 0.2;

export const mockAnswerProvider: AnswerProvider = {
  async generateAnswer(input: AnswerProviderInput): Promise<AnswerProviderOutput> {
    const groundedResults = selectGroundedResults(input.results);
    const citations = createCitations(groundedResults);
    const evidence = groundedResults
      .slice(0, 2)
      .map((result) => `${result.title}：${result.snippet}`)
      .join(" ");

    return {
      answer: `已找到可参考资料。当前未启用 DeepSeek，先给出本地摘要：${evidence}`,
      citations,
      provider: {
        name: "本地摘要模式",
        mode: "mock"
      }
    };
  }
};

export async function answerQuestion(
  question: string,
  assets: KnowledgeAsset[],
  options: AskOptions = {},
  provider: AnswerProvider = mockAnswerProvider
): Promise<AskResponse> {
  const normalizedQuestion = normalizeText(question);
  const results = searchKnowledgeAssets(question, assets);
  const groundedResults = selectGroundedResults(results);
  const gate = evaluateEvidenceGate(results);

  if (!gate.passed) {
    if (options.apiKey) {
      const model = normalizeDeepSeekModel(options.model);
      const answer = await generateDeepSeekGeneralAnswer({
        apiKey: options.apiKey,
        model,
        question
      });

      return {
        answer,
        citations: [],
        results,
        trace: createTrace({
          question,
          normalizedQuestion,
          results,
          answer,
          gateSummary: gate.summary,
          modelSummary: `资料库无匹配依据，已调用 DeepSeek ${model} 进行通用回答。`
        }),
        provider: {
          name: "DeepSeek 通用回答",
          mode: "deepseek-general",
          model
        }
      };
    }

    const answer =
      "当前资料库没有足够依据回答这个问题，且尚未启用 DeepSeek。请在模型设置中输入并验证 Key，或先上传相关参考资料。";

    return {
      answer,
      citations: [],
      results,
      trace: createTrace({
        question,
        normalizedQuestion,
        results,
        answer,
        gateSummary: gate.summary,
        modelSummary: "证据不足且未启用 DeepSeek，未调用大模型。"
      }),
      provider: {
        name: "未启用模型",
        mode: "strict-no-evidence"
      }
    };
  }

  if (options.apiKey) {
    const model = normalizeDeepSeekModel(options.model);
    const answer = await generateDeepSeekAnswer({
      apiKey: options.apiKey,
      model,
      question,
      results: groundedResults
    });

    return {
      answer,
      citations: createCitations(groundedResults),
      results,
      trace: createTrace({
        question,
        normalizedQuestion,
        results,
        answer,
        gateSummary: gate.summary,
        modelSummary: `已调用 DeepSeek ${model}，仅基于 ${groundedResults.length} 条参考资料生成回答。`
      }),
      provider: {
        name: "DeepSeek",
        mode: "deepseek",
        model
      }
    };
  }

  const providerOutput = await provider.generateAnswer({
    question,
    normalizedQuestion,
    results: groundedResults,
    assets
  });

  return {
    answer: providerOutput.answer,
    citations: providerOutput.citations,
    results,
    trace: createTrace({
      question,
      normalizedQuestion,
      results,
      answer: providerOutput.answer,
      gateSummary: gate.summary,
      modelSummary: `未配置 DeepSeek Key，使用本地摘要模式。默认模型为 ${DEFAULT_DEEPSEEK_MODEL}。`
    }),
    provider: providerOutput.provider
  };
}

function createCitations(results: SearchResult[]): Citation[] {
  return results.map((result) => ({
    assetId: result.assetId,
    title: result.title,
    snippet: result.snippet
  }));
}

function evaluateEvidenceGate(results: SearchResult[]): {
  passed: boolean;
  summary: string;
} {
  const topScore = results[0]?.score ?? 0;

  if (topScore < MIN_EVIDENCE_SCORE) {
    return {
      passed: false,
      summary: `最高相关度 ${topScore.toFixed(2)}，低于门槛 ${MIN_EVIDENCE_SCORE.toFixed(2)}。`
    };
  }

  return {
    passed: true,
    summary: `最高相关度 ${topScore.toFixed(2)}，已达到门槛 ${MIN_EVIDENCE_SCORE.toFixed(2)}。`
  };
}

function selectGroundedResults(results: SearchResult[]): SearchResult[] {
  const [topResult] = results;

  if (!topResult || topResult.score < MIN_EVIDENCE_SCORE) {
    return [];
  }

  const minimumScore = Math.max(MIN_EVIDENCE_SCORE, topResult.score * 0.5);

  return results.filter((result) => result.score >= minimumScore);
}

function createTrace(input: {
  question: string;
  normalizedQuestion: string;
  results: SearchResult[];
  answer: string;
  gateSummary: string;
  modelSummary: string;
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
        label: "问题标准化",
        status: "completed",
        summary: `标准化结果：${input.normalizedQuestion || "空问题"}`
      },
      {
        id: "retrieval",
        label: "资料检索",
        status: "completed",
        summary: hasResults
          ? `命中 ${input.results.length} 条候选资料。`
          : "没有命中相关资料。"
      },
      {
        id: "evidence-gate",
        label: "证据门禁",
        status: hasResults ? "completed" : "skipped",
        summary: input.gateSummary
      },
      {
        id: "model-generation",
        label: "模型生成",
        status: input.modelSummary.includes("未调用") ? "skipped" : "completed",
        summary: input.modelSummary
      },
      {
        id: "final-answer",
        label: "最终回答",
        status: "completed",
        summary: input.answer
      }
    ]
  };
}
