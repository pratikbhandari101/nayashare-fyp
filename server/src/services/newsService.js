const QUERY_MAP = {
  tech: "technology startup",
  finance: "fintech investment",
  agriculture: "agriculture innovation",
  business: "startup funding"
};
const NEWS_LIMIT = 4;
const CACHE_TTL_MS = 5 * 60 * 1000;
const newsCache = new Map();

function getCached(key) {
  const cached = newsCache.get(key);

  if (!cached) {
    return null;
  }

  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    newsCache.delete(key);
    return null;
  }

  return cached.data;
}

function setCached(key, data) {
  newsCache.set(key, {
    timestamp: Date.now(),
    data
  });
}

function normalizeGlobalArticle(article) {
  return {
    title: article.title || "Untitled",
    description: article.description || "",
    url: article.url || "",
    image: article.image || "",
    source: article.source?.name || "GNews",
    publishedAt: article.publishedAt || "",
    region: "global"
  };
}

function normalizeNepalArticle(article) {
  return {
    title: article.title || "Untitled",
    description: article.summary || article.description || "",
    url: article.source_url || article.link || "",
    image: article.image_url || null,
    source: article.source || "Nepal News",
    publishedAt: article.published_date || "",
    region: "nepal"
  };
}

export async function fetchGlobalNews(category) {
  const cacheKey = `global:${category || "startup"}`;
  const cached = getCached(cacheKey);

  if (cached) {
    return cached;
  }

  if (!process.env.GNEWS_API_KEY) {
    const error = new Error("GNEWS_API_KEY is not configured");
    error.statusCode = 500;
    throw error;
  }

  const query = QUERY_MAP[category] || "startup";
  const url = new URL("https://gnews.io/api/v4/search");
  url.searchParams.set("q", query);
  url.searchParams.set("lang", "en");
  url.searchParams.set("max", String(NEWS_LIMIT));
  url.searchParams.set("token", process.env.GNEWS_API_KEY);

  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.errors?.[0] || data.message || "Failed to fetch global news");
    error.statusCode = response.status;
    throw error;
  }

  const articles = Array.isArray(data.articles) ? data.articles.map(normalizeGlobalArticle).slice(0, NEWS_LIMIT) : [];
  setCached(cacheKey, articles);
  return articles;
}

export async function fetchNepalNews() {
  const cacheKey = "nepal";
  const cached = getCached(cacheKey);

  if (cached) {
    return cached;
  }

  const response = await fetch(
    "https://raw.githubusercontent.com/gaurovgiri/newsapi/refs/heads/master/data/today.json"
  );
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error("Failed to fetch Nepal news");
    error.statusCode = response.status;
    throw error;
  }

  const articles = Array.isArray(data.articles) ? data.articles.map(normalizeNepalArticle).slice(0, NEWS_LIMIT) : [];
  setCached(cacheKey, articles);
  return articles;
}
