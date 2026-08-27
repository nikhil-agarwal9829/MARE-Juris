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

export async function GET() {
  const apiKey = process.env.NEWSDATA_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'NewsData API key is not configured on the server.' },
      { status: 500 }
    );
  }

  const endpoint = `https://newsdata.io/api/1/latest?apikey=${apiKey}&qInTitle=COURT&country=in&language=en&category=crime,business&image=1&video=1`;

  try {
    const res = await fetch(endpoint, {
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

    // Normalize article data
    const articles: NewsArticle[] = data.results.map((item: any, index: number) => ({
      id: item.article_id || `article-${index}-${Date.now()}`,
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
    }));

    return NextResponse.json({ articles });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error while retrieving legal news pulse.' },
      { status: 500 }
    );
  }
}
