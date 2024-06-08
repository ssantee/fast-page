import * as React from "react";
import Box from "@mui/material/Box";
import Image from "next/image";
import logoDarkSm from "../../public/logo-draft-hz-dark.png";
import logoLightSm from "../../public/logo-draft-hz-light.png";
import logoDark from "../../public/logo-draft-dark.png";
import logoLight from "../../public/logo-draft.png";
import { Theme } from "@mui/system";

interface LogoProps {
  theme: Theme;
}

export default function Logo({ theme }: LogoProps) {
  const dark = theme.palette.mode === "dark";
  return (
    <>
      <Box
        sx={{
          marginX: 1,
          marginY: 1,
          display: { xs: "flex", md: "none" },
          flexGrow: 2,
          alignItems: "center",
        }}
      >
        <Image
          width={135}
          style={{ margin: "0 auto" }}
          src={dark ? logoDarkSm : logoLightSm}
          alt={"Site logo"}
          priority
        />
      </Box>
      <Box
        sx={{
          marginX: 1,
          marginY: 1,
          display: { xs: "none", md: "flex" },
          flexGrow: 0,
        }}
      >
        <Image
          width={135}
          src={dark ? logoDark : logoLight}
          alt={"Site logo"}
          priority
        />
      </Box>
    </>
  );
}
