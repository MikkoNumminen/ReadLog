/**
 * @jest-environment node
 */

import { searchGoogleBooks } from "@/lib/googlebooks";

const mockFetch = jest.fn();
global.fetch = mockFetch;

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  mockFetch.mockReset();
  process.env = { ...ORIGINAL_ENV, GOOGLE_BOOKS_API_KEY: "test-key" };
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe("searchGoogleBooks", () => {
  it("returns empty array when no API key", async () => {
    delete process.env.GOOGLE_BOOKS_API_KEY;
    expect(await searchGoogleBooks("test")).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns empty array for empty query", async () => {
    expect(await searchGoogleBooks("")).toEqual([]);
    expect(await searchGoogleBooks("   ")).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("fetches from Google Books and maps results", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            id: "abc123",
            volumeInfo: {
              title: "Columbus Day",
              subtitle: "Expeditionary Force Book 1",
              authors: ["Craig Alanson"],
              publishedDate: "2016-01-01",
              pageCount: 350,
              imageLinks: {
                thumbnail: "http://books.google.com/thumb.jpg",
              },
            },
          },
        ],
      }),
    });

    const results = await searchGoogleBooks("columbus day");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("googleapis.com/books/v1/volumes"),
    );
    expect(results).toEqual([
      {
        openLibraryId: "google:abc123",
        title: "Columbus Day",
        subtitle: "Expeditionary Force Book 1",
        author: "Craig Alanson",
        firstPublishYear: 2016,
        pageCount: 350,
        coverUrl: "https://books.google.com/thumb.jpg",
      },
    ]);
  });

  it("builds series label from seriesInfo", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            id: "xyz789",
            volumeInfo: {
              title: "SpecOps",
              authors: ["Craig Alanson"],
              seriesInfo: { bookDisplayNumber: "2" },
            },
          },
        ],
      }),
    });

    const results = await searchGoogleBooks("specops");
    expect(results[0].subtitle).toBe("Book 2");
  });

  it("combines seriesInfo with existing subtitle", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            id: "xyz789",
            volumeInfo: {
              title: "SpecOps",
              subtitle: "Expeditionary Force",
              authors: ["Craig Alanson"],
              seriesInfo: { bookDisplayNumber: "2" },
            },
          },
        ],
      }),
    });

    const results = await searchGoogleBooks("specops");
    expect(results[0].subtitle).toBe("Book 2 — Expeditionary Force");
  });

  it("handles missing optional fields", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            id: "min1",
            volumeInfo: {
              title: "Bare Minimum",
            },
          },
        ],
      }),
    });

    const results = await searchGoogleBooks("bare");
    expect(results[0]).toEqual({
      openLibraryId: "google:min1",
      title: "Bare Minimum",
      subtitle: null,
      author: null,
      firstPublishYear: null,
      pageCount: null,
      coverUrl: null,
    });
  });

  it("handles invalid publishedDate", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            id: "bad1",
            volumeInfo: {
              title: "Bad Date",
              publishedDate: "unknown",
            },
          },
        ],
      }),
    });

    const results = await searchGoogleBooks("bad");
    expect(results[0].firstPublishYear).toBeNull();
  });

  it("returns empty array on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    expect(await searchGoogleBooks("test")).toEqual([]);
  });

  it("handles empty items array", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    });
    expect(await searchGoogleBooks("nothing")).toEqual([]);
  });

  it("handles missing items field", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    expect(await searchGoogleBooks("nothing")).toEqual([]);
  });
});
