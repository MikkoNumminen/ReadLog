import { BookSearchResult } from "@/lib/openlibrary";

interface GoogleBooksVolume {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    publishedDate?: string;
    pageCount?: number;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    industryIdentifiers?: { type: string; identifier: string }[];
  };
}

export async function searchGoogleBooks(query: string): Promise<BookSearchResult[]> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (!apiKey || !query.trim()) return [];

  const params = new URLSearchParams({
    q: query,
    maxResults: "10",
    key: apiKey,
  });

  const res = await fetch(`https://www.googleapis.com/books/v1/volumes?${params}`);
  if (!res.ok) return [];

  const data = await res.json();
  const items: GoogleBooksVolume[] = data.items ?? [];

  return items.map((item) => ({
    openLibraryId: `google:${item.id}`,
    title: item.volumeInfo.title,
    author: item.volumeInfo.authors?.[0] ?? null,
    firstPublishYear: item.volumeInfo.publishedDate
      ? parseInt(item.volumeInfo.publishedDate.slice(0, 4), 10) || null
      : null,
    pageCount: item.volumeInfo.pageCount ?? null,
    coverUrl: item.volumeInfo.imageLinks?.thumbnail?.replace("http:", "https:") ?? null,
  }));
}
