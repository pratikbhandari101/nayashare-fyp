import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client.js";
import { formatDate } from "../utils/format.js";

const TYPES = [
  { id: "all", label: "All" },
  { id: "global", label: "Global" },
  { id: "nepal", label: "Nepal" }
];

const CATEGORIES = [
  { id: "tech", label: "Tech" },
  { id: "finance", label: "Finance" },
  { id: "agriculture", label: "Agriculture" },
  { id: "business", label: "Business" }
];

const PAGE_SIZE = 3;

function getSafeUrl(url) {
  if (!url) {
    return "";
  }

  try {
    const parsed = new URL(url);
    return parsed.href;
  } catch {
    return "";
  }
}

function NewsSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="h-4 w-28 rounded bg-zinc-200" />
          <div className="mt-4 h-7 w-11/12 rounded bg-zinc-200" />
          <div className="mt-3 h-4 w-full rounded bg-zinc-100" />
          <div className="mt-2 h-4 w-10/12 rounded bg-zinc-100" />
          <div className="mt-6 h-10 w-full rounded bg-zinc-200" />
        </div>
      ))}
    </div>
  );
}

function ShareButton({ article }) {
  async function handleShare() {
    const safeUrl = getSafeUrl(article.url);
    const shareData = {
      title: article.title,
      text: article.description || article.title,
      url: safeUrl
    };

    if (navigator.share && safeUrl) {
      await navigator.share(shareData);
      return;
    }

    if (safeUrl) {
      await navigator.clipboard.writeText(safeUrl);
    }
  }

  return (
    <button
      className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 transition hover:border-emerald-300 hover:text-emerald-700"
      type="button"
      onClick={handleShare}
      title="Share"
      aria-label="Share article"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 12v7a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-7M16 6l-4-4m0 0L8 6m4-4v14" />
      </svg>
    </button>
  );
}

function AIButton({ loading, onClick }) {
  return (
    <button
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
      type="button"
      title="AI summary"
      onClick={onClick}
    >
      {loading ? (
        <span className="text-xs font-bold">...</span>
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3Zm6 12 1 2.4 2.5 1-2.5 1L18 22l-1-2.6-2.5-1 2.5-1L18 15ZM5 14l.8 1.9L8 16.7l-2.2.8L5 20l-.8-2.5L2 16.7l2.2-.8L5 14Z" />
        </svg>
      )}
    </button>
  );
}

function formatFullDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);
}

function formatTime(date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  }).format(date);
}

export function News() {
  const [activeType, setActiveType] = useState("all");
  const [activeCategory, setActiveCategory] = useState("tech");
  const [search, setSearch] = useState("");
  const [articlesByKey, setArticlesByKey] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [aiSummaries, setAiSummaries] = useState({});
  const [loadingSummary, setLoadingSummary] = useState("");
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState("");

  const requestKey = `${activeType}:${activeCategory}`;

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let isMounted = true;

    apiRequest("/weather/today")
      .then((data) => {
        if (isMounted) {
          setWeather(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setWeatherError(err.message);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (articlesByKey[requestKey]) {
      setLoading(false);
      setError("");
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError("");

    const query = new URLSearchParams();
    if (activeType !== "all") {
      query.set("type", activeType);
    }
    query.set("category", activeCategory);

    apiRequest(`/news?${query.toString()}`)
      .then((data) => {
        if (isMounted) {
          setArticlesByKey((current) => ({
            ...current,
            [requestKey]: Array.isArray(data) ? data : []
          }));
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeType, activeCategory, articlesByKey, requestKey]);

  useEffect(() => {
    setPage(1);
  }, [activeType, activeCategory, search]);

  const rawArticles = articlesByKey[requestKey] || [];
  const filteredArticles = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return rawArticles;
    }

    return rawArticles.filter((article) =>
      [article.title, article.description, article.source]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [rawArticles, search]);

  const totalPages = Math.max(Math.ceil(filteredArticles.length / PAGE_SIZE), 1);
  const currentPage = Math.min(page, totalPages);
  const visibleArticles = filteredArticles.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function handleGenerateSummary(article) {
    const articleKey = article.url;

    if (aiSummaries[articleKey]?.summary && !aiSummaries[articleKey]?.collapsed) {
      setAiSummaries((current) => ({
        ...current,
        [articleKey]: {
          ...current[articleKey],
          collapsed: true
        }
      }));
      return;
    }

    if (aiSummaries[articleKey]?.summary && aiSummaries[articleKey]?.collapsed) {
      setAiSummaries((current) => ({
        ...current,
        [articleKey]: {
          ...current[articleKey],
          collapsed: false
        }
      }));
      return;
    }

    setLoadingSummary(articleKey);

    try {
      const data = await apiRequest("/ai/summary", {
        method: "POST",
        body: {
          summaryType: "news",
          title: article.title,
          source: article.source || "News source",
          publishedAt: article.publishedAt || "",
          category: `${activeType}:${activeCategory}`,
          description: article.description || ""
        }
      });

      setAiSummaries((current) => ({
        ...current,
        [articleKey]: {
          summary: data.summary || "AI summary is unavailable for this article right now.",
          collapsed: false
        }
      }));
    } catch (err) {
      setAiSummaries((current) => ({
        ...current,
        [articleKey]: {
          summary: err.message || "AI summary is unavailable for this article right now.",
          collapsed: false
        }
      }));
    } finally {
      setLoadingSummary("");
    }
  }

  return (
    <section className="bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.08),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="mb-8 overflow-hidden rounded-[30px] border border-zinc-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(236,253,245,0.96)_55%,rgba(239,246,255,0.96))] p-6 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[24px] border border-white/80 bg-white/80 p-5 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Today</p>
              <h2 className="mt-3 text-3xl font-black text-zinc-950">{formatFullDate(now)}</h2>
              <p className="mt-3 text-lg font-semibold text-zinc-600">{formatTime(now)}</p>
            </div>
            <div className="rounded-[24px] border border-white/80 bg-white/80 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">Weather</p>
                  <h3 className="mt-3 text-2xl font-black text-zinc-950">{weather?.location || "Kathmandu, Nepal"}</h3>
                  <p className="mt-2 text-sm leading-7 text-zinc-600">
                    {weatherError
                      ? "Today's weather is temporarily unavailable."
                      : weather?.condition || "Loading today's weather..."}
                  </p>
                </div>
                <div className="rounded-[22px] bg-emerald-50 px-4 py-3 text-right">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Now</p>
                  <p className="mt-2 text-3xl font-black text-zinc-950">
                    {weather?.temperature !== null && weather?.temperature !== undefined
                      ? `${Math.round(weather.temperature)}${weather.unit || "°C"}`
                      : "--"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mb-8 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">News</p>
              <h1 className="mt-2 text-4xl font-black text-zinc-950">Industry pulse</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-600">
                Follow global startup coverage and Nepal-specific developments in one clean, unified news system.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {TYPES.map((type) => (
                <button
                  key={type.id}
                  className={`relative overflow-hidden rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeType === type.id
                      ? "bg-emerald-500 text-white shadow-[0_12px_30px_rgba(16,185,129,0.24)]"
                      : "border border-zinc-200 bg-white/90 text-zinc-700 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
                  type="button"
                  onClick={() => setActiveType(type.id)}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[26px] border border-zinc-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,253,250,0.96))] p-4 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Category</p>
                <div className="flex flex-wrap gap-3">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        activeCategory === category.id
                          ? "bg-zinc-950 text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)]"
                          : "border border-zinc-200 bg-white text-zinc-700 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:text-emerald-700"
                      }`}
                      type="button"
                      onClick={() => setActiveCategory(category.id)}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="mb-3 block text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Search</span>
                <div className="flex items-center gap-3 rounded-full border border-zinc-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-emerald-300 focus-within:shadow-[0_0_0_4px_rgba(16,185,129,0.08)]">
                  <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
                  </svg>
                  <input
                    className="w-full border-0 bg-transparent text-sm font-medium text-zinc-900 outline-none placeholder:text-zinc-400"
                    placeholder="Search by title, source, or description"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
              </label>
            </div>
          </div>
        </div>

        {loading ? <NewsSkeleton /> : null}

        {!loading && error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-900">{error}</div>
        ) : null}

        {!loading && !error && !filteredArticles.length ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-5 py-12 text-center text-zinc-500 shadow-sm">
            No news available.
          </div>
        ) : null}

        {!loading && !error && filteredArticles.length ? (
          <div className="grid gap-5 lg:grid-cols-3">
            {visibleArticles.map((article, index) => (
              (() => {
                const safeUrl = getSafeUrl(article.url);
                return (
              <article
                key={`${article.url}-${index}`}
                className="group flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition duration-200 hover:scale-[1.02]"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${
                      article.region === "nepal"
                        ? "bg-cyan-50 text-cyan-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {article.source || "News"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">{formatDate(article.publishedAt)}</span>
                    <AIButton loading={loadingSummary === article.url} onClick={() => handleGenerateSummary(article)} />
                  </div>
                </div>
                <h2 className="text-xl font-black leading-tight text-zinc-950">{article.title}</h2>
                <p className="mt-3 flex-1 text-sm leading-7 text-zinc-600">
                  {article.description || "Open the article to read the full story."}
                </p>
                {aiSummaries[article.url]?.summary && !aiSummaries[article.url]?.collapsed ? (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">AI Summary</p>
                    <div className="mt-2 whitespace-pre-line text-sm leading-7 text-zinc-700">
                      {aiSummaries[article.url].summary}
                    </div>
                  </div>
                ) : null}
                <div className="mt-6 flex items-center gap-3">
                  <a
                    className={`btn-primary flex-1 justify-center ${!safeUrl ? "pointer-events-none opacity-50" : ""}`}
                    href={safeUrl || undefined}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Read More
                  </a>
                  <ShareButton article={article} />
                </div>
              </article>
                );
              })()
            ))}
          </div>
        ) : null}

        {!loading && !error && filteredArticles.length > PAGE_SIZE ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-sm text-zinc-500">
              Page {currentPage} of {totalPages} | {filteredArticles.length} articles ready
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="btn-secondary"
                type="button"
                disabled={currentPage === 1}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  className={pageNumber === currentPage ? "btn-primary" : "btn-secondary"}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                className="btn-secondary"
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
