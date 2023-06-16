import styled from "@emotion/styled";
import { Link } from "@/components/design-system";

const Wrapper = styled.footer`
  border-top: 1px solid ${({ theme }) => theme.footer.borderColor};
  align-items: center;
  text-align: center;
  background-color: ${({ theme }) => theme.footer.backgroundColor};
  color: ${({ theme }) => theme.colors.white};
  display: flex;
  justify-content: center;
  min-height: 100px;
  flex-direction: column;
  padding: 1rem;
  gap: 1rem;
  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.white};
  }
`;

const Footer = () => {
  return (
    <Wrapper>
      <p>
        {`© ${new Date().getFullYear()}, Made from scratch. Check out the `}
        <Link
          href="https://github.com/francomay3/franco-may"
          light={1}
          target="blank"
        >
          Source&nbsp;code
        </Link>
        {` for this site on GitHub.`}
      </p>
      <p>If you find anything shiny, feel free to steal it 😊.</p>
    </Wrapper>
  );
};

export default Footer;
