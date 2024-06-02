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
import { Amplify } from "aws-amplify";
import config from "@/amplifyconfiguration.json";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useTheme } from "@mui/material/styles";
import { useContext } from "react";
import { ColorModeContext } from "@/app/(admin)/layout";
import ColorModeToggle from "@/components/colorModeToggle";
import { minHeight } from "@mui/system";
import { Skeleton } from "@mui/material";
Amplify.configure(config, { ssr: true });

const pages = [{ label: "Dashboard", href: "/dashboard" }];
const publicPages = [{ label: "Login", href: "/login" }];

export default function Nav() {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);
  const { authStatus, user, signOut } = useAuthenticator((context) => [
    context.user,
  ]);

  const theme = useTheme();
  const colorContext = useContext(ColorModeContext);
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
          height={66}
        ></Skeleton>
      )}
      {isClient && (
        <AppBar position="static" sx={{ mb: 3 }}>
          <Container maxWidth="xl">
            <Toolbar disableGutters>
              <Typography
                variant="h6"
                noWrap
                component="a"
                href="/"
                sx={{
                  mr: 2,
                  display: { xs: "none", md: "flex" },
                  fontFamily: "monospace",
                  fontWeight: 700,
                  letterSpacing: ".3rem",
                  color: "inherit",
                  textDecoration: "none",
                }}
              >
                LOGO
              </Typography>

              <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
                <IconButton
                  size="large"
                  aria-label="account of current user"
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
                  {renderPages.map((page) => (
                    <MenuItem key={page.label} onClick={handleCloseNavMenu}>
                      <Typography textAlign="center">
                        <MuiLink href="/public/login" component={Link}>
                          Login
                        </MuiLink>
                      </Typography>
                    </MenuItem>
                  ))}
                </Menu>
              </Box>
              <Typography
                variant="h5"
                noWrap
                component="a"
                href="/"
                sx={{
                  mr: 2,
                  display: { xs: "flex", md: "none" },
                  flexGrow: 1,
                  fontFamily: "monospace",
                  fontWeight: 700,
                  letterSpacing: ".3rem",
                  textDecoration: "none",
                }}
              >
                LOGO
              </Typography>
              <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
                {renderPages.map((page) => (
                  <Button
                    suppressHydrationWarning={true}
                    key={page.label}
                    onClick={handleCloseNavMenu}
                    sx={{ my: 2, display: "block" }}
                  >
                    <MuiLink
                      href={page.href}
                      component={Link}
                      color={theme.palette.primary.contrastText}
                    >
                      {page.label}
                    </MuiLink>
                  </Button>
                ))}
              </Box>

              <Box sx={{ flexGrow: 0 }}>
                {user && (
                  <>
                    <Tooltip title="Open settings">
                      <Button
                        onClick={handleOpenUserMenu}
                        sx={{
                          p: 0,
                          textTransform: "none",
                          color: theme.palette.primary.contrastText,
                        }}
                      >
                        <User user={user} />
                      </Button>
                    </Tooltip>
                    <Menu
                      sx={{ mt: "45px" }}
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
                      <MenuItem key={"ColorMode"}>
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
                            colorContext.setColorMode(
                              checked ? "dark" : "light",
                            );
                          }}
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
