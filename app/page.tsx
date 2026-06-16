import { getKnowledgeAssets } from "@/lib/assets-store";

const phaseCards = [
  {
    title: "Knowledge Assets",
    eyebrow: "Phase 02",
    description: "本地 JSON 资产库将提供初始数据、资产读取和新增接口。"
  },
  {
    title: "Retrieval Chain",
    eyebrow: "Phase 03",
    description: "检索结果会展示 score、snippet 和 matched terms，保证链路可解释。"
  },
  {
    title: "Agent Trace",
    eyebrow: "Phase 04",
    description: "问答结果会保留 query、retrieved assets、scores 和 final answer。"
  }
];

export default async function Home() {
  const assets = await getKnowledgeAssets();

  return (
    <main className="min-h-screen px-5 py-5 text-ink-900 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-40px)] max-w-7xl flex-col overflow-hidden rounded-[8px] border border-line-200 bg-paper-50 shadow-[0_24px_80px_rgba(25,25,25,0.12)]">
        <header className="flex flex-col gap-5 border-b border-line-200 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-signal-600">
              AssetMind Workbench
            </div>
            <h1 className="mt-2 max-w-3xl font-serif text-3xl leading-tight text-ink-950 md:text-5xl">
              Knowledge assets, retrieval evidence, and agent trace in one
              sober workspace.
            </h1>
          </div>
          <div className="w-full max-w-sm rounded-[8px] border border-line-200 bg-white/70 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
              Current stage
            </div>
            <div className="mt-2 text-2xl font-semibold text-ink-950">
              Assets API
            </div>
            <p className="mt-2 text-sm leading-6 text-ink-600">
              已接入本地 JSON 资产源，当前载入 {assets.length} 条知识资产。
            </p>
          </div>
        </header>

        <div className="grid flex-1 grid-cols-1 divide-y divide-line-200 lg:grid-cols-[280px_minmax(0,1fr)_320px] lg:divide-x lg:divide-y-0">
          <aside className="bg-paper-100/70 p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
              Asset Library
            </div>
            <div className="mt-6 space-y-3">
              {assets.map((asset) => (
                  <div
                    className="rounded-[8px] border border-line-200 bg-paper-50 p-4"
                    key={asset.id}
                  >
                    <div className="text-sm font-semibold text-ink-900">
                      {asset.title}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink-600">
                      {asset.content}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {asset.tags.map((tag) => (
                        <span
                          className="rounded-[8px] border border-line-200 px-2 py-1 text-xs text-ink-600"
                          key={tag}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </aside>

          <section className="p-5 md:p-7">
            <div className="rounded-[8px] border border-line-200 bg-white p-5">
              <label
                className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500"
                htmlFor="question"
              >
                Ask Agent
              </label>
              <textarea
                className="mt-3 min-h-32 w-full resize-none rounded-[8px] border border-line-200 bg-paper-50 p-4 text-base leading-7 text-ink-900 outline-none transition focus:border-signal-500 focus:bg-white"
                id="question"
                placeholder="例如：AIOS 支持哪些能力？"
                readOnly
              />
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-sm text-ink-600">
                  Phase 02 后将接入真实资产数据，Phase 04 后生成答案。
                </p>
                <button
                  className="rounded-[8px] bg-ink-950 px-4 py-2 text-sm font-semibold text-paper-50 opacity-60"
                  disabled
                  type="button"
                >
                  待接入
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {phaseCards.map((card) => (
                <article
                  className="rounded-[8px] border border-line-200 bg-paper-50 p-4"
                  key={card.title}
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-signal-600">
                    {card.eyebrow}
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-ink-950">
                    {card.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-ink-600">
                    {card.description}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <aside className="bg-paper-100/70 p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
              Agent Trace
            </div>
            <div className="mt-6 space-y-4">
              {["Query", "Retrieval", "Scoring", "Final Answer"].map(
                (step, index) => (
                  <div className="flex gap-3" key={step}>
                    <div className="flex flex-col items-center">
                      <div className="grid h-7 w-7 place-items-center rounded-full border border-line-300 bg-paper-50 text-xs font-semibold text-ink-700">
                        {index + 1}
                      </div>
                      {index < 3 ? (
                        <div className="h-10 w-px bg-line-200" />
                      ) : null}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-ink-900">
                        {step}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-ink-600">
                        等待后续阶段接入运行数据。
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
