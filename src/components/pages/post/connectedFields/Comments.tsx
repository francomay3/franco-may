import styled from "@emotion/styled";
import { useState } from "react";
import { ActionMinusButton } from "../../../design-system/ActionButtons";
import { Comment } from "@/utils/types";
import { useAuth } from "@/providers/AuthProvider";
import { getDateAsString } from "@/utils/generalUtils";
import { Button, Label, Textarea, TextInput } from "@/components/design-system";
import { COMMENTS } from "@/utils/constants";

interface CommentsProps {
  comments: Comment[];
  onChange: (field: typeof COMMENTS, value: Comment[]) => void;
}

const Wrapper = styled.div`
  border: 1px solid red;
`;

const Comment = styled.div`
  border: 1px solid green;
`;

const Form = styled.form`
  max-width: 750px;
  display: grid;
  grid-template-columns: auto 1fr;
  grid-gap: 1rem;
  width: 100%;
  align-items: center;
  ${(props) => props.theme.mediaQueries.mobile} {
    grid-template-columns: 1fr;
    label {
      margin-bottom: -0.5rem;
    }
  }
`;

const Comments = ({ comments = [], onChange }: CommentsProps) => {
  const { isEditing } = useAuth();
  const [name, setName] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [validationError, setValidationError] = useState<string>("");

  const deleteComment = (date: number) => () => {
    onChange(
      COMMENTS,
      comments.filter((c) => c.date !== date)
    );
  };

  const addComment = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!name || !content) {
      setValidationError("Please fill out the content of the comment!");
      return;
    }
    const newComment: Comment = {
      name: name,
      date: Date.now(),
      content: content,
    };
    onChange(COMMENTS, [newComment, ...comments]);
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
        <Button onClick={addComment} type="submit" value="Submit" />
      </Form>
      {comments.map(({ name, date, content }: Comment) => {
        return (
          <Comment key={date}>
            {isEditing && <ActionMinusButton onClick={deleteComment(date)} />}
            <div>{name}</div>
            <div>{getDateAsString(date)}</div>
            <div>{content}</div>
          </Comment>
        );
      })}
    </Wrapper>
  );
};

export default Comments;
