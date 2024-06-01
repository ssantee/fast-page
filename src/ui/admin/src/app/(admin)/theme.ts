"use client";
import { Roboto } from "next/font/google";
import { PaletteMode } from "@mui/material";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

const lightPalette = {
  primary: {
    light: "#f3e997",
    main: "#ecdb51",
    dark: "#e4ad28",
    contrastText: "#fff",
  },
  secondary: {
    light: "#9ea3f4",
    main: "#5161ec",
    dark: "#2439da",
    contrastText: "#000",
  },
};
const darkPalette = {
  primary: {
    light: "#000000",
    main: "#EEEEEE",
    dark: "#ffffff",
    contrastText: "#fff",
  },
  secondary: {
    light: "#000000",
    main: "#EEEEEE",
    dark: "#ffffff",
    contrastText: "#fff",
  },
};

const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    ...(mode === "light" ? lightPalette : darkPalette),
  },
  typography: {
    fontFamily: roboto.style.fontFamily,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: roboto.style.fontFamily,
        },
      },
    },
  },
});

export default getDesignTokens;
