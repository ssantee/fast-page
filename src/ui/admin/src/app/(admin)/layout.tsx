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

// export const metadata: Metadata = {
//   title: "FastPage Admin Site",
//   description: "Admin site for FastPage",
// };

export const ColorModeContext = React.createContext({
  toggleColorMode: () => {},
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [mode, setMode] = React.useState<PaletteMode>("light");
  const colorMode = React.useMemo(
    () => ({
      // The dark mode switch would invoke this method
      toggleColorMode: () => {
        setMode((prevMode: PaletteMode) =>
          prevMode === "light" ? "dark" : "light",
        );
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
              </ThemeProvider>
            </ColorModeContext.Provider>
          </Authenticator.Provider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
