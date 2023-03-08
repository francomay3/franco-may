import styled from "@emotion/styled";
import { getPost } from "@/utils/postUtils";
import { useAuth } from "@/providers/AuthProvider";
import Icon from "@/components/Icon";
import { useEffect, useState, useCallback, memo } from "react";
import Tags from "./Tags";
import TextField from "./TextField";
import TextBlock from "./blocks/TextBlock";
import ImageBlock from "./blocks/ImageBlock";
import Toolbar from "./Toolbar";
import { updatePost } from "@/utils/postUtils";
import DateField from "./Date";
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
} from "@/utils/constants";

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

const Post = ({ id, ...props }) => {
  const { user, isAdmin } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [postState, setPostState] = useState(props);

  // // log the postState to the console every time it changes
  useEffect(() => {
    console.log(postState);
  }, [postState]);

  const getUpdatedPostState = (field, value) => ({
    ...postState,
    [field]: value,
  });

  useEffect(() => {
    // if (user && isAdmin) {
    if (true) {
      setIsEditing(true);
    }
  }, [user, isAdmin]);

  const updateBlockInContent = (newBlock) =>
    setPostState((prev) => {
      const newContent = prev.content.map((block) => {
        if (block.blockId === newBlock.blockId) {
          return newBlock;
        }
        return block;
      });
      setHasUnsavedChanges(true);
      return getUpdatedPostState(CONTENT, newContent);
    });

  const handleSave = () => {
    // updatePost(id, postState).then(() => {
    //   setHasUnsavedChanges(false);
    // });
    setHasUnsavedChanges(false);
  };

  const handleStateFieldChange = (field, value) => {
    setPostState(getUpdatedPostState(field, value));
    setHasUnsavedChanges(true);
  };

  const Title = () => (
    <TextField
      as="h1"
      content={postState[TITLE]}
      isEditing={isEditing}
      onChange={(value) => {
        handleStateFieldChange(TITLE, value);
      }}
    />
  );

  const Author = () => (
    <TextField
      as="span"
      content={postState[AUTHOR]}
      isEditing={isEditing}
      onChange={(value) => {
        handleStateFieldChange(AUTHOR, value);
      }}
    />
  );

  return (
    <Wrapper>
      {isEditing && (
        <Toolbar hasUnsavedChanges={hasUnsavedChanges} save={handleSave} />
      )}
      <Tags tags={postState[TAGS]} isEditing={isEditing} onChange={() => {}} />
      <AuthorAndDate>
        <Author /> |{" "}
        <DateField
          date={postState[CREATED_AT]}
          isEditing={isEditing}
          onChange={(value) => {
            handleStateFieldChange(CREATED_AT, value);
          }}
        />
      </AuthorAndDate>
      <Title />

      {postState[CONTENT].map((block) => {
        switch (block.type) {
          case "text":
            return (
              <TextBlock
                key={block.blockId}
                isEditing={isEditing}
                block={block}
                onChange={updateBlockInContent}
              />
            );
          case "image":
            return (
              <ImageBlock
                key={block.blockId}
                block={block}
                isEditing={isEditing}
                onChange={updateBlockInContent}
              />
            );
          default:
            return null;
        }
      })}
    </Wrapper>
  );
};

export default Post;
