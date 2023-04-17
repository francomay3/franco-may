import styled from "@emotion/styled";
import { useTheme } from "@emotion/react";
import { ActionMinusButton } from "./ActionButtons";
import { useAuth } from "@/providers/AuthProvider";

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

function getIntegerFromString(str: string, max: number) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % max;
}

const Tag = ({
  tag,
  onChange,
  onDelete,
}: {
  tag: string;
  onChange?: (value: string, oldValue: string) => void;
  onDelete?: (value: string) => void;
}) => {
  const { isEditing } = useAuth();
  const { colors } = useTheme();

  const tagColors = [
    colors["orange"],
    colors["green"],
    colors["lightblue"],
    colors["blue"],
    colors["violet"],
    colors["red"],
  ];

  const randomColor = tagColors[getIntegerFromString(tag, tagColors.length)];

  return (
    <Wrapper color={randomColor} key={tag}>
      <div
        contentEditable={isEditing}
        onBlur={(e) => onChange && onChange(e.target.innerText, tag)}
        suppressContentEditableWarning={true}
      >
        {tag}
      </div>
      {isEditing && (
        <ActionMinusButton onClick={() => onDelete && onDelete(tag)} />
      )}
    </Wrapper>
  );
};

export default Tag;
