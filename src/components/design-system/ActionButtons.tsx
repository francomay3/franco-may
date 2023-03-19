import { CSSProperties } from "react";
import styled from "@emotion/styled";
import { useTheme } from "@emotion/react";
import Icon from "./Icon";
import { theme } from "@/providers/Theme";

const Wrapper = styled.div`
  flex-shrink: 0;
  height: 1.5rem;
  width: 1.5rem;
  border-radius: 50%;
  display: flex;
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

export const PlusButton = ({
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
      color={theme.colors.darkGreen}
      onClick={onClick}
    >
      <Icon id="plus" />
    </Wrapper>
  );
};

export const MinusButton = ({
  className,
  onClick,
  style,
}: {
  className?: string;
  onClick: () => void;
  style?: CSSProperties;
}) => (
  <Wrapper
    className={className}
    color={theme.colors.red}
    onClick={onClick}
    style={style}
  >
    <Icon id="minus" />
  </Wrapper>
);

export const MoveButton = ({ className }: { className?: string }) => (
  <Wrapper className={className} color={theme.colors.darkBlue}>
    <Icon id="move" />
  </Wrapper>
);

export const EditButton = ({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) => (
  <Wrapper className={className} color={theme.colors.darkBlue} style={style}>
    <Icon id="edit" />
  </Wrapper>
);