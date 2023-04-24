import { ReactNode, CSSProperties } from "react";
import styled from "@emotion/styled";
import { Colors } from "@/utils/types";

const Wrapper = styled.button<{ color: Colors }>`
  width: fit-content;
  display: inline-block;
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
  style?: CSSProperties;
}

const Button = ({
  children,
  onClick,
  color = "blue",
  style = {},
}: ButtonProps) => {
  return (
    <Wrapper color={color} onClick={onClick} style={style}>
      {children}
    </Wrapper>
  );
};

export default Button;
