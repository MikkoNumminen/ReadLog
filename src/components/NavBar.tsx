"use client";

import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AddIcon from "@mui/icons-material/Add";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
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
              <Button color="inherit" component={Link} href="/log" startIcon={<AddIcon />}>
                Log a book
              </Button>
              <Button
                color="inherit"
                component={Link}
                href="/library"
                startIcon={<LibraryBooksIcon />}
              >
                My Library
              </Button>
              <Button color="inherit" onClick={() => signOut()} startIcon={<LogoutIcon />}>
                Sign out
              </Button>
            </>
          ) : (
            <Button color="inherit" onClick={() => signIn("google")} startIcon={<LoginIcon />}>
              Sign in
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
