import styled from "@emotion/styled";
import { useTheme } from "@emotion/react";
import { ActionMinusButton } from "./ActionButtons";

const Wrapper = styled.div`
  display: inline-flex;
  gap: ${({ theme }) => theme.spacing[2]};
  flex-direction: row;
  color: white;
  border-radius: ${({ theme }) => theme.borderRadius[4]};
  padding-block: ${({ theme }) => theme.spacing[1]};
  padding-inline: ${({ theme }) => theme.spacing[2]};
  align-items: center;
  justify-content: space-between;
  background-color: ${({ color }) => color};
`;

const Tag = ({
  tag,
  isEditingEnabled,
  onChange,
  onDelete,
}: {
  tag: string;
  isEditingEnabled?: boolean;
  onChange?: (value: string, oldValue: string) => void;
  onDelete?: (value: string) => void;
}) => {
  const { colors } = useTheme();

  const tagColors = [
    colors["orange"],
    colors["green"],
    colors["lightBlue"],
    colors["blue"],
    colors["violet"],
    colors["red"],
  ];

  const randomColor = tagColors[Math.floor(Math.random() * tagColors.length)];

  return (
    <Wrapper color={randomColor} key={tag}>
      <div
        contentEditable={isEditingEnabled}
        onBlur={(e) => onChange && onChange(e.target.innerText, tag)}
        suppressContentEditableWarning={true}
      >
        {tag}
      </div>
      {isEditingEnabled && (
        <ActionMinusButton onClick={() => onDelete && onDelete(tag)} />
      )}
    </Wrapper>
  );
};

export default Tag;
