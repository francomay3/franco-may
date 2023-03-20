import { ReactNode, CSSProperties } from "react";
import styled from "@emotion/styled";
import { Stack } from "@/components/design-system";

const Wrapper = styled.div`
  background-color: white;
  border-radius: ${({ theme }) => theme.borderRadius[3]};
  padding: ${({ theme }) => theme.spacing[3]};
  box-shadow: ${({ theme }) => theme.shadows[3]};
  justify-content: center;
  position: relative;
  display: inline-flex;
  width: fit-content;
`;

const Title = styled.h3`
  font-weight: 600;
  margin-bottom: ${({ theme }) => theme.spacing[2]};
  display: block;
`;

const Card = ({
  children,
  onClick,
  style,
  title,
}: {
  onClick?: () => void;
  children: ReactNode;
  style?: CSSProperties;
  title?: string;
}) => {
  return (
    <Wrapper onClick={onClick} style={style}>
      <Stack>
        {title && <Title>{title}</Title>}
        {children}
      </Stack>
    </Wrapper>
  );
};

export default Card;
