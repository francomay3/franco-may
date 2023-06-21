import Image from "next/image";
import styled from "@emotion/styled";
import UserData from "./UserData";
import { Link, Stack } from "@/components/design-system";

const TrumpWrong = styled.div`
  width: 320px;
  aspect-ratio: 1.6/1;
  position: relative;
  border-radius: ${({ theme }) => theme.borderRadius};
  overflow: hidden;
`;

function NotAllowedUser() {
  return (
    <Stack gap="1rem" style={{ alignItems: "center" }}>
      <TrumpWrong>
        <Image
          alt="trumpWrong"
          fill
          objectFit="cover"
          src="/images/trumpWrong.gif"
        />
      </TrumpWrong>
      <h1 style={{ textAlign: "center" }}>You are not supposed to be here.</h1>
      <Link href="/">Go back to the home page</Link>
      <UserData />
    </Stack>
  );
}

export default NotAllowedUser;
