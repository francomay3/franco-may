import { ReactNode } from "react";
import styled from "@emotion/styled";
import { Colors } from "@/utils/types";

const Wrapper = styled.button<{ color: Colors }>`
  background-color: ${({ theme, color }) => theme.colors[color]};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius[3]};
  padding-block: ${({ theme }) => theme.spacing[2]};
  padding-inline: ${({ theme }) => theme.spacing[3]};
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  &:hover {
    background-color: ${({ theme, color }) => {
      const availableColors = Object.keys(theme.colors);
      const lightColor = `light${color}`;
      if (availableColors.includes(lightColor)) {
        // eslint-disable-next-line
        // @ts-ignore
        return theme.colors[lightColor];
      }
      return theme.colors[color];
    }};
  }
`;

export interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  color?: Colors;
}

const Button = ({ children, onClick, color = "blue" }: ButtonProps) => {
  return (
    <Wrapper color={color} onClick={onClick}>
      {children}
    </Wrapper>
  );
};

export default Button;
