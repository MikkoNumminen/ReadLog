import { Container, Typography } from "@mui/material";

export default function Home() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        ReadLog
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Track books and audiobooks you&apos;ve read.
      </Typography>
    </Container>
  );
}
