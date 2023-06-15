import styled from "@emotion/styled";
import { useState } from "react";
import { ActionMinusButton } from "../../../design-system/ActionButtons";
import { Comment } from "@/utils/types";
import { useAuth } from "@/providers/AuthProvider";
import { getDateAsString } from "@/utils/generalUtils";
import { Button, Label, Textarea, TextInput } from "@/components/design-system";
import { COMMENTS } from "@/utils/constants";
import { deleteComment, createComment } from "@/utils/postUtils";

interface CommentsProps {
  comments: Comment[];
  onChange: (field: typeof COMMENTS, value: Comment[]) => void;
  slug: string;
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Form = styled.form`
  max-width: 750px;
  display: grid;
  grid-template-columns: auto 1fr;
  grid-gap: 1rem;
  width: 100%;
  align-items: center;
  ${(props) => props.theme.mediaQueries.onlyMobile} {
    grid-template-columns: 1fr;
    label {
      margin-bottom: -0.5rem;
    }
  }
`;

const ImageNameAndDate = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1rem;

  div {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    p {
      margin: 0;
    }
  }
`;

const Comment = styled.div`
  border-left: 1px solid ${({ theme }) => theme.colors.grey6};
  padding-inline-start: 1rem;
  padding-top: 1rem;
`;

const Comments = ({ comments = [], onChange, slug }: CommentsProps) => {
  const { isEditing } = useAuth();
  const [name, setName] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [validationError, setValidationError] = useState<string>("");

  const handleDeleteComment = (date: number) => () => {
    deleteComment(slug, date)
      .then(() => {
        return onChange(
          COMMENTS,
          comments.filter((c) => c.date !== date)
        );
      })
      .catch((err) => err);
  };

  const handleCreateComment = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!name || !content) {
      setValidationError("Please fill all the fields!");
      return;
    }
    const newComment: Comment = {
      name: name,
      date: Date.now(),
      content: content,
    };
    createComment(slug, newComment)
      .then(() => {
        onChange(COMMENTS, [...comments, newComment]);
        setName("");
        setContent("");
        return setValidationError("");
      })
      .catch((err) => err);
  };

  return (
    <Wrapper>
      <h2>Leave a comment!</h2>
      {validationError && <p>{validationError}</p>}
      <Form>
        <Label htmlFor="name">Your name</Label>
        <TextInput
          name="name"
          onChange={(e) => setName(e.target.value)}
          value={name}
        />
        <Label htmlFor="content">Content</Label>
        <Textarea
          name="content"
          onChange={(e) => setContent(e.target.value)}
          style={{
            height: "5rem",
          }}
          value={content}
        />
        <Button onClick={handleCreateComment} type="submit" value="Submit" />
      </Form>
      {comments.map(({ name, date, content }: Comment) => {
        return (
          <Comment key={date}>
            {isEditing && (
              <ActionMinusButton onClick={handleDeleteComment(date)} />
            )}
            <ImageNameAndDate>
              <span
                style={{
                  marginBlock: "auto",
                  fontSize: "2rem",
                }}
              >
                👤
              </span>
              <div>
                <p style={{ margin: 0 }}>{name}</p>
                <p style={{ color: "grey", margin: 0 }}>
                  {getDateAsString(date)}
                </p>
              </div>
            </ImageNameAndDate>
            <p>{content}</p>
          </Comment>
        );
      })}
    </Wrapper>
  );
};

export default Comments;
