import { ReactNode } from "react";
import styled from "@emotion/styled";

const Wrapper = styled.button`
  background-color: ${({ theme }) => theme.colors.darkBlue};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius[3]};
  padding-block: ${({ theme }) => theme.spacing[2]};
  padding-inline: ${({ theme }) => theme.spacing[3]};
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  &:hover {
    background-color: ${({ theme }) => theme.colors.blue};
  }
`;

export interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
}

const Button = ({ children, onClick }: ButtonProps) => {
  return <Wrapper onClick={onClick}>{children}</Wrapper>;
};

export default Button;
