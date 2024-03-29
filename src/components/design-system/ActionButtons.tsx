import { CSSProperties } from "react";
import styled from "@emotion/styled";
import { useTheme } from "@emotion/react";
import Icon from "./Icon";

const Wrapper = styled.div`
  flex-shrink: 0;
  height: 1.5rem;
  width: 1.5rem;
  border-radius: 50%;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  background-color: ${({ color }) => color};
  color: ${({ theme }) => theme.colors.white};
  box-shadow: ${({ theme }) => theme.shadows[1]};
  cursor: pointer;
  transition: opacity 0.1s, box-shadow 0.1s, transform 0.1s;
  &:hover {
    transform: scale(1.05);
    box-shadow: ${({ theme }) => theme.shadows[2]};
  }
`;

export const ActionPlusButton = ({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) => {
  const theme = useTheme();

  return (
    <Wrapper
      className={className}
      color={theme.colors.success}
      onClick={onClick}
    >
      <Icon id="plus" />
    </Wrapper>
  );
};

export const ActionMinusButton = ({
  className,
  onClick,
  style,
}: {
  className?: string;
  onClick: () => void;
  style?: CSSProperties;
}) => {
  const theme = useTheme();

  return (
    <Wrapper
      className={className}
      color={theme.colors.danger}
      onClick={onClick}
      style={style}
    >
      <Icon id="minus" />
    </Wrapper>
  );
};

export const ActionMoveButton = ({ className }: { className?: string }) => {
  const theme = useTheme();
  return (
    <Wrapper className={className} color={theme.colors.info}>
      <Icon id="move" />
    </Wrapper>
  );
};

export const ActionEditButton = ({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) => {
  const theme = useTheme();
  return (
    <Wrapper className={className} color={theme.colors.info} style={style}>
      <Icon id="edit" />
    </Wrapper>
  );
};

export const ActionVisibleButton = ({
  className,
  onClick,
}: {
  className?: string;
  onClick: () => void;
}) => {
  const theme = useTheme();
  return (
    <Wrapper className={className} color={theme.colors.info} onClick={onClick}>
      <Icon id="visible" />
    </Wrapper>
  );
};

export const ActionHiddenButton = ({
  className,
  onClick,
}: {
  className?: string;
  onClick: () => void;
}) => {
  const theme = useTheme();
  return (
    <Wrapper className={className} color={theme.colors.grey} onClick={onClick}>
      <Icon id="hidden" />
    </Wrapper>
  );
};
