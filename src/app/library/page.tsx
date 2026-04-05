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

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Library
      </Typography>

      <LibrarySearch />

      {entries.length === 0 ? (
        <Typography color="text.secondary" sx={{ mt: 4, textAlign: "center" }}>
          No books logged yet. Start by logging your first book!
        </Typography>
      ) : (
        <LibraryView entries={entries} />
      )}
    </Container>
  );
}
