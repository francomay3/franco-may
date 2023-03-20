import styled from "@emotion/styled";
import { Menu } from "@headlessui/react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "@emotion/react";
import Logo from "./Logo";
import DarkModeSwitch from "./DarkModeSwitch";
import Icon from "@/components/design-system/Icon";

const Wrapper = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.darkGrey};
  padding-inline: ${({ theme }) => theme.spacing[4]};
  height: ${({ theme }) => theme.spacing.aLot};
  z-index: 2;
`;

const Nav = styled.nav`
  display: none;
  ${({ theme }) => theme.mobile} {
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
  background-color: ${({ theme }) => theme.colors.darkGrey};
  display: flex;
  flex-direction: column;
  /* position: absolute;
  right: 0;
  left: 0; */
  width: 100%;
  top: ${({ theme }) => theme.spacing.aLot};
  padding: ${({ theme }) => theme.spacing[4]};
  padding-bottom: ${({ theme }) => theme.spacing[1]};
  &:focus {
    outline: none;
  }
  z-index: 1;
`;

const Item = styled(Link)<{ active: boolean }>`
  padding-block: ${({ theme }) => theme.spacing[2]};
  text-decoration: none;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  border-block-start: 1px solid ${({ theme }) => theme.colors.grey};
  color: ${({ active, theme }) =>
    active ? theme.colors.grey : theme.colors.white};
`;

function MobileNav({
  navLinks,
}: {
  navLinks: { href: string; pageName: string }[];
}) {
  const theme = useTheme();
  return (
    <Wrapper>
      <Menu as={Nav} style={{ zIndex: 1 }}>
        {({ open }) => (
          <>
            <Menu.Button as={Button} style={{ width: "1rem" }}>
              {open ? <Icon id="x" /> : <Icon id="menu" />}
            </Menu.Button>
            <AnimatePresence mode="wait">
              {open && (
                <motion.div
                  animate={{ opacity: 1, y: "0%" }}
                  exit={{ opacity: 0, y: "10%" }}
                  initial={{ opacity: 0, y: "-10%" }}
                  key="mobile-nav"
                  style={{
                    position: "absolute",
                    top: theme.spacing.aLot,
                    left: 0,
                    right: 0,
                    zIndex: 1,
                  }}
                  transition={{ duration: 0.1 }}
                >
                  <Menu.Items as={Items}>
                    {navLinks.map(({ href, pageName }) => (
                      <Menu.Item key={href}>
                        {({ active }) => (
                          <Item active={active} href={href}>
                            {pageName}
                          </Item>
                        )}
                      </Menu.Item>
                    ))}
                  </Menu.Items>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </Menu>
      <Logo />
      <DarkModeSwitch />
    </Wrapper>
  );
}

export default MobileNav;
