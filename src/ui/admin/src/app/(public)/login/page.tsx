"use client";
import { Amplify } from "aws-amplify";
import type { WithAuthenticatorProps } from "@aws-amplify/ui-react";
import { withAuthenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import config from "../../../amplifyconfiguration.json";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "@/app/(public)/login/styles.css";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { redirect } from "next/navigation";
import { Hub } from "aws-amplify/utils";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Item from "@mui/material/Stack";

Amplify.configure(config, { ssr: true });
const copyYear = new Date().getFullYear();

export function Login(props: WithAuthenticatorProps) {
  const { authStatus } = useAuthenticator((context) => [context.user]);
  initAuthEventListener();

  if (authStatus === "authenticated") {
    redirect("/dashboard");
  }
  return <p>{authStatus === "configuring" && "Loading..."}</p>;
}

const authComponents = {
  Header() {
    return (
      <div className={"auth-extras auth-extras-header"}>
        Sign in to access the app
      </div>
    );
  },
  Footer() {
    return (
      <div className={"auth-extras auth-extras-footer"}>&copy; {copyYear}</div>
    );
  },
  SignIn: {
    Footer() {
      const { toForgotPassword, toSignUp } = useAuthenticator((context) => [
        context.user,
      ]);
      return (
        <Stack>
          <Item>
            <Button onClick={toSignUp}>No Account? Sign Up</Button>
          </Item>
          <Item>
            <Button onClick={toForgotPassword}>Forgot Password?</Button>
          </Item>
        </Stack>
      );
    },
  },
  SignUp: {
    Footer() {
      const { toSignIn } = useAuthenticator((context) => [context.user]);
      return (
        <Stack>
          <Item>
            <Button onClick={toSignIn}>Already have an account? Sign In</Button>
          </Item>
        </Stack>
      );
    },
  },
};

export default withAuthenticator(Login, {
  components: authComponents,
  variation: "default",
});

function initAuthEventListener() {
  Hub.listen("auth", ({ payload }) => {
    switch (payload.event) {
      case "signedIn":
        console.log("user have been signedIn successfully.");
        break;
      case "signedOut":
        console.log("user have been signedOut successfully.");
        break;
      case "tokenRefresh":
        console.log("auth tokens have been refreshed.");
        break;
      case "tokenRefresh_failure":
        console.log("failure while refreshing auth tokens.");
        break;
      case "signInWithRedirect":
        console.log("signInWithRedirect API has successfully been resolved.");
        break;
      case "signInWithRedirect_failure":
        console.log("failure while trying to resolve signInWithRedirect API.");
        break;
      case "customOAuthState":
        console.log("custom state returned from CognitoHosted UI");
        break;
    }
  });
}
