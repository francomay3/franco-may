import styled from "@emotion/styled";
import React from "react";
import { useTheme } from "@emotion/react";
import { toast } from "react-toastify";
import { setPostField } from "@/utils/postUtils";
import {
  AUTHOR,
  CREATED_AT,
  DESCRIPTION,
  IMAGE,
  PUBLISHED,
  SLUG,
  TAGS,
  TITLE,
} from "@/utils/constants";
import { getDateAsString } from "@/utils/generalUtils";
import Link from "@/components/design-system/Link";
import Tag from "@/components/design-system/Tag";
import Card from "@/components/design-system/Card";
import { useAuth } from "@/providers/AuthProvider";
import Icon from "@/components/design-system/Icon";
import { BlogField, PostFields } from "@/utils/types";
import EditableImage from "@/components/EditableImage";
import EditableText from "@/components/EditableText";

const Tags = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[1]};
  a:hover {
    text-decoration: none;
  }
`;

const AuthorAndDate = styled.p`
  color: ${({ theme }) => theme.colors.grey};
`;

const Meta = styled.article`
  width: 100%;
  gap: ${({ theme }) => theme.spacing[1]};
  display: flex;
  flex-direction: column;
`;

const PublishedIconWrapper = styled.div<{ isPublished: boolean }>`
  cursor: pointer;
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  background-color: ${({ theme, isPublished }) =>
    isPublished ? theme.colors.blue : theme.colors.red};
  height: 2rem;
  border-radius: 50%;
  color: white;
`;

const Post = styled.div`
  flex: 1;
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
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
  const { isAdmin } = useAuth();
  const theme = useTheme();

  const handleOnFieldChange =
    (slug: string, field: BlogField) => (nextValue: string | boolean) => {
      toast
        .promise(setPostField(slug, field, nextValue), {
          pending: `Saving ${field}`,
          success: `${field} saved!`,
          error: `Failed to save ${field}`,
        })
        .then(() => {
          return updatePostField(slug, field, nextValue);
        })
        .catch(() => {
          return null;
        });
    };
  return (
    <Card
      key={post[SLUG]}
      style={{
        backgroundColor: post[PUBLISHED] ? "white" : theme.colors.lightRed,
      }}
    >
      {isAdmin && (
        <PublishedIconWrapper
          isPublished={post[PUBLISHED]}
          onClick={() =>
            handleOnFieldChange(post[SLUG], PUBLISHED)(!post[PUBLISHED])
          }
        >
          <Icon id={post[PUBLISHED] ? "visible" : "hidden"} />
        </PublishedIconWrapper>
      )}
      <Post>
        <EditableImage
          isEditingEnabled={isAdmin}
          name={post[SLUG]}
          onSelect={({ url }) => handleOnFieldChange(post[SLUG], IMAGE)(url)}
          size="small"
          src={post[IMAGE] || "https://source.unsplash.com/random/200x200"}
        />
        <Meta>
          <Link href={`/blog/${post[SLUG]}`}>
            <EditableText
              as="h1"
              isEditingEnabled={isAdmin}
              onChange={handleOnFieldChange(post[SLUG], TITLE)}
              value={post[TITLE]}
            />
          </Link>
          <Tags>
            {JSON.parse(post[TAGS]).map((tag: string) => (
              <Link href={`/blog/tags/${tag}`} key={tag}>
                <Tag tag={tag} />
              </Link>
            ))}
          </Tags>
          <AuthorAndDate>
            {post[AUTHOR]} | {getDateAsString(post[CREATED_AT])}
          </AuthorAndDate>
          <EditableText
            as="p"
            isEditingEnabled={isAdmin}
            onChange={handleOnFieldChange(post[SLUG], DESCRIPTION)}
            value={post[DESCRIPTION]}
          />
        </Meta>
      </Post>
    </Card>
  );
};

export default PostCard;
