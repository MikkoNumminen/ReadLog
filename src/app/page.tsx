import { Container, Typography } from "@mui/material";
import { getRecentPublicReads } from "@/lib/actions";
import FeedList from "@/components/FeedList";

export default async function Home() {
  const recentReads = await getRecentPublicReads();

  const entries = recentReads.map((entry) => ({
    id: entry.id,
    format: entry.format,
    createdAt: entry.createdAt.toISOString(),
    book: {
      title: entry.book.title,
      author: entry.book.author,
      coverUrl: entry.book.coverUrl,
    },
  }));

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Recently Read
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        See what people are reading.
      </Typography>

      {entries.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: "center", mt: 4 }}>
          No books logged yet. Be the first!
        </Typography>
      ) : (
        <FeedList entries={entries} />
      )}
    </Container>
  );
}
