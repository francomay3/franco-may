import styled from "@emotion/styled";
import Link from "next/link";
import { useRouter } from "next/router";
import { Theme } from "@emotion/react";

type ButtonProps = {
  active: boolean;
};

const Wrapper = styled.header`
  background-color: ${({ theme }) => theme.colors.darkGrey};
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  justify-content: space-between;
  a {
    color: ${({ theme }) => theme.colors.white};
    text-decoration: none;
  }
`;

const Logo = styled.h1`
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
  padding: 0;
  padding-inline-start: ${({ theme }) => theme.spacing[3]};
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

const Button = styled.li<ButtonProps>`
  height: 90%;
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.white};
  cursor: pointer;
  list-style: none;

  ${({ active, theme }) =>
    active &&
    `text-decoration: underline ${theme.colors.white}; text-underline-offset: ${theme.spacing[3]};`};
`;

const Header = () => {
  const { route } = useRouter();
  return (
    <Wrapper>
      <Link href="/">
        <Logo>Franco May</Logo>
      </Link>
      <Buttons>
        <Button active={route === "/"}>
          <Link href="/">Home</Link>
        </Button>
        <Button active={route === "/about"}>
          <Link href="/about">About Me</Link>
        </Button>
        <Button active={route === "/blog"}>
          <Link href="/blog">Blog</Link>
        </Button>
        <Button active={route === "/contact"}>
          <Link href="/contact">Contact</Link>
        </Button>
      </Buttons>
    </Wrapper>
  );
};

export default Header;
