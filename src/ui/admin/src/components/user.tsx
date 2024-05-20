import * as React from "react";
import PersonIcon from "@mui/icons-material/Person";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import { AuthUser } from "@aws-amplify/auth";

interface UserProps {
  user: AuthUser;
  signOut?: () => void;
  toSignUp?: () => void;
}

export default function User({ user }: UserProps) {
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
      <Avatar sx={{ width: 32, height: 32 }}>
        <PersonIcon sx={{ width: 24, height: 24 }} />
      </Avatar>

      <div>
        <p>{user.signInDetails?.loginId}</p>
      </div>
    </Stack>
  );
}
