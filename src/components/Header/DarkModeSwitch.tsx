import styled from "@emotion/styled";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/design-system";
import { useDarkMode } from "@/providers/theme/Theme";

const SwitchWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  & svg {
    color: ${({ theme }) => theme.colors.white};
    font-size: 1.3rem;
  }
  cursor: pointer;
`;

const DarkModeSwitch = () => {
  const { isDark, setIsDark } = useDarkMode();

  return (
    <SwitchWrapper onClick={() => setIsDark(!isDark)}>
      <AnimatePresence mode="wait">
        {isDark && (
          <motion.div
            animate={{ opacity: 1, x: "0%" }}
            exit={{ opacity: 0, x: "20%" }}
            initial={{ opacity: 0, x: "-20%" }}
            key="sun"
            transition={{ duration: 0.1 }}
          >
            <Icon id="sun" />
          </motion.div>
        )}
        {!isDark && (
          <motion.div
            animate={{ opacity: 1, x: "0%" }}
            exit={{ opacity: 0, x: "20%" }}
            initial={{ opacity: 0, x: "-20%" }}
            key="moon"
            transition={{ duration: 0.1 }}
          >
            <Icon id="moon" />
          </motion.div>
        )}
      </AnimatePresence>
    </SwitchWrapper>
  );
};

export default DarkModeSwitch;
