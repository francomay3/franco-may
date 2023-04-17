import styled from "@emotion/styled";
import { uniq } from "lodash";
import { ActionPlusButton } from "../../../design-system/ActionButtons";
import Tag from "../../../design-system/Tag";
import { BlogField } from "@/utils/types";
import { useAuth } from "@/providers/AuthProvider";

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
  onChange,
  style,
}: {
  field: BlogField;
  tags: string;
  onChange: OnChange;
  style?: React.CSSProperties;
}) => {
  const { isEditing } = useAuth();
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
    <Wrapper style={style}>
      {parsedTags.map((tag) => (
        <Tag key={tag} onChange={handleChange} onDelete={deleteTag} tag={tag} />
      ))}
      {isEditing && <ActionPlusButton onClick={addTag} />}
    </Wrapper>
  );
};

export default Tags;
