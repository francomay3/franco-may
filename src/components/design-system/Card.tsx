import { ReactNode, CSSProperties } from "react";
import styled from "@emotion/styled";

const Wrapper = styled.div`
  background-color: white;
  border-radius: ${({ theme }) => theme.borderRadius[3]};
  padding: ${({ theme }) => theme.spacing[3]};
  box-shadow: ${({ theme }) => theme.shadows[3]};
  display: flex;
  justify-content: center;
  position: relative;
`;

const Card = ({
  children,
  onClick,
  style,
}: {
  onClick?: () => void;
  children: ReactNode;
  style?: CSSProperties;
}) => {
  return (
    <Wrapper onClick={onClick} style={style}>
      {children}
    </Wrapper>
  );
};

export default Card;
