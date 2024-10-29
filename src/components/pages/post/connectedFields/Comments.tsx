import styled from "@emotion/styled";
import { ActionMinusButton } from "../../../design-system/ActionButtons";
import { Comment as CommentType } from "@/utils/types";
import { useAuth } from "@/providers/AuthProvider";
import { getDateAsString } from "@/utils/generalUtils";
import { Form, Inline, Stack } from "@/components/design-system";
import { COMMENTS } from "@/utils/constants";
import { deleteComment, createComment } from "@/utils/postUtils";
interface CommentsProps {
  comments: CommentType[];
  onChange: (field: typeof COMMENTS, value: CommentType[]) => void;
  slug: string;
}

const Comment = styled.div`
  border-left: 1px solid ${({ theme }) => theme.colors.grey6};
  padding-inline-start: 1rem;
  padding-top: 1rem;
`;

const Comments = ({ comments = [], onChange, slug }: CommentsProps) => {
  const { isEditing } = useAuth();

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

  const handleCreateComment = ({
    name,
    content,
  }: {
    name: string;
    content: string;
  }) => {
    const newComment: CommentType = {
      name: name,
      date: Date.now(),
      content: content,
    };
    createComment(slug, newComment)
      .then(() => {
        return onChange(COMMENTS, [...comments, newComment]);
      })
      .catch((err) => err);
  };

  return (
    <Stack gap="1rem">
      <h2>Leave a comment!</h2>
      <Form
        fields={[
          {
            type: "text",
            label: "Your name",
            placeholder: "Your name",
            name: "name",
            required: true,
          },
          {
            type: "textarea",
            label: "Content",
            placeholder: "Content",
            name: "content",
            required: true,
          },
        ]}
        onSubmit={handleCreateComment}
      />
      {comments.map(({ name, date, content }: CommentType) => {
        return (
          <Comment key={date}>
            {isEditing && (
              <ActionMinusButton onClick={handleDeleteComment(date)} />
            )}
            <Inline gap="1rem">
              <span
                style={{
                  marginBlock: "auto",
                  fontSize: "2rem",
                }}
              >
                👤
              </span>
              <Stack gap="0.5rem">
                <p style={{ margin: 0 }}>{name}</p>
                <p style={{ color: "grey", margin: 0 }}>
                  {getDateAsString(date)}
                </p>
              </Stack>
            </Inline>
            <p>{content}</p>
          </Comment>
        );
      })}
    </Stack>
  );
};

export default Comments;
