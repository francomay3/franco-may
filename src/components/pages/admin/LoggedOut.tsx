import styled from "@emotion/styled";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/design-system";

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
  align-items: center;
`;

function LoggedOut() {
  const { logIn } = useAuth();
  return (
    <ContentWrapper>
      <h1>Hi man, welcome back</h1>
      <Button onClick={() => logIn()}>Log In</Button>
    </ContentWrapper>
  );
}

export default LoggedOut;
