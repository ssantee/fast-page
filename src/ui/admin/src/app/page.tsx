"use client";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { Amplify } from "aws-amplify";
import App from "../components/app";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

const awsRegion = "us-east-1";
const identityPoolId = "us-east-1:515bd317-9501-451f-9c2c-1ad6db5706d1";
const userPoolId = "us-east-1_0Q7QtJdSB";
const userPoolClientId = "6iv2ud13p39mtlol53q7upk2k6";
Amplify.configure({
  Auth: {
    region: awsRegion,
    userPoolId: userPoolId,
    userPoolWebClientId: userPoolClientId,
    identityPoolId: identityPoolId,
    authenticationFlowType: "USER_PASSWORD_AUTH",
  },
});

export default function Home() {
  return (
    <Authenticator.Provider>
      <App />
    </Authenticator.Provider>
  );
}
