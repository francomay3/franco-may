import styled from "@emotion/styled";
import { useTheme } from "@emotion/react";
import Link from "next/link";
import { ActionMinusButton } from "./ActionButtons";
import WrappIf from "./WrappIf";
import { useAuth } from "@/providers/AuthProvider";

const Wrapper = styled.div`
  display: inline-flex;
  gap: 0.5rem;
  flex-direction: row;
  color: white;
  border-radius: ${({ theme }) => theme.borderRadius[4]};
  padding-block: 0.25rem;
  padding-inline: 0.5rem;
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

  const tagColor = tagColors[getIntegerFromString(tag, tagColors.length)];

  return (
    <WrappIf
      Wrapper={Link}
      condition={!isEditing}
      wrapperProps={{ href: `/blog/tag/${tag}` }}
    >
      <Wrapper color={tagColor} key={tag}>
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
    </WrappIf>
  );
};

export default Tag;
