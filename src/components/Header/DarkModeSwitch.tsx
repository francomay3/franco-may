import { useState } from "react";
import { Switch } from "@headlessui/react";
import styled from "@emotion/styled";
import Icon from "@/components/Icon";

interface WrapperProps {
  checked: boolean;
  children: React.ReactNode;
  onChange: Function;
}

const SwitchWrapper = styled(Switch)<WrapperProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  & > span {
    color: ${({ theme }) => theme.colors.white};
  }
`;
const DarkModeSwitch = () => {
  const [enabled, setEnabled] = useState(false);

  return (
    <SwitchWrapper checked={enabled} onChange={setEnabled}>
      <Icon id={enabled ? "dark_mode" : "light_mode"} />
    </SwitchWrapper>
  );
};

export default DarkModeSwitch;
