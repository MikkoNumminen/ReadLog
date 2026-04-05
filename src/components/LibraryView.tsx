"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Chip,
  IconButton,
  Tooltip,
  Stack,
} from "@mui/material";
import GridViewIcon from "@mui/icons-material/GridView";
import ViewListIcon from "@mui/icons-material/ViewList";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import HeadphonesIcon from "@mui/icons-material/Headphones";
import TabletIcon from "@mui/icons-material/Tablet";

const formatIcons = {
  BOOK: <MenuBookIcon fontSize="small" />,
  AUDIOBOOK: <HeadphonesIcon fontSize="small" />,
  EBOOK: <TabletIcon fontSize="small" />,
};

interface ReadEntry {
  id: string;
  format: "BOOK" | "AUDIOBOOK" | "EBOOK";
  finishedAt: Date;
  book: {
    title: string;
    author: string | null;
    coverUrl: string | null;
  };
}

export default function LibraryView({ entries }: { entries: ReadEntry[] }) {
  const [view, setView] = useState<"grid" | "list">("grid");

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
        <Tooltip title="Grid view">
          <IconButton
            size="small"
            onClick={() => setView("grid")}
            color={view === "grid" ? "primary" : "default"}
          >
            <GridViewIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="List view">
          <IconButton
            size="small"
            onClick={() => setView("list")}
            color={view === "list" ? "primary" : "default"}
          >
            <ViewListIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {view === "grid" ? <GridView entries={entries} /> : <ListView entries={entries} />}
    </Box>
  );
}

function GridView({ entries }: { entries: ReadEntry[] }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(3, 1fr)",
          sm: "repeat(4, 1fr)",
          md: "repeat(5, 1fr)",
        },
        gap: 2,
      }}
    >
      {entries.map((entry) => (
        <Box key={entry.id} sx={{ textAlign: "center" }}>
          {entry.book.coverUrl ? (
            <Box
              component="img"
              src={entry.book.coverUrl}
              alt={entry.book.title}
              sx={{
                width: "100%",
                aspectRatio: "2/3",
                objectFit: "cover",
                borderRadius: 1,
                boxShadow: 1,
              }}
            />
          ) : (
            <Box
              sx={{
                width: "100%",
                aspectRatio: "2/3",
                borderRadius: 1,
                bgcolor: "grey.100",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MenuBookIcon sx={{ fontSize: 48, color: "grey.400" }} />
            </Box>
          )}
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{
              mt: 0.5,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {entry.book.title}
          </Typography>
          {entry.book.author && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "block",
              }}
            >
              {entry.book.author}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
}

function ListView({ entries }: { entries: ReadEntry[] }) {
  return (
    <Stack spacing={0.5}>
      {entries.map((entry) => (
        <Card key={entry.id} variant="outlined" sx={{ display: "flex", alignItems: "center" }}>
          {entry.book.coverUrl ? (
            <CardMedia
              component="img"
              sx={{ width: 40, height: 60, objectFit: "cover", flexShrink: 0 }}
              image={entry.book.coverUrl}
              alt={entry.book.title}
            />
          ) : (
            <Box
              sx={{
                width: 40,
                height: 60,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "grey.100",
                flexShrink: 0,
              }}
            >
              <MenuBookIcon sx={{ fontSize: 24, color: "grey.400" }} />
            </Box>
          )}
          <CardContent
            sx={{
              py: 0.5,
              px: 1.5,
              "&:last-child": { pb: 0.5 },
              flex: 1,
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {entry.book.title}
              </Typography>
              {entry.book.author && (
                <Typography variant="caption" color="text.secondary" noWrap component="div">
                  {entry.book.author}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexShrink: 0 }}>
              <Chip
                icon={formatIcons[entry.format]}
                label={entry.format.toLowerCase()}
                size="small"
                variant="outlined"
              />
              <Typography variant="caption" color="text.secondary" noWrap>
                {new Date(entry.finishedAt).toLocaleDateString()}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
