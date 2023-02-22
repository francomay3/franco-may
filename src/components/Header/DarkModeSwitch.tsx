import { useState } from "react";
import { Switch } from "@headlessui/react";
import styled from "@emotion/styled";

interface WrapperProps {
  checked: boolean;
  children: string;
  enabled: boolean;
  onChange: Function;
}

const Wrapper = styled(Switch)<WrapperProps>`
  border: 1px solid ${({ enabled }) => (enabled ? "red" : "blue")};
  border: none;
  background: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  outline: none;
  &:focus {
    outline: none;
  }
  background-color: white;
  width: 2rem;
  height: 1.3rem;
  border-radius: 2rem;
`;

const DarkModeSwitch = () => {
  const [enabled, setEnabled] = useState(false);

  return (
    <Wrapper checked={enabled} onChange={setEnabled} enabled={enabled}>
      Hej!
    </Wrapper>
  );
};

export default DarkModeSwitch;
