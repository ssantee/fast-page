import { runWithAmplifyServerContext } from "@/util/server-utils";
import { AmplifyServer } from "aws-amplify/adapter-core";
import { cookies } from "next/headers";
import { fetchAuthSession } from "aws-amplify/auth/server";

export async function checkAuth() {
  return await runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async (contextSpec: AmplifyServer.ContextSpec) => {
      try {
        // The fetch will grab the session cookies
        const session = await fetchAuthSession(contextSpec, {});
        console.log("session");
        console.dir(session.tokens?.signInDetails?.loginId);
        return session.tokens !== undefined;
      } catch (error) {
        console.log(error);
        return false;
      }
    },
  });
}
