import { uniq } from "lodash";
import { ActionPlusButton } from "../../../design-system/ActionButtons";
import { BlogField } from "@/utils/types";
import { useAuth } from "@/providers/AuthProvider";
import { TAGS } from "@/utils/constants";
import { Inline, Tag } from "@/components/design-system";

const NEW_TAG = "new tag";

const formatTags = (tags: string[]) =>
  uniq(
    tags.sort((a, b) => {
      if (a === NEW_TAG) return 1;
      if (b === NEW_TAG) return -1;
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    })
  );

type OnChange = (field: BlogField, value: string[]) => void;

const Tags = ({
  tags,
  onChange,
  style,
}: {
  tags: string[];
  onChange: OnChange;
  style?: React.CSSProperties;
}) => {
  const { isEditing } = useAuth();

  const deleteTag = (tag: string) => {
    onChange(TAGS, formatTags(tags.filter((t) => t !== tag)));
  };

  const addTag = () => {
    onChange(TAGS, formatTags([...tags, NEW_TAG]));
  };

  const handleChange = (newTag: string, oldTag: string) => {
    if (newTag === NEW_TAG) {
      deleteTag(NEW_TAG);
      return;
    }
    if (oldTag === newTag) return;
    onChange(TAGS, formatTags([...tags.filter((t) => t !== oldTag), newTag]));
  };

  return (
    <Inline style={style}>
      {tags.map((tag) => (
        <Tag key={tag} onChange={handleChange} onDelete={deleteTag} tag={tag} />
      ))}
      {isEditing && <ActionPlusButton onClick={addTag} />}
    </Inline>
  );
};

export default Tags;
