/**
 * @jest-environment node
 */

import { searchBooks } from "@/lib/openlibrary";

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe("searchBooks", () => {
  it("returns empty array for empty query", async () => {
    expect(await searchBooks("")).toEqual([]);
    expect(await searchBooks("   ")).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("fetches from Open Library and maps results", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        docs: [
          {
            key: "/works/OL1234W",
            title: "Columbus Day",
            subtitle: "Expeditionary Force Book 1",
            author_name: ["Craig Alanson"],
            first_publish_year: 2016,
            number_of_pages_median: 350,
            cover_i: 12345,
          },
        ],
      }),
    });

    const results = await searchBooks("columbus day");

    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("openlibrary.org/search.json"));
    expect(results).toEqual([
      {
        openLibraryId: "/works/OL1234W",
        title: "Columbus Day",
        subtitle: "Expeditionary Force Book 1",
        author: "Craig Alanson",
        firstPublishYear: 2016,
        pageCount: 350,
        coverUrl: "https://covers.openlibrary.org/b/id/12345-M.jpg",
      },
    ]);
  });

  it("handles missing optional fields", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        docs: [
          {
            key: "/works/OL999W",
            title: "Unknown Book",
          },
        ],
      }),
    });

    const results = await searchBooks("unknown");
    expect(results[0]).toEqual({
      openLibraryId: "/works/OL999W",
      title: "Unknown Book",
      subtitle: null,
      author: null,
      firstPublishYear: null,
      pageCount: null,
      coverUrl: null,
    });
  });

  it("handles empty docs array", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ docs: [] }),
    });

    expect(await searchBooks("nothing")).toEqual([]);
  });

  it("handles missing docs field", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    expect(await searchBooks("nothing")).toEqual([]);
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });

    await expect(searchBooks("test")).rejects.toThrow("Open Library API error");
  });
});
