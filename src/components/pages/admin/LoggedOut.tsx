import { useAuth } from "@/providers/AuthProvider";
import { Button, Stack } from "@/components/design-system";

function LoggedOut() {
  const { logIn } = useAuth();
  return (
    <Stack gap="1rem" style={{ alignItems: "center" }}>
      <h1>Hi man, welcome back</h1>
      <Button onClick={() => logIn()}>Log In</Button>
    </Stack>
  );
}

export default LoggedOut;
