import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { Authenticator } from "@aws-amplify/ui-react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import getDesignTokens from "@/app/(admin)/theme";
import { Amplify } from "aws-amplify";
import { Environment } from "@/util/environment";

Amplify.configure(Environment.GetAmplifyConfigForEnvironment(), { ssr: true });

const AllTheProviders = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const theme = React.useMemo(() => createTheme(getDesignTokens("dark")), []);
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <Authenticator.Provider>
        <ThemeProvider theme={theme}>
          {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
          <CssBaseline />
          {children}
        </ThemeProvider>
      </Authenticator.Provider>
    </AppRouterCacheProvider>
  );
};

const customRender = (ui: React.ReactNode, options: RenderOptions) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// re-export everything
export * from "@testing-library/react";

// override render method
export { customRender as render };
