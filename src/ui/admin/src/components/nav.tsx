"use client";
import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import User from "@/components/user";
import Link from "next/link";
import MuiLink from "@mui/material/Link";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useTheme } from "@mui/material/styles";
// import { useContext } from "react";
// import { ColorModeContext } from "@/app/(admin)/layout";
import { Skeleton } from "@mui/material";
import UserMenu from "@/components/userMenu";
import { usePathname } from "next/navigation";
import Logo from "@/components/logo";

const pages = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Analytics", href: "/analytics" },
];
const publicPages = [{ label: "Login", href: "/login" }];

export default function Nav() {
  // prevent SSR on certain components
  // to avoid mis-matched classnames issue
  // between server and client renders.
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);
  const { authStatus, user, signOut } = useAuthenticator((context) => [
    context.user,
  ]);

  const theme = useTheme();
  // const colorContext = useContext(ColorModeContext);
  const pathname = usePathname();
  const renderPages = authStatus === "authenticated" ? pages : publicPages;

  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(
    null,
  );
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null,
  );

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

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
        <AppBar position="static" sx={{ mb: 3 }}>
          <Container maxWidth="xl">
            <Toolbar disableGutters>
              <Box sx={{ flexGrow: 0, display: { xs: "flex", md: "none" } }}>
                <IconButton
                  size="large"
                  aria-label="controls for user menu"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleOpenNavMenu}
                >
                  <MenuIcon />
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorElNav}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "left",
                  }}
                  open={Boolean(anchorElNav)}
                  onClose={handleCloseNavMenu}
                  sx={{
                    display: { xs: "block", md: "none" },
                  }}
                >
                  {renderPages.map((page) => {
                    const active = page.href === pathname;
                    return (
                      <MenuItem key={page.label} onClick={handleCloseNavMenu}>
                        <Typography textAlign="center">
                          <MuiLink
                            underline={active ? "always" : "none"}
                            href={page.href}
                            component={Link}
                          >
                            {page.label}
                          </MuiLink>
                        </Typography>
                      </MenuItem>
                    );
                  })}
                </Menu>
              </Box>

              <Logo theme={theme} />

              <Box
                sx={{
                  flexGrow: 1,
                  display: { xs: "none", md: "flex" },
                }}
              >
                {renderPages.map((page) => {
                  const active = page.href === pathname;
                  return (
                    <Button
                      suppressHydrationWarning={true}
                      key={page.label}
                      onClick={handleCloseNavMenu}
                      sx={{ my: 2, display: "block" }}
                    >
                      <MuiLink
                        underline={active ? "always" : "none"}
                        href={page.href}
                        component={Link}
                        color={theme.palette.primary.contrastText}
                      >
                        {page.label}
                      </MuiLink>
                    </Button>
                  );
                })}
              </Box>

              <Box sx={{ flexGrow: 0 }}>
                {user && (
                  <>
                    <Tooltip title="Open user menu">
                      <IconButton
                        onClick={handleOpenUserMenu}
                        sx={{
                          p: 0,
                          textTransform: "none",
                          color: theme.palette.primary.contrastText,
                        }}
                        disableRipple={true}
                      >
                        <User user={user} />
                      </IconButton>
                    </Tooltip>
                    <UserMenu
                      user={user}
                      signOut={signOut}
                      anchorElUser={anchorElUser}
                      handleCloseUserMenu={handleCloseUserMenu}
                      theme={theme}
                    />
                  </>
                )}
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
      )}
    </>
  );
}
