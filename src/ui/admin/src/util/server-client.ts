import { cookies } from "next/headers";
import { generateServerClientUsingCookies } from "@aws-amplify/adapter-nextjs/api";
import {
  createKeyValueStorageFromCookieStorageAdapter,
  createUserPoolsTokenProvider,
  createAWSCredentialsAndIdentityIdProvider,
  runWithAmplifyServerContext,
} from "aws-amplify/adapter-core";
import { parseAmplifyConfig } from "aws-amplify/utils";
import { getCurrentUser } from "aws-amplify/auth/server";

import config from "../amplifyconfiguration.json";
import { AuthConfig } from "@aws-amplify/core";

const amplifyConfig = parseAmplifyConfig(config);

const keyValueStorage = createKeyValueStorageFromCookieStorageAdapter({
  get(name) {
    const value = cookies().get(name)?.value || ""; // use framework cookie API to get the value by name
    return { name, value };
  },
  getAll() {
    // use framework cookie API to get an array of { name, value }
    const allCookies = cookies().getAll();
    const cookiesOut: { name: string; value: string }[] = [];
    allCookies.forEach((cookie) => {
      cookiesOut.push({ name: cookie.name, value: cookie.value });
    });
    return cookiesOut;
  },
  set(name, value) {
    cookies().set(name, value); // use framework cookie API to set a cookie
  },
  delete(name) {
    cookies().delete(name); // use framework cookie API to delete a cookie
  },
});

const tokenProvider = createUserPoolsTokenProvider(
  <AuthConfig>amplifyConfig.Auth,
  keyValueStorage,
);

// Step 3 create the `credentialsProvider`
const credentialsProvider = createAWSCredentialsAndIdentityIdProvider(
  <AuthConfig>amplifyConfig.Auth,
  keyValueStorage,
);

export default async function getAuthedUser() {
  return await runWithAmplifyServerContext(
    amplifyConfig,
    {
      Auth: { tokenProvider, credentialsProvider },
    },
    // The callback function that contains your business logic
    async (contextSpec) => {
      const { username } = await getCurrentUser(contextSpec);

      return `Welcome ${username}!`;
    },
  );
}

export const serverClient = generateServerClientUsingCookies({
  config,
  cookies,
});
