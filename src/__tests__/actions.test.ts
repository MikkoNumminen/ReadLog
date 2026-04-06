/**
 * @jest-environment node
 */

jest.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
  updateTag: jest.fn(),
  revalidateTag: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    book: { upsert: jest.fn(), update: jest.fn() },
    readEntry: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/openlibrary", () => ({
  searchBooks: jest.fn(),
}));

jest.mock("@/lib/googlebooks", () => ({
  searchGoogleBooks: jest.fn(),
}));

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { searchBooks } from "@/lib/openlibrary";
import { searchGoogleBooks } from "@/lib/googlebooks";
import {
  searchBooksAction,
  logBook,
  getMyBooks,
  checkIfRead,
  getRecentPublicReads,
  updateReadEntry,
  deleteReadEntry,
} from "@/lib/actions";

const mockAuth = auth as unknown as jest.MockedFunction<() => Promise<unknown>>;
const mockSearchBooks = searchBooks as jest.MockedFunction<typeof searchBooks>;
const mockSearchGoogle = searchGoogleBooks as jest.MockedFunction<typeof searchGoogleBooks>;
const mockBookUpsert = prisma.book.upsert as jest.Mock;
const mockBookUpdate = prisma.book.update as jest.Mock;
const mockEntryCreate = prisma.readEntry.create as jest.Mock;
const mockEntryFindMany = prisma.readEntry.findMany as jest.Mock;
const mockEntryFindUnique = prisma.readEntry.findUnique as jest.Mock;
const mockEntryUpdate = prisma.readEntry.update as jest.Mock;
const mockEntryDelete = prisma.readEntry.delete as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("searchBooksAction", () => {
  const bookA = {
    openLibraryId: "/works/OL1",
    title: "Columbus Day",
    subtitle: null,
    author: "Craig Alanson",
    firstPublishYear: 2016,
    pageCount: 350,
    coverUrl: "https://covers.openlibrary.org/b/id/1-M.jpg",
  };

  const bookB = {
    openLibraryId: "google:abc",
    title: "SpecOps",
    subtitle: "Book 2",
    author: "Craig Alanson",
    firstPublishYear: 2017,
    pageCount: 400,
    coverUrl: "https://books.google.com/thumb.jpg",
  };

  it("merges results from both sources", async () => {
    mockSearchBooks.mockResolvedValueOnce([bookA]);
    mockSearchGoogle.mockResolvedValueOnce([bookB]);

    const results = await searchBooksAction("craig alanson");
    expect(results).toHaveLength(2);
    expect(results).toContainEqual(bookA);
    expect(results).toContainEqual(bookB);
  });

  it("deduplicates by title+author, preferring better data", async () => {
    const withoutCover = { ...bookA, coverUrl: null, pageCount: null };
    const withCover = { ...bookA, openLibraryId: "google:dup" };

    mockSearchBooks.mockResolvedValueOnce([withoutCover]);
    mockSearchGoogle.mockResolvedValueOnce([withCover]);

    const results = await searchBooksAction("columbus day");
    expect(results).toHaveLength(1);
    expect(results[0].coverUrl).toBe(bookA.coverUrl);
  });

  it("keeps existing when new has same or worse data", async () => {
    const good = { ...bookA };
    const same = { ...bookA, openLibraryId: "google:dup" };

    mockSearchBooks.mockResolvedValueOnce([good]);
    mockSearchGoogle.mockResolvedValueOnce([same]);

    const results = await searchBooksAction("columbus");
    expect(results).toHaveLength(1);
    expect(results[0].openLibraryId).toBe(bookA.openLibraryId);
  });

  it("handles Open Library failure gracefully", async () => {
    mockSearchBooks.mockRejectedValueOnce(new Error("503"));
    mockSearchGoogle.mockResolvedValueOnce([bookB]);

    const results = await searchBooksAction("test");
    expect(results).toEqual([bookB]);
  });

  it("handles Google Books failure gracefully", async () => {
    mockSearchBooks.mockResolvedValueOnce([bookA]);
    mockSearchGoogle.mockRejectedValueOnce(new Error("500"));

    const results = await searchBooksAction("test");
    expect(results).toEqual([bookA]);
  });

  it("handles both sources failing", async () => {
    mockSearchBooks.mockRejectedValueOnce(new Error("503"));
    mockSearchGoogle.mockRejectedValueOnce(new Error("500"));

    const results = await searchBooksAction("test");
    expect(results).toEqual([]);
  });
});

describe("logBook", () => {
  it("creates book and read entry for authenticated user", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user1", name: "Test", email: "test@test.com" },
      expires: "",
    });
    mockBookUpsert.mockResolvedValueOnce({ id: "book1" });
    mockEntryCreate.mockResolvedValueOnce({});

    const result = await logBook(
      "/works/OL1",
      "Columbus Day",
      "Craig Alanson",
      "https://cover.jpg",
      350,
      2016,
      "AUDIOBOOK",
      "2024-01-15",
    );

    expect(result).toEqual({ success: true });
    expect(mockBookUpsert).toHaveBeenCalledWith({
      where: { openLibraryId: "/works/OL1" },
      create: {
        openLibraryId: "/works/OL1",
        title: "Columbus Day",
        author: "Craig Alanson",
        coverUrl: "https://cover.jpg",
        pageCount: 350,
        firstPublishYear: 2016,
      },
      update: {},
    });
    expect(mockEntryCreate).toHaveBeenCalledWith({
      data: {
        userId: "user1",
        bookId: "book1",
        format: "AUDIOBOOK",
        finishedAt: new Date("2024-01-15"),
      },
    });
  });

  it("throws when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    await expect(
      logBook("/works/OL1", "Test", null, null, null, null, "BOOK", "2024-01-01"),
    ).rejects.toThrow("Not authenticated");
  });

  it("throws when session has no user id", async () => {
    mockAuth.mockResolvedValueOnce({ user: {}, expires: "" });
    await expect(
      logBook("/works/OL1", "Test", null, null, null, null, "BOOK", "2024-01-01"),
    ).rejects.toThrow("Not authenticated");
  });
});

describe("getMyBooks", () => {
  it("returns read entries for authenticated user", async () => {
    const entries = [{ id: "e1", book: { title: "Test" } }];
    mockAuth.mockResolvedValueOnce({
      user: { id: "user1", name: "Test", email: "t@t.com" },
      expires: "",
    });
    mockEntryFindMany.mockResolvedValueOnce(entries);

    const result = await getMyBooks();
    expect(result).toEqual(entries);
    expect(mockEntryFindMany).toHaveBeenCalledWith({
      where: { userId: "user1" },
      include: { book: true },
      orderBy: { finishedAt: "desc" },
    });
  });

  it("returns null when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    expect(await getMyBooks()).toBeNull();
  });
});

describe("checkIfRead", () => {
  it("searches user library by title", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user1", name: "Test", email: "t@t.com" },
      expires: "",
    });
    mockEntryFindMany.mockResolvedValueOnce([]);

    await checkIfRead("harry potter");
    expect(mockEntryFindMany).toHaveBeenCalledWith({
      where: {
        userId: "user1",
        book: { title: { contains: "harry potter", mode: "insensitive" } },
      },
      include: { book: true },
    });
  });

  it("returns empty array when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    expect(await checkIfRead("test")).toEqual([]);
  });
});

describe("updateReadEntry", () => {
  const authedSession = {
    user: { id: "user1", name: "Test", email: "t@t.com" },
    expires: "",
  };

  it("updates title only", async () => {
    mockAuth.mockResolvedValueOnce(authedSession);
    mockEntryFindUnique.mockResolvedValueOnce({ id: "e1", userId: "user1", bookId: "b1" });
    mockBookUpdate.mockResolvedValueOnce({});

    const result = await updateReadEntry("e1", { title: "New Title" });
    expect(result).toEqual({ success: true });
    expect(mockBookUpdate).toHaveBeenCalledWith({
      where: { id: "b1" },
      data: { title: "New Title" },
    });
    expect(mockEntryUpdate).not.toHaveBeenCalled();
  });

  it("updates format and finishedAt", async () => {
    mockAuth.mockResolvedValueOnce(authedSession);
    mockEntryFindUnique.mockResolvedValueOnce({ id: "e1", userId: "user1", bookId: "b1" });
    mockEntryUpdate.mockResolvedValueOnce({});

    await updateReadEntry("e1", { format: "AUDIOBOOK", finishedAt: "2024-06-01" });
    expect(mockEntryUpdate).toHaveBeenCalledWith({
      where: { id: "e1" },
      data: { format: "AUDIOBOOK", finishedAt: new Date("2024-06-01") },
    });
  });

  it("updates format only without finishedAt", async () => {
    mockAuth.mockResolvedValueOnce(authedSession);
    mockEntryFindUnique.mockResolvedValueOnce({ id: "e1", userId: "user1", bookId: "b1" });
    mockEntryUpdate.mockResolvedValueOnce({});

    await updateReadEntry("e1", { format: "EBOOK" });
    expect(mockEntryUpdate).toHaveBeenCalledWith({
      where: { id: "e1" },
      data: { format: "EBOOK" },
    });
  });

  it("throws when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    await expect(updateReadEntry("e1", { title: "X" })).rejects.toThrow("Not authenticated");
  });

  it("throws when entry not found", async () => {
    mockAuth.mockResolvedValueOnce(authedSession);
    mockEntryFindUnique.mockResolvedValueOnce(null);
    await expect(updateReadEntry("e1", { title: "X" })).rejects.toThrow("Not found");
  });

  it("throws when entry belongs to another user", async () => {
    mockAuth.mockResolvedValueOnce(authedSession);
    mockEntryFindUnique.mockResolvedValueOnce({ id: "e1", userId: "other", bookId: "b1" });
    await expect(updateReadEntry("e1", { title: "X" })).rejects.toThrow("Not found");
  });
});

describe("deleteReadEntry", () => {
  const authedSession = {
    user: { id: "user1", name: "Test", email: "t@t.com" },
    expires: "",
  };

  it("deletes entry owned by authenticated user", async () => {
    mockAuth.mockResolvedValueOnce(authedSession);
    mockEntryFindUnique.mockResolvedValueOnce({ id: "e1", userId: "user1", bookId: "b1" });
    mockEntryDelete.mockResolvedValueOnce({});

    const result = await deleteReadEntry("e1");
    expect(result).toEqual({ success: true });
    expect(mockEntryDelete).toHaveBeenCalledWith({ where: { id: "e1" } });
  });

  it("throws when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    await expect(deleteReadEntry("e1")).rejects.toThrow("Not authenticated");
  });

  it("throws when entry not found", async () => {
    mockAuth.mockResolvedValueOnce(authedSession);
    mockEntryFindUnique.mockResolvedValueOnce(null);
    await expect(deleteReadEntry("e1")).rejects.toThrow("Not found");
  });

  it("throws when entry belongs to another user", async () => {
    mockAuth.mockResolvedValueOnce(authedSession);
    mockEntryFindUnique.mockResolvedValueOnce({ id: "e1", userId: "other", bookId: "b1" });
    await expect(deleteReadEntry("e1")).rejects.toThrow("Not found");
  });
});

describe("getRecentPublicReads", () => {
  it("returns recent entries without user data", async () => {
    const entries = [{ id: "e1", book: { title: "Public Book" } }];
    mockEntryFindMany.mockResolvedValueOnce(entries);

    const result = await getRecentPublicReads();
    expect(result).toEqual(entries);
    expect(mockEntryFindMany).toHaveBeenCalledWith({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: { book: true },
    });
  });
});
