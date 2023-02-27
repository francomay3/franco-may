import styled from "@emotion/styled";
import Link from "next/link";

const Wrapper = styled(Link)`
  color: ${({ theme }) => theme.colors.white};
  line-height: 0;
  text-decoration: none;
`;

const Logo = () => {
  return (
    <Wrapper href="/">
      <h1>Franco May</h1>
    </Wrapper>
  );
};

export default Logo;
