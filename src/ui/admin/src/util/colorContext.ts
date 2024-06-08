import * as React from "react";
import { PaletteMode } from "@mui/material";

export const ColorModeContext = React.createContext({
  toggleColorMode: () => {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setColorMode: (mode: PaletteMode) => {},
});
