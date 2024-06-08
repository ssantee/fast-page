"use client";
//import type { Metadata } from "next";
import { Authenticator } from "@aws-amplify/ui-react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import "@/app/globals.css";
import getDesignTokens from "@/app/(admin)/theme";
import * as React from "react";
import { PaletteMode } from "@mui/material";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import { useCookies } from "react-cookie";
import { Amplify } from "aws-amplify";
import config from "@/amplifyconfiguration.json";

Amplify.configure(config, { ssr: true });

const cookieName = "color-mode";
// export const metadata: Metadata = {
//   title: "FastPage Admin Site",
//   description: "Admin site for FastPage",
// };

export const ColorModeContext = React.createContext({
  toggleColorMode: () => {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setColorMode: (mode: PaletteMode) => {},
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [cookies, setCookie] = useCookies([cookieName]);
  let initialColorMode = "light";
  if (cookies[cookieName] === "dark") {
    initialColorMode = "dark";
  }

  const [mode, setMode] = React.useState<PaletteMode>(
    initialColorMode as PaletteMode,
  );

  const colorMode = React.useMemo(
    () => ({
      // The dark mode switch would invoke this method
      toggleColorMode: () => {
        setMode((prevMode: PaletteMode) =>
          prevMode === "light" ? "dark" : "light",
        );
      },
      setColorMode: (mode: PaletteMode) => {
        setMode(mode);
        setCookie(cookieName, mode);
      },
    }),
    [],
  );

  const theme = React.useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <Authenticator.Provider>
            <ColorModeContext.Provider value={colorMode}>
              <ThemeProvider theme={theme}>
                <CssBaseline />
                <Nav />
                {children}
                <Footer />
              </ThemeProvider>
            </ColorModeContext.Provider>
          </Authenticator.Provider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
