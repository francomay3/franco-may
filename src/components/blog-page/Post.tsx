import styled from "@emotion/styled";
import { useEffect, useState } from "react";
import Card from "../design-system/Card";
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
import { setPostField, updatePost } from "@/utils/postUtils";

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

const Post = ({ slug, ...props }: PostFields) => {
  const { isAdmin } = useAuth();
  const [isEditingEnabled, setIsEditingEnabled] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [postState, setPostState] = useState(props);

  const getUpdatedPostState = (field: BlogField, value: string | number) => {
    return { ...postState, [field]: value };
  };

  useEffect(() => {
    if (isAdmin) {
      setIsEditingEnabled(true);
    }
  }, [isAdmin]);

  const handleSave = () => {
    // TODO: handle loading, error and success states
    updatePost(slug, postState)
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
    <Card style={{ width: "100%" }}>
      <Wrapper isEditingEnabled={isEditingEnabled}>
        {isEditingEnabled && (
          <Toolbar
            hasUnsavedChanges={hasUnsavedChanges}
            onPublish={() => {
              // TODO: handle loading, error and success states
              setPostField(slug, PUBLISHED, !postState[PUBLISHED])
                .then(() => {
                  return setPostState(
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    getUpdatedPostState(PUBLISHED, !postState[PUBLISHED])
                  );
                })
                .catch(() => {
                  // eslint-disable-next-line no-console
                  console.log("Error publishing post");
                });
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
          value={postState[TITLE]}
        />

        <Content
          content={postState[CONTENT]}
          field={CONTENT}
          isEditingEnabled={isEditingEnabled}
          onChange={handleStateFieldChange}
        />
      </Wrapper>
    </Card>
  );
};

export default Post;
