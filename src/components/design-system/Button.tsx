import { ReactNode, CSSProperties } from "react";
import styled from "@emotion/styled";
import { Colors } from "@/utils/types";

const Wrapper = styled.button<{ color: Colors; disabled: boolean }>`
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  width: fit-content;
  display: inline-block;
  background-color: ${({ theme, color, disabled }) =>
    !disabled ? theme.colors[color] : theme.button.disabledColor};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius[3]};
  padding-block: 0.5rem;
  padding-inline: 0.75rem;
  transition: all 0.2s ease-in-out;
  &:hover {
    background-color: ${({ theme, color, disabled }) => {
      if (disabled) return theme.button.disabledColor;
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
  children?: ReactNode;
  color?: Colors;
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  style?: CSSProperties;
  type?: "button" | "submit" | "reset";
  value?: string;
  disabled?: boolean;
}

const Button = ({
  children,
  color = "blue",
  onClick,
  style = {},
  type = "button",
  value,
  disabled = false,
}: ButtonProps) => {
  return (
    <Wrapper
      color={color}
      disabled={disabled}
      onClick={!disabled ? onClick : undefined}
      style={style}
      type={type}
      value={value}
    >
      {value && !children && value}
      {children}
    </Wrapper>
  );
};

export default Button;
