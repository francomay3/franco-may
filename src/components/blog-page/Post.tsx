import styled from "@emotion/styled";
import { useAuth } from "@/providers/AuthProvider";
import { useEffect, useState } from "react";
import Tags from "./connectedFields/Tags";
import TextField from "./connectedFields/TextField";
import DateField from "./connectedFields/Date";
import Toolbar from "./Toolbar";
import {
  CREATED_AT,
  UPDATED_AT,
  CONTENT,
  TITLE,
  AUTHOR,
  DESCRIPTION,
  LOCATION,
  TAGS,
  IMAGE,
  PUBLISHED,
} from "@/utils/constants";
import { BlogField, PostFields } from "@/utils/types";
import Content from "./connectedFields/Content";
import { updatePost } from "@/utils/postUtils";

const Wrapper = styled.div`
  width: 100%;
  max-width: 680px;
  gap: ${({ theme }) => theme.spacing[4]};
  display: flex;
  flex-direction: column;
  margin-bottom: 3.5rem;
`;

const AuthorAndDate = styled.p`
  color: ${({ theme }) => theme.colors.grey};
`;

const Post = ({ id, ...props }: PostFields) => {
  const { user, isAdmin } = useAuth();
  const [isEditingEnabled, setIsEditingEnabled] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [postState, setPostState] = useState(props);

  const getUpdatedPostState = (field: BlogField, value: string | number) => {
    return { ...postState, [field]: value };
  };

  useEffect(() => {
    if (user && isAdmin) {
      setIsEditingEnabled(true);
    }
  }, [user, isAdmin]);

  const handleSave = () => {
    updatePost(id, postState).then(() => {
      setHasUnsavedChanges(false);
    });
    setHasUnsavedChanges(false);
  };

  const handleStateFieldChange = (field: BlogField, value: string | number) => {
    setPostState(getUpdatedPostState(field, value));
    setHasUnsavedChanges(true);
  };

  return (
    <Wrapper>
      {isEditingEnabled && (
        <Toolbar
          published={postState[PUBLISHED]}
          hasUnsavedChanges={hasUnsavedChanges}
          save={handleSave}
        />
      )}
      <Tags
        tags={postState[TAGS]}
        isEditingEnabled={isEditingEnabled}
        field={TAGS}
        onChange={handleStateFieldChange}
      />
      <AuthorAndDate>
        <TextField
          as="span"
          value={postState[AUTHOR]}
          field={AUTHOR}
          isEditingEnabled={isEditingEnabled}
          onChange={handleStateFieldChange}
        />
        {" | "}
        <DateField
          date={postState[CREATED_AT]}
          field={CREATED_AT}
          isEditingEnabled={isEditingEnabled}
          onChange={handleStateFieldChange}
        />
      </AuthorAndDate>
      <TextField
        as="h1"
        value={postState[TITLE]}
        field={TITLE}
        isEditingEnabled={isEditingEnabled}
        onChange={handleStateFieldChange}
      />

      <Content
        content={postState[CONTENT]}
        field={CONTENT}
        isEditingEnabled={isEditingEnabled}
        onChange={handleStateFieldChange}
      />
    </Wrapper>
  );
};

export default Post;
