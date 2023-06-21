import { ReactNode, CSSProperties } from "react";
import styled from "@emotion/styled";

const Wrapper = styled.div`
  background-color: ${({ theme }) => theme.card.backgroundColor};
  border-radius: ${({ theme }) => theme.borderRadius};
  padding: 0.75rem;
  box-shadow: ${({ theme }) => theme.shadows[3]};
  border: 1px solid ${({ theme }) => theme.card.borderColor};
`;

interface CardProps {
  onClick?: () => void;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

const Card = ({ children, onClick, style, className }: CardProps) => {
  return (
    <Wrapper className={className} onClick={onClick} style={style}>
      {children}
    </Wrapper>
  );
};

export default Card;
