import styled from "@emotion/styled";
import { useState } from "react";
import Tags from "./connectedFields/Tags";
import TextField from "./connectedFields/TextField";
import DateField from "./connectedFields/Date";
import Comments from "./connectedFields/Comments";
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
  COMMENTS,
} from "@/utils/constants";
import { BlogField, PostFields } from "@/utils/types";
import { useAuth } from "@/providers/AuthProvider";
import { setPostField, updatePost } from "@/utils/postUtils";
import { Section } from "@/components/design-system";

const Article = styled.article<{ isEditing: boolean }>`
  width: 100%;
  gap: ${({ theme }) => theme.spacing[4]};
  display: flex;
  flex-direction: column;
  margin-block: 3.5rem;
  & [contenteditable="true"] {
    ${({ isEditing }) => isEditing && "border: 2px solid transparent;"}
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
  ${({ theme }) => theme.mediaQueries.onlyTablet} {
    margin-block-start: 1rem;
  }
  ${({ theme }) => theme.mediaQueries.onlyMobile} {
    margin-block-start: 0rem;
  }
`;

const AuthorAndDate = styled.p`
  color: ${({ theme }) => theme.colors.grey} !important;
  text-align: end;
`;

const Post = ({ ...props }: PostFields) => {
  const { isEditing } = useAuth();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [postState, setPostState] = useState(props);

  const getUpdatedPostState = (
    field: BlogField,
    value: string | number | boolean
  ) => {
    return { ...postState, [field]: value };
  };

  const handleSave = async () => {
    await updatePost(props[SLUG], postState);
    setHasUnsavedChanges(false);
  };

  const handleStateFieldChange = (field: BlogField, value: any) => {
    setPostState(getUpdatedPostState(field, value));
    setHasUnsavedChanges(true);
  };

  const Sections = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: ${({ theme }) => theme.spacing[8]};
  `;

  return (
    <Sections>
      <Section>
        <Article isEditing={isEditing}>
          {isEditing && (
            <Toolbar
              hasUnsavedChanges={hasUnsavedChanges}
              onPublish={async () => {
                await setPostField(
                  props[SLUG],
                  PUBLISHED,
                  !postState[PUBLISHED]
                );
                setPostState(
                  getUpdatedPostState(PUBLISHED, !postState[PUBLISHED])
                );
              }}
              published={postState[PUBLISHED]}
              save={handleSave}
            />
          )}
          <Tags onChange={handleStateFieldChange} tags={postState[TAGS]} />
          <AuthorAndDate>
            <TextField
              as="span"
              field={AUTHOR}
              onChange={handleStateFieldChange}
              value={postState[AUTHOR]}
            />
            {" | "}
            <DateField
              date={postState[CREATED_AT]}
              field={CREATED_AT}
              onChange={handleStateFieldChange}
            />
          </AuthorAndDate>
          <TextField
            as="h1"
            field={TITLE}
            onChange={handleStateFieldChange}
            style={{
              marginTop: "2rem",
            }}
            value={postState[TITLE]}
          />

          <Content
            content={postState[CONTENT]}
            onChange={handleStateFieldChange}
          />
        </Article>
      </Section>
      <Section>
        <Comments
          comments={postState[COMMENTS]}
          onChange={handleStateFieldChange}
          slug={postState[SLUG]}
        />
      </Section>
    </Sections>
  );
};

export default Post;
