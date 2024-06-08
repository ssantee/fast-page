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
    main: "#f1f1f1",
  },
  secondary: {
    main: "#536dfe",
  },
};
const darkPalette = {
  primary: {
    light: "#000000",
    main: "#455a64",
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
    MuiLink: {
      styleOverrides: {
        underlineAlways: {
          textDecorationColor: "rgba(183,179,179,0.8)",
          textDecorationThickness: "2px",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: ".8rem",
        },
      },
    },
  },
});

export default getDesignTokens;
