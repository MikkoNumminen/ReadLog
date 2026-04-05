"use client";

import { Container, Typography, Button, Box } from "@mui/material";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
      <Typography variant="h5" gutterBottom>
        Something went wrong
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        An unexpected error occurred. Please try again.
      </Typography>
      <Box>
        <Button variant="contained" onClick={reset}>
          Try again
        </Button>
      </Box>
    </Container>
  );
}
