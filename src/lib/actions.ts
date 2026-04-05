"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Format } from "@/generated/prisma/client";
import { searchBooks, BookSearchResult } from "@/lib/openlibrary";

export async function searchBooksAction(query: string): Promise<BookSearchResult[]> {
  return searchBooks(query);
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

export async function getRecentPublicReads() {
  return prisma.readEntry.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    include: { book: true },
    // No user data exposed — anonymous feed
  });
}
