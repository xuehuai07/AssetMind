import type { SearchResult } from "@/types/retrieval";

export const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
export const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash";

export type DeepSeekModel = "deepseek-v4-flash" | "deepseek-v4-pro";

type DeepSeekChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

type DeepSeekModelsResponse = {
  data?: Array<{
    id?: string;
  }>;
};

export class DeepSeekApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeepSeekApiError";
  }
}

export async function validateDeepSeekKey(apiKey: string): Promise<{
  ok: true;
  models: string[];
}> {
  const response = await fetch(`${DEEPSEEK_BASE_URL}/models`, {
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new DeepSeekApiError(createDeepSeekStatusMessage(response.status));
  }

  const payload = (await response.json()) as DeepSeekModelsResponse;
  const models = payload.data
    ?.map((model) => model.id)
    .filter((id): id is string => typeof id === "string") ?? [];

  return { ok: true, models };
}

export async function generateDeepSeekAnswer(input: {
  apiKey: string;
  model: DeepSeekModel;
  question: string;
  results: SearchResult[];
}): Promise<string> {
  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: input.model,
      messages: [
        {
          role: "system",
          content:
            "你是企业知识库问答助手。只能基于用户提供的参考资料回答。参考资料没有明确依据时，必须回答“当前资料库没有足够依据”，不能编造、推测或补充外部知识。回答使用简体中文，结构清晰，必要时列出依据。"
        },
        {
          role: "user",
          content: buildGroundedPrompt(input.question, input.results)
        }
      ],
      thinking: { type: "disabled" },
      temperature: 0.2,
      max_tokens: 900,
      stream: false
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new DeepSeekApiError(createDeepSeekStatusMessage(response.status));
  }

  const payload = (await response.json()) as DeepSeekChatResponse;
  const content = payload.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new DeepSeekApiError("DeepSeek 未返回有效回答。");
  }

  return content;
}

export async function generateDeepSeekGeneralAnswer(input: {
  apiKey: string;
  model: DeepSeekModel;
  question: string;
}): Promise<string> {
  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: input.model,
      messages: [
        {
          role: "system",
          content:
            "你是一个通用 AI 助手。当前没有可用参考资料时，可以基于通用知识回答，但必须用简体中文，表达清楚、客观，不声称答案来自资料库或引用资料。"
        },
        {
          role: "user",
          content: input.question
        }
      ],
      thinking: { type: "disabled" },
      temperature: 0.4,
      max_tokens: 900,
      stream: false
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new DeepSeekApiError(createDeepSeekStatusMessage(response.status));
  }

  const payload = (await response.json()) as DeepSeekChatResponse;
  const content = payload.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new DeepSeekApiError("DeepSeek 未返回有效回答。");
  }

  return content;
}

export function normalizeDeepSeekModel(value: unknown): DeepSeekModel {
  return value === "deepseek-v4-pro" ? "deepseek-v4-pro" : DEFAULT_DEEPSEEK_MODEL;
}

function buildGroundedPrompt(question: string, results: SearchResult[]): string {
  const evidence = results
    .map(
      (result, index) =>
        `资料 ${index + 1}\n标题：${result.title}\n相关度：${result.score.toFixed(2)}\n摘录：${result.snippet}`
    )
    .join("\n\n");

  return `问题：${question}\n\n参考资料：\n${evidence}\n\n请只基于以上参考资料回答。`;
}

function createDeepSeekStatusMessage(status: number): string {
  if (status === 401 || status === 403) {
    return "DeepSeek Key 无效或无权限，请检查后重试。";
  }

  if (status === 429) {
    return "DeepSeek 调用频率受限，请稍后再试。";
  }

  return `DeepSeek 服务返回异常状态：${status}。`;
}
