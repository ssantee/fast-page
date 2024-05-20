import { useAuthenticator } from "@aws-amplify/ui-react";
import Nav from "@/components/nav";
import { redirect } from "next/navigation";

export default function Dashboard() {
  const { user, authStatus, signOut, toSignUp } = useAuthenticator(
    (context) => [context.user],
  );
  return authStatus === "authenticated" ? (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Nav
        authStatus={authStatus}
        user={user}
        signOut={signOut}
        toSignUp={toSignUp}
      />
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <h1>Hello Dashboard</h1>
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Some copy
        </p>
      </div>
    </main>
  ) : (
    // these don't work in this context
    redirect("/")
  );
}
