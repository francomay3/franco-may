import styled from "@emotion/styled";
import { Menu } from "@headlessui/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "@emotion/react";
import Logo from "./Logo";
import DarkModeSwitch from "./DarkModeSwitch";
import { Icon } from "@/components/design-system";
import { useAuth } from "@/providers/AuthProvider";

const Nav = styled.nav`
  display: none;
  ${({ theme }) => theme.mediaQueries.onlyMobile} {
    display: initial;
  }
`;

const Button = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  margin: 0;
  outline: none;
  padding: 0;
  & > svg {
    color: ${({ theme }) => theme.colors.white};
    font-size: 1.8rem;
  }
  &:focus {
    outline: none;
  }
  order: 1;
`;

const Items = styled.div`
  background-color: ${({ theme }) => theme.header.backgroundColor};
  display: flex;
  flex-direction: column;
  padding-block-end: 0.25rem;
  padding: 1rem;
  position: unset;
  width: 100vw;
  &:focus {
    outline: none;
  }
  z-index: 1;
`;

const Item = styled(Link)`
  border-block-start: 1px solid ${({ theme }) => theme.header.itemBorderColor};
  color: ${({ theme }) => theme.header.activeColor};
  padding-block: 0.5rem;
  text-decoration: none;
`;

function MobileNav({
  navLinks,
}: {
  navLinks: { href: string; pageName: string }[];
}) {
  const theme = useTheme();
  const { isAdmin, setIsEditing, isEditing } = useAuth();

  return (
    <>
      <Menu as={Nav} style={{ zIndex: 1, position: "unset" }}>
        {({ open }) => (
          <>
            <Menu.Button as={Button} style={{ width: "1rem" }}>
              {open ? <Icon id="x" /> : <Icon id="menu" />}
            </Menu.Button>
            <motion.div
              animate={{
                height: open ? "auto" : "1px",
              }}
              style={{
                height: "1px",
                position: "absolute",
                top: "3rem",
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
                {isAdmin && (
                  <Menu.Item>
                    <Item
                      href={"/"}
                      onClick={(e) => {
                        e.preventDefault();
                        setIsEditing(!isEditing);
                      }}
                    >
                      {isEditing ? "Stop editing" : "edit"}
                    </Item>
                  </Menu.Item>
                )}
              </Menu.Items>
            </motion.div>
          </>
        )}
      </Menu>
      <Logo />
      <DarkModeSwitch />
    </>
  );
}

export default MobileNav;
