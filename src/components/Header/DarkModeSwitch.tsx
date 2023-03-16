import { useState } from "react";
import { Switch } from "@headlessui/react";
import styled from "@emotion/styled";
import Icon from "@/components/Icon";

interface WrapperProps {
  checked: boolean;
  children: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/ban-types
  onChange: Function;
}

const SwitchWrapper = styled(Switch)<WrapperProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  & > svg {
    color: ${({ theme }) => theme.colors.white};
    font-size: 1.3rem;
  }
`;
const DarkModeSwitch = () => {
  const [enabled, setEnabled] = useState(false);

  return (
    <SwitchWrapper checked={enabled} onChange={setEnabled}>
      {enabled ? <Icon id="moon" /> : <Icon id="sun" />}
    </SwitchWrapper>
  );
};

export default DarkModeSwitch;
