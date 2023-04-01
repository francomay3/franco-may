import NextLink from "next/link";
import styled from "@emotion/styled";

const Link = styled(NextLink)<{ light?: 1 | 0 }>`
  color: ${({ theme, light }) =>
    light ? theme.colors.white : theme.colors.blue};

  text-decoration: ${({ light }) => (light ? "underline" : "none")};
  cursor: pointer;
  :hover {
    text-decoration: underline;
    color: ${({ theme }) => theme.colors.lightblue};
  }
  transition: color 0.1s ease-in-out;
`;

export default Link;
