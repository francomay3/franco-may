import styled from "@emotion/styled";
import UserData from "./UserData";
import { Button } from "@/components/design-system";
import { useAuth } from "@/providers/AuthProvider";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

function LoggedIn() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { logOut, user } = useAuth();
  return (
    <Wrapper>
      <h1>Hello Handsome</h1>
      <UserData />
      {/* <button onClick={() => logOut()}>Log Out</button> */}
      <Button onClick={() => logOut()} style={{ alignSelf: "end" }}>
        Log Out
      </Button>
    </Wrapper>
  );
}

export default LoggedIn;
