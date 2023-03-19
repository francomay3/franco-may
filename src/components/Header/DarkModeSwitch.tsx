import { useState } from "react";
import styled from "@emotion/styled";
import Icon from "@/components/design-system/Icon";
import { AnimatePresence, motion } from "framer-motion";

const SwitchWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  & svg {
    color: ${({ theme }) => theme.colors.white};
    font-size: 1.3rem;
  }
`;
const DarkModeSwitch = () => {
  const [enabled, setEnabled] = useState(false);

  return (
    <SwitchWrapper onClick={() => setEnabled((prev) => !prev)}>
      <AnimatePresence mode="wait">
        {enabled && (
          <motion.div
            initial={{ opacity: 0, x: "-20%" }}
            animate={{ opacity: 1, x: "0%" }}
            exit={{ opacity: 0, x: "20%" }}
            transition={{ duration: 0.1 }}
            key="sun"
          >
            <Icon id="sun" />
          </motion.div>
        )}
        {!enabled && (
          <motion.div
            initial={{ opacity: 0, x: "-20%" }}
            animate={{ opacity: 1, x: "0%" }}
            exit={{ opacity: 0, x: "20%" }}
            transition={{ duration: 0.1 }}
            key="moon"
          >
            <Icon id="moon" />
          </motion.div>
        )}
      </AnimatePresence>
    </SwitchWrapper>
  );
};

export default DarkModeSwitch;
