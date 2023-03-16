import styled from "@emotion/styled";
import { useTheme } from "@emotion/react";
import { uniq } from "lodash";
import { PlusButton, MinusButton } from "../ActionButtons";
import { BlogField } from "@/utils/types";

const NEW_TAG = "new tag";

const Tag = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  flex-direction: row;
  color: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius[4]};
  padding-block: ${({ theme }) => theme.spacing[1]};
  padding-inline: ${({ theme }) => theme.spacing[2]};
  align-items: center;
  justify-content: space-between;
  background-color: ${({ color }) => color};
`;

const Wrapper = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  align-items: center;
`;

const formatTags = (tags: string[]) =>
  JSON.stringify(
    uniq(
      tags.sort((a, b) => {
        if (a === NEW_TAG) return 1;
        if (b === NEW_TAG) return -1;
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
      })
    )
  );

type OnChange = (field: BlogField, value: string) => void;

const Tags = ({
  field,
  tags,
  isEditingEnabled,
  onChange,
}: {
  field: BlogField;
  tags: string;
  isEditingEnabled: boolean;
  onChange: OnChange;
}) => {
  const parsedTags: string[] = JSON.parse(tags);

  const deleteTag = (tag: string) => {
    onChange(field, formatTags(parsedTags.filter((t) => t !== tag)));
  };

  const addTag = () => {
    onChange(field, formatTags([...parsedTags, NEW_TAG]));
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>, oldTag: string) => {
    const newTag = e.target.innerText;
    if (newTag === NEW_TAG) {
      deleteTag(NEW_TAG);
      return;
    }
    if (oldTag === newTag) return;
    onChange(
      field,
      formatTags([...parsedTags.filter((t) => t !== oldTag), newTag])
    );
  };

  const { colors } = useTheme();
  const tagColors = [
    colors["orange"],
    colors["green"],
    colors["lightBlue"],
    colors["blue"],
    colors["violet"],
    colors["red"],
  ];
  return (
    <Wrapper>
      {parsedTags.map((tag, i) => (
        <Tag color={tagColors[i]} key={tag}>
          <div
            contentEditable={isEditingEnabled}
            onBlur={(e) => handleBlur(e, tag)}
          >
            {tag}
          </div>
          {isEditingEnabled && <MinusButton onClick={() => deleteTag(tag)} />}
        </Tag>
      ))}
      <PlusButton onClick={addTag} />
    </Wrapper>
  );
};

export default Tags;
