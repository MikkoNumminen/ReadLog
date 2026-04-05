"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Format } from "@/generated/prisma/client";
import { searchBooks, BookSearchResult } from "@/lib/openlibrary";
import { searchGoogleBooks } from "@/lib/googlebooks";
import { fetchBookDetails, BookDetails } from "@/lib/bookdetails";

function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function deduplicateResults(results: BookSearchResult[]): BookSearchResult[] {
  const seen = new Map<string, BookSearchResult>();

  for (const book of results) {
    const key = normalize(book.title) + "|" + normalize(book.author ?? "");
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, book);
    } else {
      // Prefer the result with more data (cover, page count)
      const existingScore = (existing.coverUrl ? 1 : 0) + (existing.pageCount ? 1 : 0);
      const newScore = (book.coverUrl ? 1 : 0) + (book.pageCount ? 1 : 0);
      if (newScore > existingScore) {
        seen.set(key, book);
      }
    }
  }

  return Array.from(seen.values());
}

export async function searchBooksAction(query: string): Promise<BookSearchResult[]> {
  const [openLibraryResults, googleResults] = await Promise.allSettled([
    searchBooks(query),
    searchGoogleBooks(query),
  ]);

  const allResults: BookSearchResult[] = [
    ...(openLibraryResults.status === "fulfilled" ? openLibraryResults.value : []),
    ...(googleResults.status === "fulfilled" ? googleResults.value : []),
  ];

  return deduplicateResults(allResults);
}

export async function logBook(
  openLibraryId: string,
  title: string,
  author: string | null,
  coverUrl: string | null,
  pageCount: number | null,
  firstPublishYear: number | null,
  format: Format,
  finishedAt: string,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const book = await prisma.book.upsert({
    where: { openLibraryId },
    create: {
      openLibraryId,
      title,
      author,
      coverUrl,
      pageCount,
      firstPublishYear,
    },
    update: {},
  });

  await prisma.readEntry.create({
    data: {
      userId: session.user.id,
      bookId: book.id,
      format,
      finishedAt: new Date(finishedAt),
    },
  });

  return { success: true };
}

export async function getMyBooks() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.readEntry.findMany({
    where: { userId: session.user.id },
    include: { book: true },
    orderBy: { finishedAt: "desc" },
  });
}

export async function checkIfRead(query: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.readEntry.findMany({
    where: {
      userId: session.user.id,
      book: {
        title: { contains: query, mode: "insensitive" },
      },
    },
    include: { book: true },
  });
}

export async function updateReadEntry(
  entryId: string,
  data: { title?: string; format?: Format; finishedAt?: string },
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const entry = await prisma.readEntry.findUnique({
    where: { id: entryId },
  });
  if (!entry || entry.userId !== session.user.id) throw new Error("Not found");

  if (data.title) {
    await prisma.book.update({
      where: { id: entry.bookId },
      data: { title: data.title },
    });
  }

  if (data.format || data.finishedAt) {
    await prisma.readEntry.update({
      where: { id: entryId },
      data: {
        ...(data.format && { format: data.format }),
        ...(data.finishedAt && { finishedAt: new Date(data.finishedAt) }),
      },
    });
  }

  return { success: true };
}

export async function deleteReadEntry(entryId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const entry = await prisma.readEntry.findUnique({
    where: { id: entryId },
  });
  if (!entry || entry.userId !== session.user.id) throw new Error("Not found");

  await prisma.readEntry.delete({ where: { id: entryId } });

  return { success: true };
}

export async function getBookDetails(
  title: string,
  author: string | null,
): Promise<BookDetails | null> {
  return fetchBookDetails(title, author);
}

export async function getRecentPublicReads() {
  return prisma.readEntry.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    include: { book: true },
  });
}
