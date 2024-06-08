import Link from "next/link";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Item from "@mui/material/Stack";
import * as React from "react";
import { Skeleton } from "@mui/material";

export default function Footer() {
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  return (
    <>
      {!isClient && (
        <Skeleton
          suppressHydrationWarning={true}
          variant="rectangular"
          height={92}
        ></Skeleton>
      )}
      {isClient && (
        <Stack alignItems={"center"}>
          <Divider />
          <Stack alignItems={"center"}>
            <Item>&copy; {new Date().getFullYear()} Santee Cloud</Item>
            <Item>
              <Stack direction={"row"}>
                <Item>
                  <Link href="#">Privacy Policy</Link>
                </Item>
                <Item>
                  <Divider
                    orientation={"vertical"}
                    sx={{ marginLeft: "4px", marginRight: "4px" }}
                  />
                </Item>
                <Item>
                  <Link href="#">Terms of Service</Link>
                </Item>
              </Stack>
            </Item>
          </Stack>
        </Stack>
      )}
    </>
  );
}
