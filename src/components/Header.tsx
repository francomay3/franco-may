import styled from "@emotion/styled";
import Link from "next/link";

const Wrapper = styled.header`
  background-color: ${({ theme }) => theme.colors.darkGrey};
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  justify-content: space-between;
`;

const Logo = styled.h1`
  color: ${({ theme }) => theme.colors.white};
  margin-inline-start: ${({ theme }) => theme.spacing[2]};
  margin: 0;
  padding: 0;
`;

const Buttons = styled.ul`
  align-items: center;
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  justify-content: flex-end;
  margin-block: 0;
  margin-inline-end: ${({ theme }) => theme.spacing[4]};
  padding: 0;
`;

const Button = styled.li`
  color: ${({ theme }) => theme.colors.white};
  cursor: pointer;
  list-style: none;
  a {
    color: ${({ theme }) => theme.colors.white};
    text-decoration: none;
  }
`;

const Header = () => {
  return (
    <Wrapper>
      <Logo>Franco May</Logo>
      <Buttons>
        <Button>
          <Link href="/">Home</Link>
        </Button>
        <Button>
          <Link href="/about">About Me</Link>
        </Button>
        <Button>
          <Link href="/blog">Blog</Link>
        </Button>
        <Button>
          <Link href="/contact">Contact</Link>
        </Button>
      </Buttons>
    </Wrapper>
  );
};

export default Header;
