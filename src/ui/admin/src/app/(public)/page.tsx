"use client";
import "@aws-amplify/ui-react/styles.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import Nav from "@/components/nav";
import { Authenticator } from "@aws-amplify/ui-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Authenticator.Provider>
        <Nav />
      </Authenticator.Provider>
      <div>Content</div>
    </main>
  );
}
