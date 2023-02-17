import { css } from "@emotion/react";
import styled from "@emotion/styled";

const Wrapper = styled.footer`
  align-items: center;
  background-color: ${({ theme }) => theme.colors.darkGrey};
  color: ${({ theme }) => theme.colors.white};
  display: flex;
  justify-content: center;
  min-height: 100px;
  a {
    color: ${({ theme }) => theme.colors.lightBlue};
  }
`;

const Footer = () => {
  return (
    <Wrapper>
      <p>
        © {new Date().getFullYear()}, Custom Build Site. Check my GitHub profile
        {` `}
        <a href="https://www.gatsbyjs.org">www.wswswef.com</a>
      </p>
    </Wrapper>
  );
};

export default Footer;
