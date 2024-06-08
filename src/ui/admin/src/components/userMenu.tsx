import * as React from "react";
import { AuthUser } from "@aws-amplify/auth";
import MenuItem from "@mui/material/MenuItem";
import User from "@/components/user";
import ColorModeToggle from "@/components/colorModeToggle";
import Menu from "@mui/material/Menu";
import { ColorModeContext } from "@/util/colorContext";
import { useContext } from "react";
import { Theme } from "@mui/system";

interface UserMenuProps {
  user: AuthUser;
  signOut?: () => void;
  toSignUp?: () => void;
  anchorElUser: HTMLElement | null;
  handleCloseUserMenu: () => void;
  theme: Theme;
}

export default function UserMenu({
  user,
  anchorElUser,
  handleCloseUserMenu,
  theme,
  signOut,
}: UserMenuProps) {
  const colorContext = useContext(ColorModeContext);
  const fontSizeOverride = ".8rem";
  return (
    <Menu
      sx={{ mt: "45px", fontSize: fontSizeOverride }}
      id="menu-appbar"
      anchorEl={anchorElUser}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      keepMounted
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      open={Boolean(anchorElUser)}
      onClose={handleCloseUserMenu}
    >
      <MenuItem
        sx={{
          "&:hover": {
            backgroundColor: "transparent",
            cursor: "default",
          },
        }}
        key={"AvatarVis"}
        divider
        disableRipple={true}
      >
        <User user={user} expanded={true} />
      </MenuItem>
      <MenuItem
        key={"ColorMode"}
        sx={{
          "&:hover": {
            backgroundColor: "transparent",
            cursor: "default",
          },
        }}
      >
        <ColorModeToggle
          toggleHandler={() => {
            colorContext.toggleColorMode();
          }}
          setColorMode={(mode) => {
            colorContext.setColorMode(mode);
          }}
          checked={theme.palette.mode === "dark"}
          setChecked={(checked) => {
            console.log("setting color mode");
            colorContext.setColorMode(checked ? "dark" : "light");
          }}
          fontSizeOverride={fontSizeOverride}
        />
      </MenuItem>
      {signOut && (
        <MenuItem
          key={"LogOut"}
          onClick={() => {
            handleCloseUserMenu();
            signOut();
            window.location.href = "/";
          }}
        >
          Log out
        </MenuItem>
      )}
    </Menu>
  );
}
