import { runWithAmplifyServerContext } from "@/util/server-utils";
import { AmplifyServer } from "aws-amplify/adapter-core";

// The fetchAuthSession is pulled as the server version from aws-amplify/auth/server
import { fetchAuthSession } from "aws-amplify/auth/server";
import { NextRequest, NextResponse } from "next/server";

export default async function checkAuth(
  request: NextRequest,
  response: NextResponse,
) {
  return await runWithAmplifyServerContext({
    nextServerContext: { request, response },
    operation: async (contextSpec: AmplifyServer.ContextSpec) => {
      try {
        // The fetch will grab the session cookies
        const session = await fetchAuthSession(contextSpec, {});
        console.log("session");
        console.log(session);
        return session.tokens !== undefined;
      } catch (error) {
        console.log(error);
        return false;
      }
    },
  });
}
