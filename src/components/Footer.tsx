import { css } from "@emotion/react";
import styled from "@emotion/styled";

const Wrapper = styled.footer`
  align-items: center;
  background-color: ${({ theme }) => theme.colors.darkGrey};
  color: ${({ theme }) => theme.colors.white};
  display: flex;
  justify-content: center;
  min-height: 100px;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing[4]};
  a {
    color: ${({ theme }) => theme.colors.lightBlue};
  }
`;

const Footer = () => {
  return (
    <Wrapper>
      <p>
        {`© ${new Date().getFullYear()}, Made from scratch. Check out the `}
        <a href="https://github.com/francomay3/franco-may" target="blank">
          Source code
        </a>
        {` for this site on GitHub.`}
      </p>
      <p>Also, feel free to steal my code 😊.</p>
    </Wrapper>
  );
};

export default Footer;
