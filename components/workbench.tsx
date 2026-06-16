"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent, ReactNode } from "react";
import type { AskResponse } from "@/types/agent";
import type { KnowledgeAsset } from "@/types/assets";
import type { SearchResult } from "@/types/retrieval";

type WorkbenchProps = {
  initialAssets: KnowledgeAsset[];
};

type RequestState = "idle" | "loading" | "success" | "error";
type ToolPanel = "model" | "upload" | "library" | "manual" | null;

type AddAssetForm = {
  title: string;
  content: string;
  tags: string;
};

const sampleQuestions = [
  "AIOS 支持哪些能力？",
  "Agent 为什么需要可观测性？",
  "数字资产知识库沉淀哪些资料？"
];

const modelOptions = [
  { label: "Flash", value: "deepseek-v4-flash" },
  { label: "Pro", value: "deepseek-v4-pro" }
];

const toolItems: Array<{
  key: Exclude<ToolPanel, null>;
  label: string;
  mark: string;
}> = [
  { key: "model", label: "模型设置", mark: "AI" },
  { key: "upload", label: "上传资料", mark: "+" },
  { key: "library", label: "资料库", mark: "K" },
  { key: "manual", label: "手动补充", mark: "N" }
];

export function Workbench({ initialAssets }: WorkbenchProps) {
  const [assets, setAssets] = useState(initialAssets);
  const [activePanel, setActivePanel] = useState<ToolPanel>(null);
  const [showEvidence, setShowEvidence] = useState(false);
  const [assetForm, setAssetForm] = useState<AddAssetForm>({
    title: "",
    content: "",
    tags: ""
  });
  const [assetState, setAssetState] = useState<RequestState>("idle");
  const [assetMessage, setAssetMessage] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<RequestState>("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("deepseek-v4-flash");
  const [modelEnabled, setModelEnabled] = useState(false);
  const [modelState, setModelState] = useState<RequestState>("idle");
  const [modelMessage, setModelMessage] = useState(
    "Key 仅保存在当前页面会话，刷新后需要重新输入。"
  );
  const [question, setQuestion] = useState("");
  const [lastQuestion, setLastQuestion] = useState("");
  const [askState, setAskState] = useState<RequestState>("idle");
  const [askError, setAskError] = useState("");
  const [answer, setAnswer] = useState<AskResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchState, setSearchState] = useState<RequestState>("idle");
  const [searchError, setSearchError] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const tags = useMemo(() => {
    return Array.from(new Set(assets.flatMap((asset) => asset.tags))).sort();
  }, [assets]);

  const activeResults = answer?.results ?? searchResults;
  const hasAi = modelEnabled && apiKey.trim().length > 0;
  const conversationStarted = Boolean(lastQuestion) || askState === "loading";

  async function validateModelKey() {
    if (!apiKey.trim()) {
      setModelEnabled(false);
      setModelState("error");
      setModelMessage("请输入 DeepSeek API Key。");
      return;
    }

    setModelState("loading");
    setModelMessage("正在验证 Key...");

    try {
      const response = await fetch("/api/llm/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Key 验证失败。");
      }

      setModelEnabled(true);
      setModelState("success");
      setModelMessage(`DeepSeek 已启用，可用模型 ${payload.data.models.length} 个。`);
    } catch (error) {
      setModelEnabled(false);
      setModelState("error");
      setModelMessage(error instanceof Error ? error.message : "Key 验证失败。");
    }
  }

  async function submitUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!uploadFile) {
      setUploadState("error");
      setUploadMessage("请选择 txt、md、pdf 或 docx 文件。");
      return;
    }

    setUploadState("loading");
    setUploadMessage("正在解析并写入资料库...");

    const formData = new FormData();
    formData.append("file", uploadFile);

    try {
      const response = await fetch("/api/assets/upload", {
        method: "POST",
        body: formData
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "上传失败。");
      }

      setAssets((current) => [...current, payload.data]);
      setUploadFile(null);
      setUploadState("success");
      setUploadMessage("参考资料已加入资料库，可立即用于问答。");
    } catch (error) {
      setUploadState("error");
      setUploadMessage(error instanceof Error ? error.message : "上传失败。");
    }
  }

  async function submitAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAssetState("loading");
    setAssetMessage("");

    try {
      const response = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assetForm)
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "新增资料失败。");
      }

      setAssets((current) => [...current, payload.data]);
      setAssetForm({ title: "", content: "", tags: "" });
      setAssetState("success");
      setAssetMessage("资料已写入本地知识库。");
    } catch (error) {
      setAssetState("error");
      setAssetMessage(error instanceof Error ? error.message : "新增资料失败。");
    }
  }

  async function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchState("idle");
      return;
    }

    setSearchState("loading");
    setSearchError("");

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "检索失败。");
      }

      setSearchResults(payload.data);
      setSearchState("success");
    } catch (error) {
      setSearchState("error");
      setSearchError(error instanceof Error ? error.message : "检索失败。");
    }
  }

  async function submitQuestion() {
    const submittedQuestion = question.trim();

    if (!submittedQuestion) {
      setAskState("error");
      setAskError("请输入问题。");
      return;
    }

    setAskState("loading");
    setAskError("");
    setShowEvidence(false);
    setLastQuestion(submittedQuestion);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: submittedQuestion,
          apiKey: hasAi ? apiKey : undefined,
          model: selectedModel
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "智能问答失败。");
      }

      setAnswer(payload.data);
      setSearchResults(payload.data.results);
      setSearchQuery(submittedQuestion);
      setAskState("success");
      setSearchState("success");
      setQuestion("");
    } catch (error) {
      setAskState("error");
      setAskError(error instanceof Error ? error.message : "智能问答失败。");
    }
  }

  function handleQuestionKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitQuestion();
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setUploadFile(event.target.files?.[0] ?? null);
    setUploadMessage("");
    setUploadState("idle");
  }

  return (
    <main className="gemini-shell min-h-screen text-slate-950">
      <nav className="side-rail" aria-label="工作台工具">
        <div className="rail-brand">
          <div className="brand-mark" aria-hidden="true" />
          <span>AssetMind</span>
        </div>
        <button
          className="rail-action"
          onClick={() => {
            setAnswer(null);
            setLastQuestion("");
            setQuestion("");
            setShowEvidence(false);
          }}
          type="button"
        >
          <span className="rail-icon">+</span>
          <span>发起新对话</span>
        </button>
        <div className="rail-group">
          {toolItems.map((item) => (
            <button
              aria-label={item.label}
              className={`rail-action ${activePanel === item.key ? "active" : ""}`}
              key={item.key}
              onClick={() => setActivePanel(item.key)}
              title={item.label}
              type="button"
            >
              <span className="rail-icon">{item.mark}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="top-status">
        <span>{assets.length} 条资料</span>
        <span>{hasAi ? "DeepSeek 已启用" : "本地摘要"}</span>
      </div>

      <section className="home-stage">
        <div className="home-glow" aria-hidden="true" />
        {!conversationStarted ? (
          <div className="home-content">
            <p className="eyebrow text-center">AssetMind 智能资料库</p>
            <h1 className="home-title">
              嗨，我们进入正题吧
            </h1>
            <QuestionComposer
              askError={askError}
              askState={askState}
              hasAi={hasAi}
              onAsk={() => void submitQuestion()}
              onKeyDown={handleQuestionKeyDown}
              question={question}
              selectedModel={selectedModel}
              setActivePanel={setActivePanel}
              setQuestion={setQuestion}
            />
            <div className="sample-row" aria-label="示例问题">
              {sampleQuestions.map((sample) => (
                <button
                  className="prompt-chip"
                  key={sample}
                  onClick={() => setQuestion(sample)}
                  type="button"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ChatView
            activeResults={activeResults}
            answer={answer}
            askState={askState}
            lastQuestion={lastQuestion}
            onSearch={submitSearch}
            searchError={searchError}
            searchQuery={searchQuery}
            searchState={searchState}
            setSearchQuery={setSearchQuery}
            setShowEvidence={setShowEvidence}
            showEvidence={showEvidence}
          >
            <QuestionComposer
              askError={askError}
              askState={askState}
              hasAi={hasAi}
              onAsk={() => void submitQuestion()}
              onKeyDown={handleQuestionKeyDown}
              question={question}
              selectedModel={selectedModel}
              setActivePanel={setActivePanel}
              setQuestion={setQuestion}
            />
          </ChatView>
        )}
      </section>

      {activePanel ? (
        <ToolDialog
          onClose={() => setActivePanel(null)}
          title={toolTitle(activePanel)}
        >
          {activePanel === "model" ? (
            <ModelPanel
              apiKey={apiKey}
              modelEnabled={modelEnabled}
              modelMessage={modelMessage}
              modelState={modelState}
              onValidate={() => void validateModelKey()}
              selectedModel={selectedModel}
              setApiKey={setApiKey}
              setSelectedModel={setSelectedModel}
            />
          ) : null}
          {activePanel === "upload" ? (
            <UploadPanel
              file={uploadFile}
              message={uploadMessage}
              onFileChange={handleFileChange}
              onSubmit={submitUpload}
              state={uploadState}
            />
          ) : null}
          {activePanel === "library" ? (
            <AssetLibrary assets={assets} tags={tags} />
          ) : null}
          {activePanel === "manual" ? (
            <ManualAssetPanel
              assetForm={assetForm}
              assetMessage={assetMessage}
              assetState={assetState}
              onSubmit={submitAsset}
              setAssetForm={setAssetForm}
            />
          ) : null}
        </ToolDialog>
      ) : null}
    </main>
  );
}

function QuestionComposer({
  askError,
  askState,
  hasAi,
  onAsk,
  onKeyDown,
  question,
  selectedModel,
  setActivePanel,
  setQuestion
}: {
  askError: string;
  askState: RequestState;
  hasAi: boolean;
  onAsk: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  question: string;
  selectedModel: string;
  setActivePanel: (panel: ToolPanel) => void;
  setQuestion: (value: string) => void;
}) {
  return (
    <div className="ask-composer">
      <button
        aria-label="上传参考资料"
        className="composer-icon"
        onClick={() => setActivePanel("upload")}
        title="上传参考资料"
        type="button"
      >
        +
      </button>
      <textarea
        className="composer-input"
        onChange={(event) => setQuestion(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="向 AssetMind 提问"
        rows={1}
        value={question}
      />
      <button
        className="model-select"
        onClick={() => setActivePanel("model")}
        type="button"
      >
        {hasAi ? modelShortName(selectedModel) : "本地"}
      </button>
      <button
        aria-label="发送"
        className="send-button"
        disabled={askState === "loading"}
        onClick={onAsk}
        type="button"
      >
        {askState === "loading" ? "..." : "↑"}
      </button>
      {askError ? <p className="composer-error">{askError}</p> : null}
    </div>
  );
}

function ChatView({
  activeResults,
  answer,
  askState,
  children,
  lastQuestion,
  onSearch,
  searchError,
  searchQuery,
  searchState,
  setSearchQuery,
  setShowEvidence,
  showEvidence
}: {
  activeResults: SearchResult[];
  answer: AskResponse | null;
  askState: RequestState;
  children: ReactNode;
  lastQuestion: string;
  onSearch: (event: FormEvent<HTMLFormElement>) => void;
  searchError: string;
  searchQuery: string;
  searchState: RequestState;
  setSearchQuery: (value: string) => void;
  setShowEvidence: (value: boolean) => void;
  showEvidence: boolean;
}) {
  return (
    <div className="chat-layout">
      <div className="chat-thread">
        <div className="user-message">{lastQuestion}</div>
        {askState === "loading" ? (
          <div className="assistant-message loading-message">
            正在思考...
          </div>
        ) : null}
        {answer ? (
          <AnswerPanel
            activeResults={activeResults}
            answer={answer}
            onSearch={onSearch}
            searchError={searchError}
            searchQuery={searchQuery}
            searchState={searchState}
            setSearchQuery={setSearchQuery}
            setShowEvidence={setShowEvidence}
            showEvidence={showEvidence}
          />
        ) : null}
      </div>
      <div className="chat-composer-wrap">{children}</div>
    </div>
  );
}

function AnswerPanel({
  activeResults,
  answer,
  onSearch,
  searchError,
  searchQuery,
  searchState,
  setSearchQuery,
  setShowEvidence,
  showEvidence
}: {
  activeResults: SearchResult[];
  answer: AskResponse;
  onSearch: (event: FormEvent<HTMLFormElement>) => void;
  searchError: string;
  searchQuery: string;
  searchState: RequestState;
  setSearchQuery: (value: string) => void;
  setShowEvidence: (value: boolean) => void;
  showEvidence: boolean;
}) {
  const strict = answer.provider.mode === "strict-no-evidence";

  return (
    <section className="answer-sheet">
      <div className={strict ? "warning-answer" : "answer-box"}>
        {answer.answer}
      </div>
      <div className="answer-actions">
        <button
          className="ghost-button"
          onClick={() => setShowEvidence(!showEvidence)}
          type="button"
        >
          {showEvidence ? "收起证据与 Trace" : "查看证据检索与 Agent Trace"}
        </button>
        <span className="text-sm text-slate-500">
          {providerLabel(answer)} · {answer.citations.length} 条引用
        </span>
      </div>
      {showEvidence ? (
        <EvidencePanel
          activeResults={activeResults}
          answer={answer}
          onSearch={onSearch}
          searchError={searchError}
          searchQuery={searchQuery}
          searchState={searchState}
          setSearchQuery={setSearchQuery}
        />
      ) : null}
    </section>
  );
}

function EvidencePanel({
  activeResults,
  answer,
  onSearch,
  searchError,
  searchQuery,
  searchState,
  setSearchQuery
}: {
  activeResults: SearchResult[];
  answer: AskResponse;
  onSearch: (event: FormEvent<HTMLFormElement>) => void;
  searchError: string;
  searchQuery: string;
  searchState: RequestState;
  setSearchQuery: (value: string) => void;
}) {
  return (
    <div className="evidence-panel">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <PanelTitle label="引用依据" meta={`${answer.citations.length} 条`} />
          <div className="mt-3 grid gap-3">
            {answer.citations.length === 0 ? (
              <EmptyState title="本次没有可引用资料。" />
            ) : (
              answer.citations.map((citation, index) => (
                <article className="glass-card p-4" key={citation.assetId}>
                  <div className="text-xs font-semibold text-teal-700">
                    引用 {index + 1}
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-slate-950">
                    {citation.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                    {citation.snippet}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>
        <TracePanel answer={answer} />
      </div>

      <div className="mt-4">
        <PanelTitle label="证据检索" meta={`${activeResults.length} 条结果`} />
        <form className="mt-3 flex flex-col gap-3 sm:flex-row" onSubmit={onSearch}>
          <input
            className="field min-h-11 flex-1"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="检索资料库"
            value={searchQuery}
          />
          <button
            className="secondary-button min-w-24"
            disabled={searchState === "loading"}
            type="submit"
          >
            {searchState === "loading" ? "检索中..." : "检索"}
          </button>
        </form>
        {searchError ? (
          <p className="mt-3 text-sm text-amber-700">{searchError}</p>
        ) : null}
        <div className="mt-4 grid gap-3">
          {searchState === "success" && activeResults.length === 0 ? (
            <EmptyState title="没有匹配资料" />
          ) : null}
          {activeResults.map((result) => (
            <article className="glass-card p-4" key={result.assetId}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-950">
                    {result.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {result.snippet}
                  </p>
                </div>
                <span className="score-badge">{result.score.toFixed(2)}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.matchedTerms.map((term) => (
                  <span className="mini-chip" key={`${result.assetId}-${term}`}>
                    {term}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModelPanel({
  apiKey,
  modelEnabled,
  modelMessage,
  modelState,
  onValidate,
  selectedModel,
  setApiKey,
  setSelectedModel
}: {
  apiKey: string;
  modelEnabled: boolean;
  modelMessage: string;
  modelState: RequestState;
  onValidate: () => void;
  selectedModel: string;
  setApiKey: (value: string) => void;
  setSelectedModel: (value: string) => void;
}) {
  return (
    <section>
      <PanelTitle label="DeepSeek" meta={modelEnabled ? "已启用" : "未启用"} />
      <label className="mt-4 grid gap-2 text-sm font-medium text-slate-700">
        API Key
        <input
          className="field"
          onChange={(event) => setApiKey(event.target.value)}
          placeholder="sk-..."
          type="password"
          value={apiKey}
        />
      </label>
      <label className="mt-3 grid gap-2 text-sm font-medium text-slate-700">
        模型
        <select
          className="field"
          onChange={(event) => setSelectedModel(event.target.value)}
          value={selectedModel}
        >
          {modelOptions.map((option) => (
            <option key={option.value} value={option.value}>
              DeepSeek V4 {option.label}
            </option>
          ))}
        </select>
      </label>
      <button
        className="primary-button mt-4 w-full"
        disabled={modelState === "loading"}
        onClick={onValidate}
        type="button"
      >
        {modelState === "loading" ? "验证中..." : "验证并启用"}
      </button>
      <StatusLine message={modelMessage} state={modelState} />
    </section>
  );
}

function UploadPanel({
  file,
  message,
  onFileChange,
  onSubmit,
  state
}: {
  file: File | null;
  message: string;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  state: RequestState;
}) {
  return (
    <section>
      <PanelTitle label="上传参考资料" meta="txt / md / pdf / docx" />
      <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
        <label className="upload-target">
          <input
            accept=".txt,.md,.pdf,.docx,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={onFileChange}
            type="file"
          />
          <span className="text-sm font-semibold text-slate-950">
            {file ? file.name : "选择参考资料"}
          </span>
          <span className="text-xs text-slate-500">单文件不超过 10MB</span>
        </label>
        <button
          className="secondary-button"
          disabled={state === "loading"}
          type="submit"
        >
          {state === "loading" ? "解析中..." : "加入资料库"}
        </button>
      </form>
      <StatusLine message={message || "上传后会立即参与检索和问答。"} state={state} />
    </section>
  );
}

function AssetLibrary({
  assets,
  tags
}: {
  assets: KnowledgeAsset[];
  tags: string[];
}) {
  return (
    <section>
      <PanelTitle label="资料库" meta={`${assets.length} 条资料`} />
      <div className="mt-4 flex flex-wrap gap-2">
        {tags.length === 0 ? (
          <span className="soft-chip">暂无标签</span>
        ) : (
          tags.map((tag) => (
            <span className="soft-chip" key={tag}>
              {tag}
            </span>
          ))
        )}
      </div>
      <div className="mt-4 grid max-h-[58vh] gap-3 overflow-y-auto pr-1">
        {assets.length === 0 ? (
          <EmptyState title="资料库为空" />
        ) : (
          assets.map((asset) => (
            <article className="glass-card p-4" key={asset.id}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-sm font-semibold leading-6 text-slate-950">
                  {asset.title}
                </h2>
                <span className="status-pill">{sourceLabel(asset)}</span>
              </div>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                {asset.content}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {asset.tags.map((tag) => (
                  <span className="mini-chip" key={`${asset.id}-${tag}`}>
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function TracePanel({ answer }: { answer: AskResponse }) {
  const steps = answer.trace.steps;
  const scores = answer.trace.scores;

  return (
    <section>
      <PanelTitle label="运行轨迹" meta={providerLabel(answer)} />
      <div className="mt-4 grid gap-4">
        {steps.map((step, index) => (
          <div className="flex gap-3" key={step.id}>
            <div className="flex flex-col items-center">
              <span className={`step-dot ${step.status}`}>{index + 1}</span>
              {index < steps.length - 1 ? (
                <span className="h-9 w-px bg-white/60" />
              ) : null}
            </div>
            <div className="min-w-0 pb-2">
              <div className="text-sm font-semibold text-slate-950">
                {step.label}
              </div>
              <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-600">
                {step.summary}
              </p>
            </div>
          </div>
        ))}
        <div className="glass-card p-3">
          <div className="eyebrow">相关度</div>
          {scores.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">没有评分结果。</p>
          ) : (
            <div className="mt-3 grid gap-2">
              {scores.map((score) => (
                <div
                  className="flex items-center justify-between gap-3 text-sm"
                  key={score.assetId}
                >
                  <span className="truncate text-slate-700">{score.title}</span>
                  <span className="font-semibold text-slate-950">
                    {score.score.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ManualAssetPanel({
  assetForm,
  assetMessage,
  assetState,
  onSubmit,
  setAssetForm
}: {
  assetForm: AddAssetForm;
  assetMessage: string;
  assetState: RequestState;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  setAssetForm: (value: AddAssetForm) => void;
}) {
  return (
    <section>
      <PanelTitle label="手动补充" meta="快速录入" />
      <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
        <input
          className="field"
          onChange={(event) =>
            setAssetForm({ ...assetForm, title: event.target.value })
          }
          placeholder="资料标题"
          value={assetForm.title}
        />
        <textarea
          className="field min-h-32 resize-none p-3"
          onChange={(event) =>
            setAssetForm({ ...assetForm, content: event.target.value })
          }
          placeholder="正文内容"
          value={assetForm.content}
        />
        <input
          className="field"
          onChange={(event) =>
            setAssetForm({ ...assetForm, tags: event.target.value })
          }
          placeholder="标签，用逗号分隔"
          value={assetForm.tags}
        />
        <button
          className="secondary-button"
          disabled={assetState === "loading"}
          type="submit"
        >
          {assetState === "loading" ? "保存中..." : "保存资料"}
        </button>
      </form>
      <StatusLine message={assetMessage || "适合录入短文本和临时知识。"} state={assetState} />
    </section>
  );
}

function ToolDialog({
  children,
  onClose,
  title
}: {
  children: ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="tool-overlay">
      <button
        aria-label="关闭"
        className="tool-backdrop"
        onClick={onClose}
        type="button"
      />
      <section className="tool-dialog">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <button className="close-button" onClick={onClose} type="button">
            关闭
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function PanelTitle({ label, meta }: { label: string; meta: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold text-slate-950">{label}</h2>
      <span className="status-pill">{meta}</span>
    </div>
  );
}

function StatusLine({
  message,
  state
}: {
  message: string;
  state: RequestState;
}) {
  return (
    <p
      className={`mt-3 text-sm leading-6 ${
        state === "error"
          ? "text-amber-800"
          : state === "success"
            ? "text-teal-700"
            : "text-slate-600"
      }`}
    >
      {message}
    </p>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="rounded-[18px] border border-dashed border-white/70 bg-white/35 p-4 text-sm leading-6 text-slate-600">
      {title}
    </div>
  );
}

function providerLabel(answer: AskResponse): string {
  if (
    answer.provider.mode === "deepseek" ||
    answer.provider.mode === "deepseek-general"
  ) {
    return answer.provider.model ?? "DeepSeek";
  }

  if (answer.provider.mode === "strict-no-evidence") {
    return "未启用模型";
  }

  return "本地摘要";
}

function sourceLabel(asset: KnowledgeAsset): string {
  return asset.source?.type === "upload" ? "上传" : "录入";
}

function modelShortName(model: string): string {
  return model === "deepseek-v4-pro" ? "Pro" : "Flash";
}

function toolTitle(panel: Exclude<ToolPanel, null>): string {
  return {
    model: "模型设置",
    upload: "上传参考资料",
    library: "资料库",
    manual: "手动补充"
  }[panel];
}
