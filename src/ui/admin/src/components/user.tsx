import * as React from "react";
import PersonIcon from "@mui/icons-material/Person";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import { AuthUser } from "@aws-amplify/auth";

interface UserProps {
  user: AuthUser;
  signOut?: () => void;
  toSignUp?: () => void;
  expanded?: boolean;
}

export default function User({ user, expanded }: UserProps) {
  return !expanded ? (
    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
      <Avatar sx={{ width: 32, height: 32 }}>
        {user.signInDetails?.loginId &&
          user.signInDetails?.loginId[0].toUpperCase()}
      </Avatar>
    </Stack>
  ) : (
    <Stack spacing={1} sx={{ flexBasis: "100%", alignItems: "center" }}>
      <Avatar>
        {user.signInDetails?.loginId ? (
          user.signInDetails?.loginId[0].toUpperCase()
        ) : (
          <PersonIcon />
        )}
      </Avatar>
      <div style={{ fontSize: ".7rem", flex: "1 1 100%" }}>
        {user.signInDetails?.loginId}
      </div>
    </Stack>
  );
}
