import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/services/AuthService";

const publicPaths: string[] = ["/", "/public/login"];

export async function middleware(request: NextRequest) {
  const authenticated = await checkAuth();
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname);

  if (!isPublicPath) {
    if (authenticated) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL(`/`, request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|login).*)",
  ],
};
