import Image from "next/image";
import styled from "@emotion/styled";
import Layout from "../Layout";
// import { useAuth } from "@/providers/AuthProvider";
import Link from "@/components/design-system/Link";

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
  align-items: center;
`;

const TrumpWrong = styled.div`
  width: 320px;
  aspect-ratio: 1.6/1;
  position: relative;
  border-radius: ${({ theme }) => theme.borderRadius[4]};
  overflow: hidden;
`;

function NotAllowedUser() {
  // const { logOut } = useAuth();
  return (
    <Layout>
      <ContentWrapper>
        <TrumpWrong>
          <Image
            alt="trumpWrong"
            fill
            objectFit="cover"
            src="/images/trumpWrong.gif"
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
