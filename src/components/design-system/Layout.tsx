import styled from "@emotion/styled";

export const Stack = styled.div<{ gap?: string }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme, gap }) =>
    gap ? theme.spacing[gap as keyof typeof theme.spacing] : theme.spacing[2]};
`;

export const Inline = styled.div<{ gap?: string }>`
  display: flex;
  flex-direction: row;
  gap: ${({ theme, gap }) =>
    gap ? theme.spacing[gap as keyof typeof theme.spacing] : theme.spacing[2]};
  flex-wrap: wrap;
`;

export const Center = styled.div<{ padding?: string }>`
  display: flex;
  justify-content: center;
  align-items: center;
  ${({ theme, padding }) =>
    padding
      ? `padding: ${theme.spacing[padding as keyof typeof theme.spacing]}`
      : ""};
`;
