import * as React from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import PersonIcon from "@mui/icons-material/Person";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";

export default function User() {
  // should only trigger re-renders upon changes to context.user
  // https://ui.docs.amplify.aws/react/connected-components/authenticator/advanced#prevent-re-renders
  const { user, signOut, toSignUp, toResetPassword } = useAuthenticator(
    (context) => [context.user],
  );

  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
      <Avatar sx={{ width: 32, height: 32 }}>
        <PersonIcon sx={{ width: 24, height: 24 }} />
      </Avatar>

      <div>
        <p>{user?.username}</p>
      </div>
    </Stack>
  );
}
