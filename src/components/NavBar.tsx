"use client";

import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";

export default function NavBar() {
  const { data: session } = useSession();

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <MenuBookIcon sx={{ mr: 1 }} />
        <Typography
          variant="h6"
          component={Link}
          href="/"
          sx={{ flexGrow: 1, textDecoration: "none", color: "inherit" }}
        >
          ReadLog
        </Typography>

        <Box sx={{ display: "flex", gap: 1 }}>
          {session ? (
            <>
              <Button color="inherit" component={Link} href="/log">
                Log a book
              </Button>
              <Button color="inherit" component={Link} href="/library">
                My Library
              </Button>
              <Button color="inherit" onClick={() => signOut()}>
                Sign out
              </Button>
            </>
          ) : (
            <Button color="inherit" onClick={() => signIn("google")}>
              Sign in
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
