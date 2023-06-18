import UserData from "./UserData";
import { Button, Stack } from "@/components/design-system";
import { useAuth } from "@/providers/AuthProvider";

function LoggedIn() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { logOut } = useAuth();
  return (
    <Stack gap="1rem">
      <h1>Hello Handsome</h1>
      <UserData />
      <Button onClick={() => logOut()} style={{ alignSelf: "end" }}>
        Log Out
      </Button>
    </Stack>
  );
}

export default LoggedIn;
