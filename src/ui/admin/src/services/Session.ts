import { cache } from "react";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { SessionOptions } from "iron-session";

export interface SessionData {
  username: string;
  isLoggedIn: boolean;
}

export const defaultSession: SessionData = {
  username: "",
  isLoggedIn: false,
};

export const sessionOptions: SessionOptions = {
  password: "complex_password_at_least_32_characters_long",
  cookieName: "iron-examples-app-router-client-component-route-handler-swr",
  cookieOptions: {
    // secure only works in `https` environments
    // if your localhost is not on `https`, then use: `secure: process.env.NODE_ENV === "production"`
    secure: process.env.NODE_ENV === "production",
  },
};

export const checkSession = cache(
  async (req: NextRequest, res: NextResponse) => {
    const session = await getIronSessionData(req, res);

    if (!session?.username) {
      redirect("/login");
    }

    return { isAuth: true, userId: session.username };
  },
);

async function getIronSessionData(req: NextRequest, res: NextResponse) {
  return await getIronSession<SessionData>(req, res, {
    password: "0sdgfkj3857-!jdfh#937",
    cookieName: "fp-session",
  });
}
