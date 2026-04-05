import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Stack,
} from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import HeadphonesIcon from "@mui/icons-material/Headphones";
import TabletIcon from "@mui/icons-material/Tablet";
import { getMyBooks } from "@/lib/actions";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LibrarySearch from "@/components/LibrarySearch";

const formatIcons = {
  BOOK: <MenuBookIcon fontSize="small" />,
  AUDIOBOOK: <HeadphonesIcon fontSize="small" />,
  EBOOK: <TabletIcon fontSize="small" />,
};

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin");

  const entries = await getMyBooks();

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Library
      </Typography>

      <LibrarySearch />

      {entries.length === 0 ? (
        <Typography color="text.secondary" sx={{ mt: 4, textAlign: "center" }}>
          No books logged yet. Start by logging your first book!
        </Typography>
      ) : (
        <Stack spacing={2} sx={{ mt: 2 }}>
          {entries.map((entry) => (
            <Card key={entry.id} sx={{ display: "flex" }}>
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
              <CardContent sx={{ flex: 1 }}>
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
                    {new Date(entry.finishedAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  );
}
