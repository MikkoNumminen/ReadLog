"use client";
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#5D4E37",
    },
    secondary: {
      main: "#8B6914",
    },
    background: {
      default: "#FAFAF5",
      paper: "#FFFFFF",
    },
  },
  typography: {
    fontFamily: "var(--font-geist-sans), sans-serif",
  },
});

export default theme;
