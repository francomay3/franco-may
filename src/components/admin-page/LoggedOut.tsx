import Layout from "../Layout";
import { useAuth } from "@/providers/AuthProvider";
import Image from "next/image";
import styled from "@emotion/styled";

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
          src="/googleLogo.png"
          alt="log in with google"
          width={100}
          height={100}
          onClick={logIn}
        />
      </ContentWrapper>
    </Layout>
  );
}

export default LoggedOut;
