import styled from "@emotion/styled";

const Wrapper = styled.h1`
  color: ${({ theme }) => theme.colors.white};
  line-height: 0;
`;

const Logo = () => {
  return <Wrapper>Franco May</Wrapper>;
};

export default Logo;
