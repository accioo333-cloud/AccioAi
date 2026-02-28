import Parser from "rss-parser";
import { logInfo, logError } from "@/lib/logger";

interface FetchedArticle {
  title: string;
  content: string;
  url: string;
  published_at: string;
}

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "AccioAI/1.0",
  },
});

export async function fetchRSSFeed(
  feedUrl: string,
  sourceId: string
): Promise<FetchedArticle[]> {
  try {
    logInfo("Fetching RSS feed", { feedUrl, sourceId });

    const feed = await parser.parseURL(feedUrl);
    const articles: FetchedArticle[] = [];

    for (const item of feed.items.slice(0, 10)) {
      // Limit to 10 most recent
      if (!item.title || !item.link) continue;

      articles.push({
        title: item.title,
        content: item.contentSnippet || item.content || item.summary || "",
        url: item.link,
        published_at: item.pubDate || item.isoDate || new Date().toISOString(),
      });
    }

    logInfo("RSS feed fetched", { feedUrl, count: articles.length });
    return articles;
  } catch (error) {
    logError("RSS fetch failed", { feedUrl, error: String(error) });
    return [];
  }
}
