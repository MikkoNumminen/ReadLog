"use client";

import { useState } from "react";
import {
  TextField,
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Stack,
  Chip,
} from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import HeadphonesIcon from "@mui/icons-material/Headphones";
import TabletIcon from "@mui/icons-material/Tablet";
import SearchIcon from "@mui/icons-material/Search";
import { checkIfRead } from "@/lib/actions";

const formatIcons = {
  BOOK: <MenuBookIcon fontSize="small" />,
  AUDIOBOOK: <HeadphonesIcon fontSize="small" />,
  EBOOK: <TabletIcon fontSize="small" />,
};

interface ReadEntryWithBook {
  id: string;
  format: "BOOK" | "AUDIOBOOK" | "EBOOK";
  finishedAt: Date;
  book: {
    title: string;
    author: string | null;
    coverUrl: string | null;
  };
}

export default function LibrarySearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ReadEntryWithBook[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setSearched(true);
    const entries = await checkIfRead(query);
    setResults(entries as unknown as ReadEntryWithBook[]);
  };

  return (
    <Box>
      <TextField
        fullWidth
        label="Have I read this?"
        placeholder="Search your library..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        slotProps={{
          input: {
            startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
          },
        }}
      />

      {searched && results.length === 0 && (
        <Typography sx={{ mt: 2 }} color="text.secondary">
          Not in your library.
        </Typography>
      )}

      {results.length > 0 && (
        <Stack spacing={1} sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="success.main">
            Yes! Found {results.length} match{results.length > 1 ? "es" : ""}:
          </Typography>
          {results.map((entry) => (
            <Card key={entry.id} variant="outlined" sx={{ display: "flex" }}>
              {entry.book.coverUrl && (
                <CardMedia
                  component="img"
                  sx={{ width: 50 }}
                  image={entry.book.coverUrl}
                  alt={entry.book.title}
                />
              )}
              <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
                <Typography variant="body2" fontWeight={600}>
                  {entry.book.title}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <Chip
                    icon={formatIcons[entry.format]}
                    label={entry.format.toLowerCase()}
                    size="small"
                    variant="outlined"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {new Date(entry.finishedAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}
