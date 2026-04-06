"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Stack,
  Chip,
  Typography,
  Box,
  Rating,
} from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import HeadphonesIcon from "@mui/icons-material/Headphones";
import TabletIcon from "@mui/icons-material/Tablet";
import BookDetailDialog from "@/components/BookDetailDialog";

const formatIcons = {
  BOOK: <MenuBookIcon fontSize="small" />,
  AUDIOBOOK: <HeadphonesIcon fontSize="small" />,
  EBOOK: <TabletIcon fontSize="small" />,
};

interface FeedEntry {
  id: string;
  format: "BOOK" | "AUDIOBOOK" | "EBOOK";
  createdAt: string;
  rating?: number | null;
  book: {
    title: string;
    author: string | null;
    coverUrl: string | null;
  };
}

export default function FeedList({ entries }: { entries: FeedEntry[] }) {
  const [selected, setSelected] = useState<FeedEntry | null>(null);

  return (
    <>
      <Stack spacing={2}>
        {entries.map((entry) => (
          <Card key={entry.id}>
            <CardActionArea
              onClick={() => setSelected(entry)}
              sx={{ display: "flex", justifyContent: "flex-start" }}
            >
              {entry.book.coverUrl ? (
                <CardMedia
                  component="img"
                  sx={{ width: 80 }}
                  image={entry.book.coverUrl}
                  alt={entry.book.title}
                />
              ) : (
                <Box
                  sx={{
                    width: 80,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "grey.100",
                  }}
                >
                  <MenuBookIcon sx={{ fontSize: 40, color: "grey.400" }} />
                </Box>
              )}
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600}>
                  {entry.book.title}
                </Typography>
                {entry.book.author && (
                  <Typography variant="body2" color="text.secondary">
                    {entry.book.author}
                  </Typography>
                )}
                <Box sx={{ mt: 1, display: "flex", gap: 1, alignItems: "center" }}>
                  <Chip
                    icon={formatIcons[entry.format]}
                    label={entry.format.toLowerCase()}
                    size="small"
                    variant="outlined"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                {entry.rating != null && (
                  <Box sx={{ mt: 0.5 }}>
                    <Rating value={entry.rating} readOnly size="small" />
                  </Box>
                )}
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>

      {selected && (
        <BookDetailDialog
          open={!!selected}
          onClose={() => setSelected(null)}
          title={selected.book.title}
          author={selected.book.author}
          coverUrl={selected.book.coverUrl}
        />
      )}
    </>
  );
}
