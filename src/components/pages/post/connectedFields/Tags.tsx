import styled from "@emotion/styled";
import { uniq } from "lodash";
import { PlusButton } from "../../../design-system/ActionButtons";
import Tag from "../../../design-system/Tag";
import { BlogField } from "@/utils/types";

const NEW_TAG = "new tag";

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

  const handleChange = (newTag: string, oldTag: string) => {
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

  return (
    <Wrapper>
      {parsedTags.map((tag) => (
        <Tag
          isEditingEnabled={isEditingEnabled}
          key={tag}
          onChange={handleChange}
          onDelete={deleteTag}
          tag={tag}
        />
      ))}
      {isEditingEnabled && <PlusButton onClick={addTag} />}
    </Wrapper>
  );
};

export default Tags;
