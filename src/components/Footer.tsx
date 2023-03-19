import styled from "@emotion/styled";
import Link from "@/components/design-system/Link";

const Wrapper = styled.footer`
  align-items: center;
  background-color: ${({ theme }) => theme.colors.darkGrey};
  color: ${({ theme }) => theme.colors.white};
  display: flex;
  justify-content: center;
  min-height: 100px;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing[4]};
  gap: ${({ theme }) => theme.spacing[2]};
  p {
    text-align: center;
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
