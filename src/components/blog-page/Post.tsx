import styled from "@emotion/styled";
import { useEffect, useState } from "react";
import Tags from "./connectedFields/Tags";
import TextField from "./connectedFields/TextField";
import DateField from "./connectedFields/Date";
import Toolbar from "./Toolbar";
import Content from "./connectedFields/content/Content";
import {
  CREATED_AT,
  // UPDATED_AT,
  CONTENT,
  TITLE,
  AUTHOR,
  // DESCRIPTION,
  // LOCATION,
  TAGS,
  // IMAGE,
  PUBLISHED,
} from "@/utils/constants";
import { BlogField, PostFields } from "@/utils/types";
import { useAuth } from "@/providers/AuthProvider";
import { updatePost } from "@/utils/postUtils";

const Wrapper = styled.article<{ isEditingEnabled: boolean }>`
  width: 100%;
  max-width: 680px;
  gap: ${({ theme }) => theme.spacing[4]};
  display: flex;
  flex-direction: column;
  margin-bottom: 3.5rem;
  & [contenteditable="true"] {
    ${({ isEditingEnabled }) =>
      isEditingEnabled && "border: 2px solid transparent;"}
    outline: none;
    border-radius: ${({ theme }) => theme.borderRadius[3]};
    &:hover {
      border: 2px solid ${({ theme }) => theme.colors.lightBlue};
      cursor: pointer;
    }
    &:focus {
      border: 2px solid ${({ theme }) => theme.colors.darkBlue};
      cursor: text;
    }
  }
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
    updatePost(id, postState)
      .then(() => {
        setHasUnsavedChanges(false);
        return true;
      })
      .catch(() => {
        return false;
      });
    return setHasUnsavedChanges(false);
  };

  const handleStateFieldChange = (field: BlogField, value: string | number) => {
    setPostState(getUpdatedPostState(field, value));
    setHasUnsavedChanges(true);
  };

  return (
    <Wrapper isEditingEnabled={isEditingEnabled}>
      {isEditingEnabled && (
        <Toolbar
          hasUnsavedChanges={hasUnsavedChanges}
          published={postState[PUBLISHED]}
          save={handleSave}
        />
      )}
      <Tags
        field={TAGS}
        isEditingEnabled={isEditingEnabled}
        onChange={handleStateFieldChange}
        tags={postState[TAGS]}
      />
      <AuthorAndDate>
        <TextField
          as="span"
          field={AUTHOR}
          isEditingEnabled={isEditingEnabled}
          onChange={handleStateFieldChange}
          value={postState[AUTHOR]}
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
        field={TITLE}
        isEditingEnabled={isEditingEnabled}
        onChange={handleStateFieldChange}
        value={postState[TITLE]}
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
