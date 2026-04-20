import { fetchGlobalNews, fetchNepalNews } from "../services/newsService.js";

export async function getHybridNews(req, res) {
  try {
    const { type, category } = req.query;

    let news = [];

    if (type === "nepal") {
      news = await fetchNepalNews();
    } else if (type === "global") {
      news = await fetchGlobalNews(category);
    } else {
      const [global, nepal] = await Promise.all([fetchGlobalNews(category), fetchNepalNews()]);
      news = [...global, ...nepal];
    }

    res.json(news);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: "Failed to fetch news"
    });
  }
}
