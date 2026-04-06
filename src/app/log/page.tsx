"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  Alert,
  Rating,
} from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import HeadphonesIcon from "@mui/icons-material/Headphones";
import TabletIcon from "@mui/icons-material/Tablet";
import BookSearch from "@/components/BookSearch";
import { BookSearchResult } from "@/lib/openlibrary";
import { logBook } from "@/lib/actions";

export default function LogBookPage() {
  const router = useRouter();
  const { status } = useSession();
  const [selected, setSelected] = useState<BookSearchResult | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin?callbackUrl=/log");
    }
  }, [status, router]);

  const [editedTitle, setEditedTitle] = useState("");
  const [editedAuthor, setEditedAuthor] = useState("");
  const [format, setFormat] = useState<"BOOK" | "AUDIOBOOK" | "EBOOK">("BOOK");
  const [finishedAt, setFinishedAt] = useState(new Date().toISOString().split("T")[0]);
  const [rating, setRating] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await logBook(
        selected.openLibraryId,
        editedTitle || selected.title,
        editedAuthor || selected.author,
        selected.coverUrl,
        selected.pageCount,
        selected.firstPublishYear,
        format,
        finishedAt,
        rating,
      );
      router.push("/library");
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (status !== "authenticated") {
    return null;
  }

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Log a book
      </Typography>

      {!selected ? (
        <BookSearch
          onSelect={(book) => {
            setSelected(book);
            setEditedTitle(book.title);
            setEditedAuthor(book.author ?? "");
          }}
        />
      ) : (
        <Box>
          <Card sx={{ display: "flex", mb: 3 }}>
            {selected.coverUrl && (
              <CardMedia
                component="img"
                sx={{ width: 100 }}
                image={selected.coverUrl}
                alt={selected.title}
              />
            )}
            <CardContent>
              <TextField
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                variant="standard"
                fullWidth
                slotProps={{
                  input: { sx: { fontSize: "1.25rem", fontWeight: 500 } },
                }}
              />
              <TextField
                value={editedAuthor}
                onChange={(e) => setEditedAuthor(e.target.value)}
                variant="standard"
                fullWidth
                placeholder="Author"
                slotProps={{
                  input: { sx: { fontSize: "0.875rem", color: "text.secondary" } },
                }}
              />
              {selected.firstPublishYear && (
                <Typography variant="body2" color="text.secondary">
                  {selected.firstPublishYear}
                </Typography>
              )}
              <Button size="small" onClick={() => setSelected(null)} sx={{ mt: 1 }}>
                Change book
              </Button>
            </CardContent>
          </Card>

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Format
          </Typography>
          <ToggleButtonGroup
            value={format}
            exclusive
            onChange={(_, v) => v && setFormat(v)}
            fullWidth
            sx={{ mb: 3 }}
          >
            <ToggleButton value="BOOK">
              <MenuBookIcon sx={{ mr: 1 }} /> Book
            </ToggleButton>
            <ToggleButton value="AUDIOBOOK">
              <HeadphonesIcon sx={{ mr: 1 }} /> Audiobook
            </ToggleButton>
            <ToggleButton value="EBOOK">
              <TabletIcon sx={{ mr: 1 }} /> E-book
            </ToggleButton>
          </ToggleButtonGroup>

          <TextField
            label="Finished on"
            type="date"
            value={finishedAt}
            onChange={(e) => setFinishedAt(e.target.value)}
            fullWidth
            sx={{ mb: 3 }}
          />

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Your rating
          </Typography>
          <Box sx={{ mb: 3 }}>
            <Rating
              value={rating}
              onChange={(_, value) => setRating(value)}
              size="large"
              precision={1}
            />
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Button variant="contained" fullWidth size="large" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save to library"}
          </Button>
        </Box>
      )}
    </Container>
  );
}
