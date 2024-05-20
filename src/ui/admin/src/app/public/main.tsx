import Nav from "@/components/nav";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { redirect } from "next/navigation";

export default function Main() {
  // should only trigger re-renders upon changes to context.user
  // https://ui.docs.amplify.aws/react/connected-components/authenticator/advanced#prevent-re-renders
  const { user, authStatus, signOut, toSignUp } = useAuthenticator(
    (context) => [context.user],
  );
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Nav
        authStatus={authStatus}
        user={user}
        signOut={signOut}
        toSignUp={toSignUp}
      />
      {authStatus === "configuring" && "Loading..."}
      {authStatus !== "authenticated" ? redirect("/") : redirect("/admin/")}
    </main>
  );
}
