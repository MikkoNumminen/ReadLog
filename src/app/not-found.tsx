"use client";

import { Container, Typography, Button } from "@mui/material";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
      <Typography variant="h4" gutterBottom>
        Page not found
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        The page you&apos;re looking for doesn&apos;t exist.
      </Typography>
      <Button variant="contained" onClick={() => router.push("/")}>
        Go home
      </Button>
    </Container>
  );
}
