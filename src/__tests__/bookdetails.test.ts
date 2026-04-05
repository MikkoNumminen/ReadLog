/**
 * @jest-environment node
 */

import { fetchBookDetails } from "@/lib/bookdetails";

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

describe("fetchBookDetails", () => {
  const fullVolume = {
    items: [
      {
        volumeInfo: {
          title: "Convergence",
          authors: ["Craig Alanson"],
          description: "A wizard and a talking dog",
          categories: ["Fiction"],
          publisher: "Podium Audio",
          publishedDate: "2022",
          pageCount: 400,
          imageLinks: { thumbnail: "http://books.google.com/cover.jpg" },
          language: "en",
          previewLink: "https://preview.link",
          infoLink: "https://info.link",
        },
      },
    ],
  };

  it("returns null when no API key", async () => {
    delete process.env.GOOGLE_BOOKS_API_KEY;
    expect(await fetchBookDetails("Test", null)).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("fetches and maps full details", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fullVolume,
    });

    const result = await fetchBookDetails("Convergence", "Craig Alanson");
    expect(result).toEqual({
      title: "Convergence",
      authors: ["Craig Alanson"],
      description: "A wizard and a talking dog",
      categories: ["Fiction"],
      publisher: "Podium Audio",
      publishedDate: "2022",
      pageCount: 400,
      coverUrl: "https://books.google.com/cover.jpg",
      language: "en",
      previewLink: "https://preview.link",
      infoLink: "https://info.link",
    });
  });

  it("searches with title only when no author", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fullVolume,
    });

    await fetchBookDetails("Convergence", null);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("q=Convergence&"));
  });

  it("returns null on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    expect(await fetchBookDetails("Test", null)).toBeNull();
  });

  it("returns null when no items", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    });
    expect(await fetchBookDetails("Test", null)).toBeNull();
  });

  it("returns null when items is undefined", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    expect(await fetchBookDetails("Test", null)).toBeNull();
  });

  it("handles missing optional fields", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            volumeInfo: {
              title: "Bare",
            },
          },
        ],
      }),
    });

    const result = await fetchBookDetails("Bare", "Author");
    expect(result).toEqual({
      title: "Bare",
      authors: ["Author"],
      description: null,
      categories: [],
      publisher: null,
      publishedDate: null,
      pageCount: null,
      coverUrl: null,
      language: null,
      previewLink: null,
      infoLink: null,
    });
  });

  it("uses fallback title and empty authors when both missing", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [{ volumeInfo: {} }],
      }),
    });

    const result = await fetchBookDetails("Fallback", null);
    expect(result!.title).toBe("Fallback");
    expect(result!.authors).toEqual([]);
  });
});
