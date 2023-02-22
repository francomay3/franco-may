import Link from "next/link";
import styled from "@emotion/styled";

const StyledLink = styled(Link)<{ light?: boolean }>`
  color: ${({ theme, light }) =>
    light ? theme.colors.lightBlue : theme.colors.link.text};
  text-decoration: none;
  :hover {
    text-decoration: underline;
    text-decoration-color: ${({ theme, light }) =>
      light ? theme.colors.lightBlue : theme.colors.link.text};
  }
`;

export default StyledLink;
