import styled from "@emotion/styled";
import Link from "next/link";
import { useTheme } from "@emotion/react";

const Wrapper = styled(Link)`
  color: ${({ theme }) => theme.colors.white};
  line-height: 0;
  text-decoration: none;
`;

const Logo = () => {
  const theme = useTheme();
  return (
    <Wrapper href="/">
      <h1
        style={{
          color: theme.colors.white,
        }}
      >
        👨‍💻 Franco May
      </h1>
    </Wrapper>
  );
};

export default Logo;
