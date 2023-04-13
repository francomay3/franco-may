import styled from "@emotion/styled";
import { Menu } from "@headlessui/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "@emotion/react";
import Logo from "./Logo";
import DarkModeSwitch from "./DarkModeSwitch";
import { Icon } from "@/components/design-system";

const Wrapper = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: ${({ theme }) => theme.header.backgroundColor};
  padding-inline: ${({ theme }) => theme.spacing[4]};
  height: ${({ theme }) => theme.spacing.aLot};
  z-index: 2;
`;

const Nav = styled.nav`
  display: none;
  ${({ theme }) => theme.mediaQueries.mobile} {
    display: initial;
  }
`;

const Button = styled.button`
  display: flex;
  & > svg {
    color: ${({ theme }) => theme.colors.white};
    font-size: 1.8rem;
  }
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  outline: none;
  &:focus {
    outline: none;
  }
  order: 1;
`;

const Items = styled.div`
  background-color: ${({ theme }) => theme.header.backgroundColor};
  display: flex;
  flex-direction: column;
  width: 100vw;
  padding: ${({ theme }) => theme.spacing[4]};
  padding-block-end: ${({ theme }) => theme.spacing[1]};
  position: unset;
  &:focus {
    outline: none;
  }
  z-index: 1;
`;

const Item = styled(Link)`
  padding-block: ${({ theme }) => theme.spacing[2]};
  text-decoration: none;
  border-block-start: 1px solid ${({ theme }) => theme.header.itemBorderColor};
  color: ${({ theme }) => theme.header.activeColor};
`;

function MobileNav({
  navLinks,
}: {
  navLinks: { href: string; pageName: string }[];
}) {
  const theme = useTheme();
  return (
    <Wrapper>
      <Menu as={Nav} style={{ zIndex: 1, position: "unset" }}>
        {({ open }) => (
          <>
            <Menu.Button as={Button} style={{ width: "1rem" }}>
              {open ? <Icon id="x" /> : <Icon id="menu" />}
            </Menu.Button>
            <motion.div
              animate={{
                height: open ? "8rem" : "1px",
              }}
              style={{
                height: "1px",
                position: "absolute",
                top: theme.spacing.aLot,
                left: 0,
                right: 0,
                zIndex: 1,
                overflow: "hidden",
                borderBottom: `1px solid ${theme.header.barBorderColor}`,
              }}
              transition={{
                type: "linear",
              }}
            >
              <Menu.Items as={Items} static>
                {navLinks.map(({ href, pageName }) => (
                  <Menu.Item key={href}>
                    <Item href={href}>{pageName}</Item>
                  </Menu.Item>
                ))}
              </Menu.Items>
            </motion.div>
          </>
        )}
      </Menu>
      <Logo />
      <DarkModeSwitch />
    </Wrapper>
  );
}

export default MobileNav;
