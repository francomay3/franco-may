import styled from "@emotion/styled";
import { useEffect, useState } from "react";
import Tags from "./connectedFields/Tags";
import TextField from "./connectedFields/TextField";
import DateField from "./connectedFields/Date";
import Toolbar from "./Toolbar";
import Content from "./connectedFields/content/Content";
import {
  CREATED_AT,
  CONTENT,
  TITLE,
  AUTHOR,
  TAGS,
  PUBLISHED,
  SLUG,
} from "@/utils/constants";
import { BlogField, PostFields } from "@/utils/types";
import { useAuth } from "@/providers/AuthProvider";
import { setPostField, updatePost } from "@/utils/postUtils";
import { Container } from "@/components/design-system";

const Wrapper = styled(Container)`
  display: flex;
  justify-content: center;
`;

const Article = styled.article<{ isEditingEnabled: boolean }>`
  width: 100%;
  gap: ${({ theme }) => theme.spacing[4]};
  display: flex;
  flex-direction: column;
  margin-block: 3.5rem;
  & [contenteditable="true"] {
    ${({ isEditingEnabled }) =>
      isEditingEnabled && "border: 2px solid transparent;"}
    outline: none;
    border-radius: ${({ theme }) => theme.borderRadius[3]};
    &:hover {
      border: 2px solid ${({ theme }) => theme.colors.lightblue};
      cursor: pointer;
    }
    &:focus {
      border: 2px solid ${({ theme }) => theme.colors.darkblue};
      cursor: text;
    }
  }
  ${({ theme }) => theme.mediaQueries.tablet} {
    margin-block-start: 1rem;
  }
  ${({ theme }) => theme.mediaQueries.mobile} {
    margin-block-start: 0rem;
  }
`;

const AuthorAndDate = styled.p`
  color: ${({ theme }) => theme.colors.grey} !important;
  text-align: end;
`;

const Post = ({ ...props }: PostFields) => {
  const { isAdmin } = useAuth();
  const [isEditingEnabled, setIsEditingEnabled] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [postState, setPostState] = useState(props);

  const getUpdatedPostState = (
    field: BlogField,
    value: string | number | boolean
  ) => {
    return { ...postState, [field]: value };
  };

  useEffect(() => {
    if (isAdmin) {
      setIsEditingEnabled(true);
    }
  }, [isAdmin]);

  const handleSave = async () => {
    await updatePost(props[SLUG], postState);
    setHasUnsavedChanges(false);
  };

  const handleStateFieldChange = (field: BlogField, value: string | number) => {
    setPostState(getUpdatedPostState(field, value));
    setHasUnsavedChanges(true);
  };

  return (
    <Wrapper>
      <Article isEditingEnabled={isEditingEnabled}>
        {isEditingEnabled && (
          <Toolbar
            hasUnsavedChanges={hasUnsavedChanges}
            onPublish={async () => {
              await setPostField(props[SLUG], PUBLISHED, !postState[PUBLISHED]);
              setPostState(
                getUpdatedPostState(PUBLISHED, !postState[PUBLISHED])
              );
            }}
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
          style={{
            marginTop: "2rem",
          }}
          value={postState[TITLE]}
        />

        <Content
          content={postState[CONTENT]}
          field={CONTENT}
          isEditingEnabled={isEditingEnabled}
          onChange={handleStateFieldChange}
        />
      </Article>
    </Wrapper>
  );
};

export default Post;
