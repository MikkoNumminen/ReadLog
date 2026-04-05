"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AddIcon from "@mui/icons-material/Add";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useSession, signIn, signOut } from "next-auth/react";

export default function NavBar() {
  const { data: session } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();

  const navItems = session
    ? [
        { label: "Log a book", href: "/log", icon: <AddIcon /> },
        { label: "My Library", href: "/library", icon: <LibraryBooksIcon /> },
        { label: "Account", href: "/account", icon: <AccountCircleIcon /> },
      ]
    : [];

  const navigate = (href: string) => router.push(href);

  return (
    <>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <MenuBookIcon sx={{ mr: 1 }} />
          <Typography
            variant="h6"
            onClick={() => navigate("/")}
            sx={{ flexGrow: 1, textDecoration: "none", color: "inherit", cursor: "pointer" }}
          >
            ReadLog
          </Typography>

          {/* Desktop nav */}
          <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 1 }}>
            {session ? (
              <>
                {navItems.map((item) => (
                  <Button
                    key={item.href}
                    color="inherit"
                    onClick={() => navigate(item.href)}
                    startIcon={item.icon}
                  >
                    {item.label}
                  </Button>
                ))}
                <Button
                  color="inherit"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  startIcon={<LogoutIcon />}
                >
                  Sign out
                </Button>
              </>
            ) : (
              <Button color="inherit" onClick={() => signIn("google")} startIcon={<LoginIcon />}>
                Sign in
              </Button>
            )}
          </Box>

          {/* Mobile hamburger */}
          <IconButton
            color="inherit"
            edge="end"
            onClick={() => setDrawerOpen(true)}
            sx={{ display: { xs: "flex", sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 250 }} onClick={() => setDrawerOpen(false)}>
          <List>
            {navItems.map((item) => (
              <ListItemButton key={item.href} onClick={() => navigate(item.href)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
            {session && (
              <>
                <Divider />
                <ListItemButton onClick={() => signOut({ callbackUrl: "/" })}>
                  <ListItemIcon>
                    <LogoutIcon />
                  </ListItemIcon>
                  <ListItemText primary="Sign out" />
                </ListItemButton>
              </>
            )}
            {!session && (
              <ListItemButton onClick={() => signIn("google")}>
                <ListItemIcon>
                  <LoginIcon />
                </ListItemIcon>
                <ListItemText primary="Sign in" />
              </ListItemButton>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
