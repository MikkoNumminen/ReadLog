import { Container, Typography } from "@mui/material";
import { getMyBooks } from "@/lib/actions";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LibrarySearch from "@/components/LibrarySearch";
import LibraryView from "@/components/LibraryView";

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin");

  const entries = await getMyBooks();

  const serialized = entries.map((entry) => ({
    id: entry.id,
    format: entry.format,
    finishedAt: entry.finishedAt.toISOString(),
    book: {
      title: entry.book.title,
      author: entry.book.author,
      coverUrl: entry.book.coverUrl,
    },
  }));

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Library
      </Typography>

      <LibrarySearch />

      {serialized.length === 0 ? (
        <Typography color="text.secondary" sx={{ mt: 4, textAlign: "center" }}>
          No books logged yet. Start by logging your first book!
        </Typography>
      ) : (
        <LibraryView entries={serialized} />
      )}
    </Container>
  );
}
