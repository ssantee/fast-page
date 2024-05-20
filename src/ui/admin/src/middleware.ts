import { NextRequest, NextResponse } from "next/server";
import { serverClient } from "./util/server-client";
import { fetchAuthSession } from "@aws-amplify/auth";
const unauthedRoutes = ["/"];

// const awsRegion = "us-east-1";
// const identityPoolId = "us-east-1:515bd317-9501-451f-9c2c-1ad6db5706d1";
// const userPoolId = "us-east-1_0Q7QtJdSB";
// const userPoolClientId = "6iv2ud13p39mtlol53q7upk2k6";

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const authenticated = await serverClient({
    nextServerContext: { request, response },
    operation: async (contextSpec) => {
      try {
        const session = await fetchAuthSession(contextSpec);
        return session.tokens !== undefined;
      } catch (error) {
        console.log(error);
        return false;
      }
    },
  });

  if (authenticated) {
    return response;
  }

  const parsedURL = new URL(request.url);
  const path = parsedURL.pathname;

  return NextResponse.redirect(new URL(`/login?origin=${path}`, request.url));
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [{ source: "/((?!api|_next/static|_next/image|favicon.ico).*)" }],
};
