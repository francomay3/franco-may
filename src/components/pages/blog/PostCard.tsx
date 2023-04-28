import styled from "@emotion/styled";
import React, { useState } from "react";
import { useTheme } from "@emotion/react";
import DeleteModal from "./DeleteModal";
import { deletePost, setPostField } from "@/utils/postUtils";
import {
  CREATED_AT,
  DESCRIPTION,
  IMAGE,
  PUBLISHED,
  SLUG,
  TAGS,
  TITLE,
} from "@/utils/constants";
import { getDateAsString } from "@/utils/generalUtils";
import { Link, Tag, EditableImage } from "@/components/design-system";
import { useAuth } from "@/providers/AuthProvider";
import { BlogField, PostFields } from "@/utils/types";
import EditableText from "@/components/EditableText";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  ActionVisibleButton,
  ActionHiddenButton,
  ActionMinusButton,
} from "@/components/design-system";

const Tags = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[1]};
  a:hover {
    text-decoration: none;
  }
`;

const AuthorAndDate = styled.p`
  color: ${({ theme }) => theme.colors.grey} !important;
  font-size: 1rem;
`;

const Meta = styled.article`
  width: 100%;
  gap: ${({ theme }) => theme.spacing[1]};
  display: flex;
  flex-direction: column;
  ${({ theme }) => theme.mediaQueries.mobile} {
    width: 70%;
  }
`;

const PublishedIconWrapper = styled.div`
  position: absolute;
  z-index: 1;
  top: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const Post = styled.div`
  flex: 1;
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const Wrapper = styled.div<{ published: boolean }>`
  opacity: ${({ published }) => (published ? "100%" : "60%")};
  border-style: ${({ published }) => (published ? "initial" : "dashed")};
  p {
    margin: 0;
  }
`;

interface PostCardProps {
  post: PostFields;
  updatePostField: (
    slug: string,
    field: BlogField,
    value: string | boolean
  ) => void;
}

const PostCard = ({ post, updatePostField }: PostCardProps) => {
  const { isEditing } = useAuth();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const isMobile = useIsMobile();
  const theme = useTheme();

  const handleOnFieldChange =
    (slug: string, field: BlogField) => (nextValue: string | boolean) => {
      setPostField(slug, field, nextValue)
        .then(() => {
          return updatePostField(slug, field, nextValue);
        })
        .catch(() => {
          return null;
        });
    };

  const handlePublish = () =>
    handleOnFieldChange(post[SLUG], PUBLISHED)(!post[PUBLISHED]);

  return (
    <Wrapper published={post[PUBLISHED]}>
      <DeleteModal
        isDialogOpen={isDeleteModalOpen}
        onDelete={async () => {
          const result = await deletePost(post[SLUG]);
          if (result) {
            // handle delete state change
          }
        }}
        setIsDialogOpen={setIsDeleteModalOpen}
        slug={post[SLUG]}
        title={post[TITLE]}
      />
      {isEditing && (
        <PublishedIconWrapper>
          {post[PUBLISHED] ? (
            <ActionVisibleButton onClick={handlePublish} />
          ) : (
            <ActionHiddenButton onClick={handlePublish} />
          )}
          <ActionMinusButton onClick={() => setIsDeleteModalOpen(true)} />
        </PublishedIconWrapper>
      )}
      <Post>
        <EditableImage
          name={post[SLUG]}
          onSelect={({ url }) => handleOnFieldChange(post[SLUG], IMAGE)(url)}
          size="small"
          src={post[IMAGE] || "https://source.unsplash.com/random/200x200"}
          wrapperStyles={{
            width: "200px",
          }}
        />
        <Meta>
          <Link
            href={`/blog/${post[SLUG]}`}
            style={{
              width: "fit-content",
            }}
          >
            <EditableText
              as="h1"
              onChange={handleOnFieldChange(post[SLUG], TITLE)}
              style={{
                color: theme.colors.primary,
                cursor: "pointer",
              }}
              value={post[TITLE]}
            />
          </Link>
          <Tags>
            {post[TAGS].map((tag: string) => (
              <Tag key={tag} tag={tag} />
            ))}
          </Tags>
          <EditableText
            as="p"
            onChange={handleOnFieldChange(post[SLUG], DESCRIPTION)}
            style={
              isMobile
                ? {
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }
                : {}
            }
            value={post[DESCRIPTION]}
          />
          <AuthorAndDate>{getDateAsString(post[CREATED_AT])}</AuthorAndDate>
        </Meta>
      </Post>
    </Wrapper>
  );
};

export default PostCard;
