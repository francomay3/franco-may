import styled from "@emotion/styled";
import { useTheme } from "@emotion/react";
import Icon from "../Icon";
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
  box-shadow: 0 0 0 0px rgb(0 0 0 / 0%), 1px 2px 4px rgb(0 0 0 / 30%);
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.1s linear;
  &:hover {
    opacity: 1;
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
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) => (
  <Wrapper className={className} color={theme.colors.red} onClick={onClick}>
    <Icon id="minus" />
  </Wrapper>
);

export const MoveButton = ({ className }: { className?: string }) => (
  <Wrapper className={className} color={theme.colors.darkBlue}>
    <Icon id="move" />
  </Wrapper>
);