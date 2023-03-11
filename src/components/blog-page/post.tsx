import styled from "@emotion/styled";
import { useAuth } from "@/providers/AuthProvider";
import { useEffect, useState } from "react";
import Tags from "./Tags";
import TextField from "./TextField";
import Toolbar from "./Toolbar";
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
import Content from "./Content";

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
  const [postState, setPostStateTemp] = useState(props);
  const setPostState = (args) => {
    console.log("setPostState", args);
    setPostStateTemp(args);
  };

  // // log the postState to the console every time it changes
  useEffect(() => {
    console.log(postState);
  }, [postState]);

  const getUpdatedPostState = (field, value) => {
    return { ...postState, [field]: value };
  };

  useEffect(() => {
    // if (user && isAdmin) {
    if (true) {
      setIsEditing(true);
    }
  }, [user, isAdmin]);

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

  return (
    <Wrapper>
      {isEditing && (
        <Toolbar hasUnsavedChanges={hasUnsavedChanges} save={handleSave} />
      )}
      <Tags tags={postState[TAGS]} isEditing={isEditing} onChange={() => {}} />
      <AuthorAndDate>
        <TextField
          as="span"
          value={postState[AUTHOR]}
          isEditing={isEditing}
          onChange={(value) => {
            handleStateFieldChange(AUTHOR, value);
          }}
        />
        {" | "}
        <DateField
          date={postState[CREATED_AT]}
          isEditing={isEditing}
          onChange={(value) => {
            handleStateFieldChange(CREATED_AT, value);
          }}
        />
      </AuthorAndDate>
      <TextField
        as="h1"
        value={postState[TITLE]}
        isEditing={isEditing}
        onChange={(value) => {
          handleStateFieldChange(TITLE, value);
        }}
      />

      <Content
        content={postState[CONTENT]}
        isEditing={isEditing}
        onChange={(value) => {
          handleStateFieldChange(CONTENT, value);
        }}
      />
    </Wrapper>
  );
};

export default Post;
