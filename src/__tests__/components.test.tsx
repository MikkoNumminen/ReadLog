/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";

jest.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock("next/link", () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

jest.mock("@/lib/actions", () => ({
  searchBooksAction: jest.fn(),
  checkIfRead: jest.fn(),
  updateReadEntry: jest.fn(),
}));

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { useSession, signIn, signOut } from "next-auth/react";
import { searchBooksAction, checkIfRead, updateReadEntry } from "@/lib/actions";
import NavBar from "@/components/NavBar";
import Providers from "@/components/Providers";
import BookSearch from "@/components/BookSearch";
import LibrarySearch from "@/components/LibrarySearch";
import LibraryView from "@/components/LibraryView";

const mockUseSession = useSession as jest.Mock;
const mockSearchBooks = searchBooksAction as jest.Mock;
const mockCheckIfRead = checkIfRead as jest.Mock;
const mockUpdateReadEntry = updateReadEntry as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Providers", () => {
  it("renders children", () => {
    render(
      <Providers>
        <span>child</span>
      </Providers>,
    );
    expect(screen.getByText("child")).toBeTruthy();
  });
});

describe("NavBar", () => {
  it("shows sign in button when not authenticated", () => {
    mockUseSession.mockReturnValue({ data: null });
    render(<NavBar />);
    expect(screen.getByText("Sign in")).toBeTruthy();
  });

  it("shows nav links and sign out when authenticated", () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: "Test" } },
    });
    render(<NavBar />);
    expect(screen.getByText("Log a book")).toBeTruthy();
    expect(screen.getByText("My Library")).toBeTruthy();
    expect(screen.getByText("Sign out")).toBeTruthy();
  });

  it("calls signIn when sign in button clicked", () => {
    mockUseSession.mockReturnValue({ data: null });
    render(<NavBar />);
    fireEvent.click(screen.getByText("Sign in"));
    expect(signIn).toHaveBeenCalledWith("google");
  });

  it("calls signOut when sign out button clicked", () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: "Test" } },
    });
    render(<NavBar />);
    fireEvent.click(screen.getByText("Sign out"));
    expect(signOut).toHaveBeenCalled();
  });
});

describe("BookSearch", () => {
  const mockBook = {
    openLibraryId: "OL1",
    title: "Test Book",
    subtitle: "A Subtitle",
    author: "Author",
    firstPublishYear: 2020,
    pageCount: 200,
    coverUrl: "https://cover.jpg",
  };

  const mockBookNoCover = {
    ...mockBook,
    openLibraryId: "OL2",
    title: "No Cover Book",
    subtitle: null,
    coverUrl: null,
    author: null,
    firstPublishYear: null,
  };

  it("does not search with empty fields", async () => {
    const onSelect = jest.fn();
    render(<BookSearch onSelect={onSelect} />);
    fireEvent.keyDown(screen.getByLabelText("Book title"), { key: "Enter" });
    expect(mockSearchBooks).not.toHaveBeenCalled();
  });

  it("searches on Enter and displays results with subtitle", async () => {
    mockSearchBooks.mockResolvedValueOnce([mockBook]);
    const onSelect = jest.fn();
    render(<BookSearch onSelect={onSelect} />);

    fireEvent.change(screen.getByLabelText("Book title"), { target: { value: "test" } });
    await act(async () => {
      fireEvent.keyDown(screen.getByLabelText("Book title"), { key: "Enter" });
    });

    expect(screen.getByText("Test Book — A Subtitle")).toBeTruthy();
    expect(screen.getByText("Author · 2020")).toBeTruthy();
  });

  it("displays title without subtitle when subtitle is null", async () => {
    mockSearchBooks.mockResolvedValueOnce([mockBookNoCover]);
    const onSelect = jest.fn();
    render(<BookSearch onSelect={onSelect} />);

    fireEvent.change(screen.getByLabelText("Book title"), { target: { value: "test" } });
    await act(async () => {
      fireEvent.keyDown(screen.getByLabelText("Book title"), { key: "Enter" });
    });

    expect(screen.getByText("No Cover Book")).toBeTruthy();
  });

  it("calls onSelect when a book is clicked", async () => {
    mockSearchBooks.mockResolvedValueOnce([mockBook]);
    const onSelect = jest.fn();
    render(<BookSearch onSelect={onSelect} />);

    fireEvent.change(screen.getByLabelText("Book title"), { target: { value: "test" } });
    await act(async () => {
      fireEvent.keyDown(screen.getByLabelText("Book title"), { key: "Enter" });
    });

    fireEvent.click(screen.getByText("Test Book — A Subtitle"));
    expect(onSelect).toHaveBeenCalledWith(mockBook);
  });

  it("shows no books found message", async () => {
    mockSearchBooks.mockResolvedValueOnce([]);
    const onSelect = jest.fn();
    render(<BookSearch onSelect={onSelect} />);

    fireEvent.change(screen.getByLabelText("Book title"), { target: { value: "xyz" } });
    await act(async () => {
      fireEvent.keyDown(screen.getByLabelText("Book title"), { key: "Enter" });
    });

    expect(screen.getByText("No books found.")).toBeTruthy();
  });

  it("searches with author field", async () => {
    mockSearchBooks.mockResolvedValueOnce([mockBook]);
    const onSelect = jest.fn();
    render(<BookSearch onSelect={onSelect} />);

    fireEvent.change(screen.getByLabelText("Book title"), { target: { value: "test" } });
    fireEvent.change(screen.getByLabelText("Author (optional)"), { target: { value: "author" } });
    await act(async () => {
      fireEvent.keyDown(screen.getByLabelText("Author (optional)"), { key: "Enter" });
    });

    expect(mockSearchBooks).toHaveBeenCalledWith("test author");
  });

  it("shows 'Show more' button when more than 10 results", async () => {
    const manyBooks = Array.from({ length: 12 }, (_, i) => ({
      ...mockBook,
      openLibraryId: `OL${i}`,
      title: `Book ${i}`,
      subtitle: null,
    }));
    mockSearchBooks.mockResolvedValueOnce(manyBooks);
    const onSelect = jest.fn();
    render(<BookSearch onSelect={onSelect} />);

    fireEvent.change(screen.getByLabelText("Book title"), { target: { value: "test" } });
    await act(async () => {
      fireEvent.keyDown(screen.getByLabelText("Book title"), { key: "Enter" });
    });

    expect(screen.getByText("Show 2 more results")).toBeTruthy();
    expect(screen.queryByText("Book 11")).toBeNull();

    fireEvent.click(screen.getByText("Show 2 more results"));
    expect(screen.getByText("Book 11")).toBeTruthy();
  });

  it("ignores non-Enter keystrokes", async () => {
    const onSelect = jest.fn();
    render(<BookSearch onSelect={onSelect} />);
    fireEvent.change(screen.getByLabelText("Book title"), { target: { value: "test" } });
    fireEvent.keyDown(screen.getByLabelText("Book title"), { key: "a" });
    expect(mockSearchBooks).not.toHaveBeenCalled();
  });
});

describe("LibrarySearch", () => {
  it("clears results on empty search", async () => {
    render(<LibrarySearch />);

    await act(async () => {
      fireEvent.keyDown(screen.getByLabelText("Have I read this?"), { key: "Enter" });
    });

    expect(mockCheckIfRead).not.toHaveBeenCalled();
  });

  it("searches and shows not found message", async () => {
    mockCheckIfRead.mockResolvedValueOnce([]);
    render(<LibrarySearch />);

    fireEvent.change(screen.getByLabelText("Have I read this?"), { target: { value: "test" } });
    await act(async () => {
      fireEvent.keyDown(screen.getByLabelText("Have I read this?"), { key: "Enter" });
    });

    expect(screen.getByText("Not in your library.")).toBeTruthy();
  });

  it("shows found results with singular match text", async () => {
    mockCheckIfRead.mockResolvedValueOnce([
      {
        id: "e1",
        format: "BOOK",
        finishedAt: new Date("2024-01-15"),
        book: { title: "Found Book", author: "Author", coverUrl: "https://cover.jpg" },
      },
    ]);
    render(<LibrarySearch />);

    fireEvent.change(screen.getByLabelText("Have I read this?"), { target: { value: "found" } });
    await act(async () => {
      fireEvent.keyDown(screen.getByLabelText("Have I read this?"), { key: "Enter" });
    });

    expect(screen.getByText("Yes! Found 1 match:")).toBeTruthy();
    expect(screen.getByText("Found Book")).toBeTruthy();
  });

  it("shows plural matches text for multiple results", async () => {
    mockCheckIfRead.mockResolvedValueOnce([
      {
        id: "e1",
        format: "AUDIOBOOK",
        finishedAt: new Date("2024-01-15"),
        book: { title: "Book 1", author: null, coverUrl: null },
      },
      {
        id: "e2",
        format: "EBOOK",
        finishedAt: new Date("2024-02-15"),
        book: { title: "Book 2", author: null, coverUrl: null },
      },
    ]);
    render(<LibrarySearch />);

    fireEvent.change(screen.getByLabelText("Have I read this?"), { target: { value: "book" } });
    await act(async () => {
      fireEvent.keyDown(screen.getByLabelText("Have I read this?"), { key: "Enter" });
    });

    expect(screen.getByText("Yes! Found 2 matches:")).toBeTruthy();
  });

  it("ignores non-Enter keystrokes", async () => {
    render(<LibrarySearch />);
    fireEvent.change(screen.getByLabelText("Have I read this?"), { target: { value: "test" } });
    fireEvent.keyDown(screen.getByLabelText("Have I read this?"), { key: "a" });
    expect(mockCheckIfRead).not.toHaveBeenCalled();
  });
});

describe("LibraryView", () => {
  const entriesWithCover = [
    {
      id: "e1",
      format: "BOOK" as const,
      finishedAt: new Date("2024-01-15"),
      book: { title: "Cover Book", author: "Author 1", coverUrl: "https://cover.jpg" },
    },
  ];

  const entriesNoCover = [
    {
      id: "e2",
      format: "AUDIOBOOK" as const,
      finishedAt: new Date("2024-02-15"),
      book: { title: "No Cover", author: null, coverUrl: null },
    },
  ];

  it("renders grid view by default with cover", () => {
    render(<LibraryView entries={entriesWithCover} />);
    expect(screen.getByText("Cover Book")).toBeTruthy();
    expect(screen.getByText("Author 1")).toBeTruthy();
  });

  it("renders grid view with no cover placeholder", () => {
    render(<LibraryView entries={entriesNoCover} />);
    expect(screen.getByText("No Cover")).toBeTruthy();
  });

  it("renders grid view without author when null", () => {
    render(<LibraryView entries={entriesNoCover} />);
    expect(screen.queryByText("Author")).toBeNull();
  });

  it("switches to list view", () => {
    render(<LibraryView entries={entriesWithCover} />);
    fireEvent.click(screen.getByLabelText("List view"));
    expect(screen.getByText("Cover Book")).toBeTruthy();
    expect(screen.getByText("book")).toBeTruthy();
  });

  it("renders list view with no cover", () => {
    render(<LibraryView entries={entriesNoCover} />);
    fireEvent.click(screen.getByLabelText("List view"));
    expect(screen.getByText("No Cover")).toBeTruthy();
  });

  it("renders list view without author when null", () => {
    render(<LibraryView entries={entriesNoCover} />);
    fireEvent.click(screen.getByLabelText("List view"));
    expect(screen.queryByText("Author")).toBeNull();
  });

  it("switches back to grid view", () => {
    render(<LibraryView entries={entriesWithCover} />);
    fireEvent.click(screen.getByLabelText("List view"));
    fireEvent.click(screen.getByLabelText("Grid view"));
    expect(screen.getByText("Cover Book")).toBeTruthy();
  });

  it("opens edit dialog when clicking grid item", async () => {
    render(<LibraryView entries={entriesWithCover} />);
    fireEvent.click(screen.getByText("Cover Book"));
    expect(screen.getByText("Edit entry")).toBeTruthy();
  });

  it("opens edit dialog from list view edit button", () => {
    render(<LibraryView entries={entriesWithCover} />);
    fireEvent.click(screen.getByLabelText("List view"));
    const editButtons = screen.getAllByTestId("EditIcon");
    fireEvent.click(editButtons[0].closest("button")!);
    expect(screen.getByText("Edit entry")).toBeTruthy();
  });

  it("closes edit dialog on cancel", () => {
    render(<LibraryView entries={entriesWithCover} />);
    fireEvent.click(screen.getByText("Cover Book"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText("Edit entry")).toBeNull();
  });

  it("save button disabled when no changes", () => {
    render(<LibraryView entries={entriesWithCover} />);
    fireEvent.click(screen.getByText("Cover Book"));
    const saveBtn = screen.getByText("Save").closest("button")!;
    expect(saveBtn.hasAttribute("disabled")).toBe(true);
  });

  it("saves changes when title modified", async () => {
    mockUpdateReadEntry.mockResolvedValueOnce({ success: true });
    render(<LibraryView entries={entriesWithCover} />);
    fireEvent.click(screen.getByText("Cover Book"));

    const titleInput = screen.getByLabelText("Title");
    fireEvent.change(titleInput, { target: { value: "New Title" } });

    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    expect(mockUpdateReadEntry).toHaveBeenCalledWith("e1", { title: "New Title" });
  });

  it("saves changes when format modified", async () => {
    mockUpdateReadEntry.mockResolvedValueOnce({ success: true });
    render(<LibraryView entries={entriesWithCover} />);
    fireEvent.click(screen.getByText("Cover Book"));

    fireEvent.click(screen.getByText("Audiobook"));

    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    expect(mockUpdateReadEntry).toHaveBeenCalledWith("e1", { format: "AUDIOBOOK" });
  });

  it("saves changes when finishedAt modified", async () => {
    mockUpdateReadEntry.mockResolvedValueOnce({ success: true });
    render(<LibraryView entries={entriesWithCover} />);
    fireEvent.click(screen.getByText("Cover Book"));

    const dateInput = screen.getByLabelText("Finished on");
    fireEvent.change(dateInput, { target: { value: "2024-06-01" } });

    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
    });

    expect(mockUpdateReadEntry).toHaveBeenCalledWith("e1", { finishedAt: "2024-06-01" });
  });
});
