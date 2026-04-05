import { Container, Typography, Box, Avatar, Card, CardContent, Chip, Stack } from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import HeadphonesIcon from "@mui/icons-material/Headphones";
import TabletIcon from "@mui/icons-material/Tablet";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAccountStats } from "@/lib/actions";

const formatLabels: Record<string, { label: string; icon: React.ReactElement }> = {
  BOOK: { label: "Books", icon: <MenuBookIcon fontSize="small" /> },
  AUDIOBOOK: { label: "Audiobooks", icon: <HeadphonesIcon fontSize="small" /> },
  EBOOK: { label: "E-books", icon: <TabletIcon fontSize="small" /> },
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin");

  const stats = await getAccountStats();
  if (!stats) redirect("/api/auth/signin");

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Account
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            src={stats.user.image ?? undefined}
            alt={stats.user.name ?? "User"}
            sx={{ width: 64, height: 64 }}
          />
          <Box>
            <Typography variant="h6">{stats.user.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {stats.user.email}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Reading stats
          </Typography>
          <Typography variant="h3" sx={{ mb: 2 }}>
            {stats.totalBooks}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {stats.totalBooks === 1 ? "book" : "books"} logged
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {Object.entries(formatLabels).map(([format, { label, icon }]) => {
              const count = (stats.formats as Record<string, number>)[format] ?? 0;
              if (count === 0) return null;
              return (
                <Chip key={format} icon={icon} label={`${count} ${label}`} variant="outlined" />
              );
            })}
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
