import Layout from "../Layout";
import { useAuth } from "@/providers/AuthProvider";
import Image from "next/image";
import styled from "@emotion/styled";
import Link from "@/components/Link";

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
  align-items: center;
`;

const GoogleLogo = styled(Image)`
  cursor: pointer;
`;

const TrumpWrong = styled.div`
  width: 320px;
  aspect-ratio: 1.6/1;
  position: relative;
  border-radius: ${({ theme }) => theme.borderRadius[4]};
  overflow: hidden;
`;

function NotAllowedUser() {
  const { logOut } = useAuth();
  return (
    <Layout>
      <ContentWrapper>
        <TrumpWrong>
          <Image
            src="/images/trumpWrong.gif"
            fill
            objectFit="cover"
            alt="trumpWrong"
          />
        </TrumpWrong>
        <h1 style={{ textAlign: "center" }}>
          You are not supposed to be here.
        </h1>
        <Link href="/">Go back to the home page</Link>
      </ContentWrapper>
    </Layout>
  );
}

export default NotAllowedUser;
