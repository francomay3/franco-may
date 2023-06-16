import styled from "@emotion/styled";

export const Stack = styled.div<{ gap?: string }>`
  display: flex;
  flex-direction: column;
  gap: ${({ gap }) => gap || "0.5rem"};
`;

export const Inline = styled.div<{ gap?: string }>`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${({ gap }) => gap || "0.5rem"};
`;

export const Center = styled.div<{ padding?: string }>`
  align-items: center;
  display: flex;
  justify-content: center;
  ${({ padding }) => (padding ? `padding: ${padding}` : "")};
`;
