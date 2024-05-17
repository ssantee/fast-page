import Nav from "@/components/nav";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import User from "@/components/user";

export default function App() {
  // should only trigger re-renders upon changes to context.user
  // https://ui.docs.amplify.aws/react/connected-components/authenticator/advanced#prevent-re-renders
  const { user, signOut, toSignUp, toResetPassword } = useAuthenticator(
    (context) => [context.user],
  );
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Nav user={user} signOut={signOut} toSignUp={toSignUp} />
      <Authenticator />
    </main>
  );
}
