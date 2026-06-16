"use client";

import { useMemo, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import type { AskResponse } from "@/types/agent";
import type { KnowledgeAsset } from "@/types/assets";
import type { SearchResult } from "@/types/retrieval";

type WorkbenchProps = {
  initialAssets: KnowledgeAsset[];
};

type RequestState = "idle" | "loading" | "success" | "error";

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

export function Workbench({ initialAssets }: WorkbenchProps) {
  const [assets, setAssets] = useState(initialAssets);
  const [assetPanelOpen, setAssetPanelOpen] = useState(false);
  const [assetForm, setAssetForm] = useState<AddAssetForm>({
    title: "",
    content: "",
    tags: ""
  });
  const [assetState, setAssetState] = useState<RequestState>("idle");
  const [assetMessage, setAssetMessage] = useState("");
  const [question, setQuestion] = useState("AIOS 支持哪些能力？");
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
  const noAnswer = askState === "success" && answer?.results.length === 0;

  async function submitAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAssetState("loading");
    setAssetMessage("");

    try {
      const response = await fetch("/api/assets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(assetForm)
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "新增资产失败。");
      }

      setAssets((current) => [...current, payload.data]);
      setAssetForm({ title: "", content: "", tags: "" });
      setAssetState("success");
      setAssetMessage("资产已写入本地 JSON。");
      setAssetPanelOpen(false);
    } catch (error) {
      setAssetState("error");
      setAssetMessage(error instanceof Error ? error.message : "新增资产失败。");
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
        headers: {
          "Content-Type": "application/json"
        },
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
    if (!question.trim()) {
      setAskState("error");
      setAskError("Question is required.");
      return;
    }

    setAskState("loading");
    setAskError("");

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ question })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Agent 回答失败。");
      }

      setAnswer(payload.data);
      setSearchResults(payload.data.results);
      setSearchQuery(question);
      setAskState("success");
      setSearchState("success");
    } catch (error) {
      setAskState("error");
      setAskError(error instanceof Error ? error.message : "Agent 回答失败。");
    }
  }

  function handleQuestionKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitQuestion();
    }
  }

  return (
    <main className="min-h-screen px-4 py-4 text-ink-900 sm:px-5 lg:px-6">
      <section className="mx-auto flex min-h-[calc(100vh-32px)] max-w-[1540px] flex-col overflow-hidden rounded-[8px] border border-line-200 bg-paper-50 shadow-[0_24px_80px_rgba(25,25,25,0.12)]">
        <header className="flex flex-col gap-4 border-b border-line-200 bg-paper-50/95 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-serif text-2xl leading-tight text-ink-950">
                AssetMind Workbench
              </h1>
              <span className="rounded-[8px] border border-line-200 bg-white px-2.5 py-1 text-xs font-semibold text-signal-600">
                Mock RAG
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-ink-600">
              <span>{assets.length} assets</span>
              <span>{tags.length} tags</span>
              <span>{answer ? `${answer.results.length} retrieved` : "ready"}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {sampleQuestions.map((sample) => (
              <button
                className="rounded-[8px] border border-line-200 bg-white px-3 py-2 text-sm text-ink-700 transition hover:border-line-300 hover:text-ink-950"
                key={sample}
                onClick={() => setQuestion(sample)}
                type="button"
              >
                {sample}
              </button>
            ))}
          </div>
        </header>

        <div className="grid flex-1 grid-cols-1 divide-y divide-line-200 xl:grid-cols-[320px_minmax(0,1fr)_360px] xl:divide-x xl:divide-y-0">
          <aside className="bg-paper-100/70 p-4 lg:p-5">
            <AssetLibrary
              assets={assets}
              onAddClick={() => setAssetPanelOpen(true)}
              tags={tags}
            />
          </aside>

          <section className="min-w-0 bg-paper-50 p-4 lg:p-5">
            <div className="grid gap-4">
              <QuestionPanel
                askError={askError}
                askState={askState}
                onAsk={() => void submitQuestion()}
                onKeyDown={handleQuestionKeyDown}
                question={question}
                setQuestion={setQuestion}
              />

              <AnswerPanel answer={answer} noAnswer={noAnswer} />

              <SearchPanel
                activeResults={activeResults}
                onSearch={submitSearch}
                searchError={searchError}
                searchQuery={searchQuery}
                searchState={searchState}
                setSearchQuery={setSearchQuery}
              />
            </div>
          </section>

          <aside className="bg-paper-100/70 p-4 lg:p-5">
            <TracePanel answer={answer} />
          </aside>
        </div>
      </section>

      {assetPanelOpen ? (
        <AddAssetPanel
          assetForm={assetForm}
          assetMessage={assetMessage}
          assetState={assetState}
          onClose={() => setAssetPanelOpen(false)}
          onSubmit={submitAsset}
          setAssetForm={setAssetForm}
        />
      ) : null}
    </main>
  );
}

function AssetLibrary({
  assets,
  onAddClick,
  tags
}: {
  assets: KnowledgeAsset[];
  onAddClick: () => void;
  tags: string[];
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <SectionLabel label="Asset Library" />
        <button
          className="rounded-[8px] bg-ink-950 px-3 py-2 text-sm font-semibold text-paper-50 transition hover:bg-ink-800"
          onClick={onAddClick}
          type="button"
        >
          Add asset
        </button>
      </div>

      {tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              className="rounded-[8px] border border-line-200 bg-paper-50 px-2 py-1 text-xs text-ink-600"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {assets.length === 0 ? (
          <EmptyState title="No assets" />
        ) : (
          assets.map((asset) => (
            <article
              className="rounded-[8px] border border-line-200 bg-paper-50 p-4 transition hover:border-line-300 hover:bg-white"
              key={asset.id}
            >
              <h2 className="text-sm font-semibold text-ink-950">
                {asset.title}
              </h2>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink-600">
                {asset.content}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {asset.tags.map((tag) => (
                  <span
                    className="rounded-[8px] bg-paper-100 px-2 py-1 text-xs text-ink-600"
                    key={`${asset.id}-${tag}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function QuestionPanel({
  askError,
  askState,
  onAsk,
  onKeyDown,
  question,
  setQuestion
}: {
  askError: string;
  askState: RequestState;
  onAsk: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  question: string;
  setQuestion: (value: string) => void;
}) {
  return (
    <section className="rounded-[8px] border border-line-200 bg-white p-4 lg:p-5">
      <div className="flex items-center justify-between gap-3">
        <SectionLabel label="Ask Agent" />
        <StatusBadge state={askState} />
      </div>
      <textarea
        className="mt-4 min-h-28 w-full resize-none rounded-[8px] border border-line-200 bg-paper-50 p-4 text-base leading-7 text-ink-900 outline-none transition placeholder:text-ink-500 focus:border-signal-500 focus:bg-white"
        onChange={(event) => setQuestion(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="AIOS 支持哪些能力？"
        value={question}
      />
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-600">
          {askError || "Ready"}
        </p>
        <button
          className="rounded-[8px] bg-signal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-signal-500 disabled:cursor-not-allowed disabled:opacity-55"
          disabled={askState === "loading"}
          onClick={onAsk}
          type="button"
        >
          {askState === "loading" ? "Answering..." : "Ask"}
        </button>
      </div>
    </section>
  );
}

function AnswerPanel({
  answer,
  noAnswer
}: {
  answer: AskResponse | null;
  noAnswer: boolean;
}) {
  return (
    <section className="rounded-[8px] border border-line-200 bg-white p-4 lg:p-5">
      <SectionLabel label="Answer" />
      {!answer ? (
        <EmptyState title="No answer yet" />
      ) : (
        <div className="mt-4">
          <div
            className={`rounded-[8px] border p-4 text-base leading-8 ${
              noAnswer
                ? "border-amber-500/40 bg-amber-500/10 text-ink-800"
                : "border-line-200 bg-paper-50 text-ink-900"
            }`}
          >
            {answer.answer}
          </div>

          <div className="mt-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
              Citations
            </div>
            {answer.citations.length === 0 ? (
              <p className="mt-3 text-sm text-ink-600">
                No citation available.
              </p>
            ) : (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {answer.citations.map((citation, index) => (
                  <article
                    className="rounded-[8px] border border-line-200 bg-paper-50 p-3"
                    key={citation.assetId}
                  >
                    <div className="text-xs font-semibold text-signal-600">
                      Citation {index + 1}
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-ink-950">
                      {citation.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink-600">
                      {citation.snippet}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function SearchPanel({
  activeResults,
  onSearch,
  searchError,
  searchQuery,
  searchState,
  setSearchQuery
}: {
  activeResults: SearchResult[];
  onSearch: (event: FormEvent<HTMLFormElement>) => void;
  searchError: string;
  searchQuery: string;
  searchState: RequestState;
  setSearchQuery: (value: string) => void;
}) {
  return (
    <section className="rounded-[8px] border border-line-200 bg-white p-4 lg:p-5">
      <div className="flex items-center justify-between gap-3">
        <SectionLabel label="Retrieved Evidence" />
        <StatusBadge state={searchState} />
      </div>
      <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={onSearch}>
        <input
          className="min-h-10 flex-1 rounded-[8px] border border-line-200 bg-paper-50 px-3 text-sm text-ink-900 outline-none transition placeholder:text-ink-500 focus:border-signal-500 focus:bg-white"
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search assets"
          value={searchQuery}
        />
        <button
          className="rounded-[8px] border border-line-300 bg-paper-50 px-4 py-2 text-sm font-semibold text-ink-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-55"
          disabled={searchState === "loading"}
          type="submit"
        >
          {searchState === "loading" ? "Searching..." : "Search"}
        </button>
      </form>
      {searchError ? (
        <p className="mt-3 text-sm text-amber-500">{searchError}</p>
      ) : null}

      <div className="mt-4 space-y-3">
        {searchState === "success" && activeResults.length === 0 ? (
          <EmptyState title="No matching assets" />
        ) : null}
        {activeResults.map((result) => (
          <article
            className="rounded-[8px] border border-line-200 bg-paper-50 p-4"
            key={result.assetId}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-ink-950">
                  {result.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-ink-600">
                  {result.snippet}
                </p>
              </div>
              <span className="rounded-[8px] bg-signal-600 px-2 py-1 text-xs font-semibold text-white">
                {result.score.toFixed(2)}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {result.matchedTerms.map((term) => (
                <span
                  className="rounded-[8px] border border-line-200 bg-white px-2 py-1 text-xs text-ink-600"
                  key={`${result.assetId}-${term}`}
                >
                  {term}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function TracePanel({ answer }: { answer: AskResponse | null }) {
  const steps = answer?.trace.steps ?? [];
  const scores = answer?.trace.scores ?? [];

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <SectionLabel label="Agent Trace" />
        {answer ? (
          <span className="rounded-[8px] border border-line-200 bg-paper-50 px-2.5 py-1 text-xs font-semibold text-ink-600">
            {answer.provider.mode}
          </span>
        ) : null}
      </div>

      {!answer ? (
        <EmptyState title="Trace pending" />
      ) : (
        <div className="mt-5 space-y-5">
          <div className="rounded-[8px] border border-line-200 bg-paper-50 p-3">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
              Query
            </div>
            <p className="mt-2 text-sm leading-6 text-ink-900">
              {answer.trace.query}
            </p>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <div className="flex gap-3" key={step.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={`grid h-7 w-7 place-items-center rounded-full border text-xs font-semibold ${
                      step.status === "completed"
                        ? "border-signal-500 bg-signal-600 text-white"
                        : "border-line-300 bg-paper-50 text-ink-600"
                    }`}
                  >
                    {index + 1}
                  </div>
                  {index < steps.length - 1 ? (
                    <div className="h-12 w-px bg-line-200" />
                  ) : null}
                </div>
                <div className="min-w-0 pb-2">
                  <div className="text-sm font-semibold text-ink-950">
                    {step.label}
                  </div>
                  <p className="mt-1 line-clamp-3 text-sm leading-6 text-ink-600">
                    {step.summary}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-[8px] border border-line-200 bg-paper-50 p-3">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
              Scores
            </div>
            {scores.length === 0 ? (
              <p className="mt-3 text-sm text-ink-600">No scores.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {scores.map((score) => (
                  <div
                    className="flex items-center justify-between gap-3 text-sm"
                    key={score.assetId}
                  >
                    <span className="truncate text-ink-700">{score.title}</span>
                    <span className="font-semibold text-ink-950">
                      {score.score.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AddAssetPanel({
  assetForm,
  assetMessage,
  assetState,
  onClose,
  onSubmit,
  setAssetForm
}: {
  assetForm: AddAssetForm;
  assetMessage: string;
  assetState: RequestState;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  setAssetForm: (value: AddAssetForm) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-ink-950/30">
      <div className="ml-auto flex h-full w-full max-w-xl flex-col border-l border-line-200 bg-paper-50 shadow-[0_24px_80px_rgba(25,25,25,0.22)]">
        <div className="flex items-center justify-between gap-3 border-b border-line-200 px-5 py-4">
          <div>
            <SectionLabel label="New Asset" />
            <h2 className="mt-2 text-xl font-semibold text-ink-950">
              Add knowledge asset
            </h2>
          </div>
          <button
            className="rounded-[8px] border border-line-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700 transition hover:text-ink-950"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
        <form className="flex flex-1 flex-col gap-4 overflow-y-auto p-5" onSubmit={onSubmit}>
          <label className="grid gap-2 text-sm font-semibold text-ink-800">
            Title
            <input
              className="min-h-11 rounded-[8px] border border-line-200 bg-white px-3 text-sm font-normal text-ink-900 outline-none transition focus:border-signal-500"
              onChange={(event) =>
                setAssetForm({ ...assetForm, title: event.target.value })
              }
              placeholder="例如：客户成功案例"
              value={assetForm.title}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-ink-800">
            Content
            <textarea
              className="min-h-44 resize-none rounded-[8px] border border-line-200 bg-white p-3 text-sm font-normal leading-6 text-ink-900 outline-none transition focus:border-signal-500"
              onChange={(event) =>
                setAssetForm({ ...assetForm, content: event.target.value })
              }
              placeholder="正文内容"
              value={assetForm.content}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-ink-800">
            Tags
            <input
              className="min-h-11 rounded-[8px] border border-line-200 bg-white px-3 text-sm font-normal text-ink-900 outline-none transition focus:border-signal-500"
              onChange={(event) =>
                setAssetForm({ ...assetForm, tags: event.target.value })
              }
              placeholder="销售资料, 客户案例"
              value={assetForm.tags}
            />
          </label>
          {assetMessage ? (
            <p
              className={`rounded-[8px] border px-3 py-2 text-sm ${
                assetState === "error"
                  ? "border-amber-500/40 bg-amber-500/10 text-ink-800"
                  : "border-signal-500/30 bg-signal-500/10 text-signal-600"
              }`}
            >
              {assetMessage}
            </p>
          ) : null}
          <div className="mt-auto flex justify-end gap-3 pt-3">
            <button
              className="rounded-[8px] border border-line-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition hover:text-ink-950"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-[8px] bg-ink-950 px-4 py-2 text-sm font-semibold text-paper-50 transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-55"
              disabled={assetState === "loading"}
              type="submit"
            >
              {assetState === "loading" ? "Saving..." : "Save asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
      {label}
    </div>
  );
}

function StatusBadge({ state }: { state: RequestState }) {
  const label = {
    idle: "idle",
    loading: "loading",
    success: "ready",
    error: "error"
  }[state];

  return (
    <span
      className={`rounded-[8px] border px-2.5 py-1 text-xs font-semibold ${
        state === "error"
          ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
          : "border-line-200 bg-paper-50 text-ink-600"
      }`}
    >
      {label}
    </span>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="mt-4 rounded-[8px] border border-dashed border-line-300 bg-paper-50 p-4 text-sm text-ink-600">
      {title}
    </div>
  );
}
