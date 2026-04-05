"use client";

import { Container, Typography, Button, Box, Paper } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  return (
    <Container maxWidth="xs" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <MenuBookIcon sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Sign in to ReadLog
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Track books and audiobooks you&apos;ve read.
        </Typography>
        <Button
          variant="contained"
          size="large"
          fullWidth
          startIcon={<GoogleIcon />}
          onClick={() => signIn("google", { callbackUrl })}
        >
          Sign in with Google
        </Button>
      </Paper>
    </Container>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}
