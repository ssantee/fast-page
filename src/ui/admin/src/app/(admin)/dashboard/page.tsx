import * as React from "react";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Unstable_Grid2";
import Container from "@mui/material/Container";

export default function Dashboard() {
  // const { user, authStatus, signOut, toSignUp, toForgotPassword } =
  //   useAuthenticator((context) => [context.user]);
  return (
    <Container maxWidth="xl">
      <div>
        <h1>Hello Dashboard</h1>
        <p>Some copy</p>
      </div>
      <Grid container spacing={2}>
        <Grid xs={12} md={8}>
          <Paper suppressHydrationWarning={true}>xs=12 md=8</Paper>
        </Grid>
        <Grid xs={6} md={8}>
          <Paper suppressHydrationWarning={true}>xs=6 md=8</Paper>
        </Grid>
        <Grid xs={6} md={4}>
          <Paper suppressHydrationWarning={true}>xs=6 md=4</Paper>
        </Grid>
        <Grid xs={6} md={4}>
          <Paper suppressHydrationWarning={true}>xs=6 md=4</Paper>
        </Grid>
        <Grid xs={6} md={8}>
          <Paper suppressHydrationWarning={true}>xs=6 md=8</Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
