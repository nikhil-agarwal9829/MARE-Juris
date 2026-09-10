import { NextResponse } from 'next/server';

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  link: string;
  imageUrl: string | null;
  sourceName: string;
  publishedAt: string;
  categories: string[];
  videoUrl: string | null;
}

const MAX_NEWS_ARTICLES = 15;

export async function GET() {
  const apiKey = process.env.NEWSDATA_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'NewsData API key is not configured on the server.' },
      { status: 500 }
    );
  }

  try {
    // 1. Initial fetch attempting requested criteria
    const initialEndpoint = `https://newsdata.io/api/1/latest?apikey=${apiKey}&qInTitle=COURT&country=in&language=en&category=crime,business&image=1`;

    const res = await fetch(initialEndpoint, {
      next: { revalidate: 900 }, // Cache for 15 minutes
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch legal news from upstream provider.' },
        { status: res.status }
      );
    }

    const data = await res.json();

    if (data.status !== 'success' || !Array.isArray(data.results)) {
      return NextResponse.json(
        { error: 'Invalid response format from news provider.' },
        { status: 502 }
      );
    }

    let rawArticles = [...data.results];
    const nextPageToken = data.nextPage;

    // 2. Fetch page 2 if results are under target limit and nextPage exists
    if (rawArticles.length < MAX_NEWS_ARTICLES && nextPageToken) {
      try {
        const page2Endpoint = `${initialEndpoint}&page=${nextPageToken}`;
        const page2Res = await fetch(page2Endpoint, { next: { revalidate: 900 } });
        if (page2Res.ok) {
          const page2Data = await page2Res.json();
          if (page2Data.status === 'success' && Array.isArray(page2Data.results)) {
            rawArticles = [...rawArticles, ...page2Data.results];
          }
        }
      } catch {
        // Fall back gracefully with page 1 results if page 2 fetch fails
      }
    }

    // 3. Deduplicate and normalize
    const seenIds = new Set<string>();
    const articles: NewsArticle[] = [];

    for (let i = 0; i < rawArticles.length; i++) {
      if (articles.length >= MAX_NEWS_ARTICLES) break;

      const item = rawArticles[i];
      const articleId = item.article_id || `article-${i}-${Date.now()}`;

      if (seenIds.has(articleId)) continue;
      seenIds.add(articleId);

      articles.push({
        id: articleId,
        title: item.title || 'Untitled Legal Update',
        description:
          item.description ||
          item.content ||
          'Recent legal and court proceedings update relevant to Indian law and business compliance.',
        link: item.link || '#',
        imageUrl: item.image_url || null,
        sourceName: item.source_id ? item.source_id.toUpperCase() : 'Legal Media',
        publishedAt: item.pubDate || new Date().toISOString(),
        categories: Array.isArray(item.category) ? item.category : ['legal'],
        videoUrl: item.video_url || null,
      });
    }

    return NextResponse.json({ articles, total: articles.length });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error while retrieving legal news pulse.' },
      { status: 500 }
    );
  }
}
