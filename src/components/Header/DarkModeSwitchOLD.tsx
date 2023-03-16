import { useState } from "react";
import { Switch } from "@headlessui/react";
import styled from "@emotion/styled";

interface WrapperProps {
  checked: boolean;
  children: React.ReactNode;
  enabled: 1 | 0 | boolean;
  // eslint-disable-next-line @typescript-eslint/ban-types
  onChange: Function;
}

const switchSize = 1.25;
const borderWidth = switchSize / 9;
const pillSize = switchSize - borderWidth * 2;
const switchWidth = pillSize * 2 + borderWidth * 2;

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  & > p {
    color: ${({ theme }) => theme.colors.lightGrey};
  }
  font-size: 0.8rem;
  order: 3;
`;

const SwitchWrapper = styled(Switch)<WrapperProps>`
  &:focus {
    outline: none;
  }
  background: none;
  background-color: ${({ enabled, theme }) =>
    enabled ? theme.colors.grey : theme.colors.lightGrey};
  border-radius: ${switchSize}rem;
  border: ${borderWidth}rem solid transparent;
  cursor: pointer;
  height: ${switchSize}rem;
  margin: 0;
  outline: none;
  padding: 0;
  transition: background-color 0.1s linear;
  width: ${switchWidth}rem;
`;

const Pill = styled.div<{ enabled: boolean }>`
  aspect-ratio: 1;
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: 50%;
  box-shadow: 0 0 ${pillSize / 5}rem ${({ theme }) => theme.colors.black};
  left: ${({ enabled }) => (enabled ? "0" : `${pillSize}rem`)};
  position: relative;
  transition: left 0.1s linear;
  width: ${pillSize}rem;
`;

const DarkModeSwitch = () => {
  const [enabled, setEnabled] = useState(false);

  return (
    <Wrapper>
      <p>{enabled ? "dark" : "light"}</p>
      <SwitchWrapper checked={enabled} enabled onChange={setEnabled}>
        <Pill enabled={enabled} />
      </SwitchWrapper>
    </Wrapper>
  );
};

export default DarkModeSwitch;
