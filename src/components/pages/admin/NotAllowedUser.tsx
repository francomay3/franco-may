import Image from "next/image";
import styled from "@emotion/styled";
import UserData from "./UserData";
import { Link } from "@/components/design-system";

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
    <>
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
        <UserData />
      </ContentWrapper>
    </>
  );
}

export default NotAllowedUser;
