import Image from "next/image";
import styled from "@emotion/styled";
import Layout from "../Layout";
import { useAuth } from "@/providers/AuthProvider";

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
  align-items: center;
`;

const GoogleLogo = styled(Image)`
  cursor: pointer;
`;

function LoggedOut() {
  const { logIn } = useAuth();
  return (
    <Layout>
      <ContentWrapper>
        <h1>Hi man, welcome back</h1>
        <h3>click on the Google logo to log in</h3>
        <GoogleLogo
          alt="log in with google"
          height={100}
          onClick={() => logIn()}
          src="/googleLogo.png"
          width={100}
        />
      </ContentWrapper>
    </Layout>
  );
}

export default LoggedOut;
