import NextLink from "next/link";
import styled from "@emotion/styled";

const Link = styled(NextLink)<{ light?: 1 | 0 }>`
  color: ${({ theme, light }) =>
    light ? theme.colors.lightBlue : theme.colors.link.text};
  text-decoration: none;
  :hover {
    text-decoration: underline;
    text-decoration-color: ${({ theme, light }) =>
      light ? theme.colors.lightBlue : theme.colors.link.text};
  }
`;

export default Link;
