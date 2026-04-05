"use client";

import { useState, useCallback } from "react";
import {
  TextField,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
  Typography,
  Box,
} from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { searchBooksAction } from "@/lib/actions";
import { BookSearchResult } from "@/lib/openlibrary";

interface BookSearchProps {
  onSelect: (book: BookSearchResult) => void;
}

export default function BookSearch({ onSelect }: BookSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const books = await searchBooksAction(query);
      setResults(books);
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <Box>
      <TextField
        fullWidth
        label="Search for a book"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        slotProps={{
          input: {
            endAdornment: loading ? <CircularProgress size={20} /> : null,
          },
        }}
      />

      {searched && results.length === 0 && !loading && (
        <Typography sx={{ mt: 2 }} color="text.secondary">
          No books found.
        </Typography>
      )}

      <List>
        {results.map((book) => (
          <ListItemButton key={book.openLibraryId} onClick={() => onSelect(book)}>
            <ListItemAvatar>
              {book.coverUrl ? (
                <Avatar variant="rounded" src={book.coverUrl} sx={{ width: 40, height: 56 }} />
              ) : (
                <Avatar variant="rounded" sx={{ width: 40, height: 56 }}>
                  <MenuBookIcon />
                </Avatar>
              )}
            </ListItemAvatar>
            <ListItemText
              primary={book.title}
              secondary={[book.author, book.firstPublishYear].filter(Boolean).join(" · ")}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
