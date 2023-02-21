import styled from "@emotion/styled";

const Wrapper = styled.nav`
  & > ul {
    display: flex;
    list-style: none;
    gap: ${({ theme }) => theme.spacing[4]};
    margin: 0;
    padding: 0;
  }
  ${({ theme }) => theme.mobile} {
    display: none;
  }
`;

function DesktopNav({
  navLinks,
}: {
  navLinks: { href: string; name: string }[];
}) {
  return (
    <Wrapper>
      <ul>
        {navLinks.map((link) => (
          <li key={link.href}>{link.name}</li>
        ))}
      </ul>
    </Wrapper>
  );
}

export default DesktopNav;
