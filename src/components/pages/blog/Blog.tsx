import styled from "@emotion/styled";
import React, { useState } from "react";
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
import { ActionPlusButton } from "@/components/design-system/ActionButtons";
import Icon from "@/components/design-system/Icon";
import NewPostDialog from "@/components/NewPostDialog";
import { BlogField, PostFields } from "@/utils/types";
import EditableImage from "@/components/EditableImage";
import EditableText from "@/components/EditableText";

const AuthorAndDate = styled.p`
  color: ${({ theme }) => theme.colors.grey};
`;

const Posts = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[8]};
  gap: 2rem;
  width: 100%;
`;

const Meta = styled.article`
  width: 100%;
  gap: ${({ theme }) => theme.spacing[1]};
  display: flex;
  flex-direction: column;
`;

const Post = styled.div`
  flex: 1;
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const ImageWrapper = styled.div`
  width: 150px;
  aspect-ratio: 4/3;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.borderRadius[3]};
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
`;

const Intro = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: 5rem;
  margin-top: 2rem;
  align-items: center;
  ${({ theme }) => theme.mobile} {
    flex-direction: column;
  }
`;

const IntroImgWrapper = styled.div`
  aspect-ratio: 4/3;
  border-radius: ${({ theme }) => theme.borderRadius[3]};
  position: relative;
  overflow: hidden;
  ${({ theme }) => theme.tablet} {
    flex: 1;
  }
`;

const IntroText = styled.div`
  flex-shrink: 100;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  justify-content: center;
  ${({ theme }) => theme.tablet} {
    flex: 2;
  }
`;

const Tags = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[1]};
  a:hover {
    text-decoration: none;
  }
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

const Blog = ({ posts: InitialPosts }: { posts: PostFields[] }) => {
  const { isAdmin } = useAuth();
  const [posts, setPosts] = useState<PostFields[]>(InitialPosts);
  const [isNewPostDialogOpen, setIsNewPostDialogOpen] = useState(false);
  const theme = useTheme();

  const updatePostField = (
    slug: string,
    field: string,
    value: string | boolean
  ) => {
    const nextPosts = posts.map((post) => {
      if (post[SLUG] === slug) {
        return {
          ...post,
          [field]: value,
        };
      }
      return post;
    });
    setPosts(nextPosts);
  };

  const handleAddPost = () => {
    setIsNewPostDialogOpen(true);
  };

  const handleOnFieldChange =
    (slug: string, field: BlogField) => (nextValue: string | boolean) => {
      toast
        .promise(setPostField(slug, field, nextValue), {
          pending: `Saving ${field}`,
          success: `${field} saved!`,
          error: `Failed to save ${field}`,
        })
        .then(() => {
          updatePostField(slug, field, nextValue);
        });
    };

  return (
    <>
      <NewPostDialog
        isDialogOpen={isNewPostDialogOpen}
        setIsDialogOpen={setIsNewPostDialogOpen}
      />
      <Intro>
        <IntroImgWrapper>
          <EditableImage src="/images/jim.png" name="JimCarrey" />
        </IntroImgWrapper>
        <IntroText>
          <h1>
            <strong>Hej!</strong>
            <br />
            Welcome to my blog.
          </h1>
          <h3>
            This is where I write about anything. From technical stuff to
            philosophy. It&apos;s just a place for me to get my ideas straight.
          </h3>
        </IntroText>
      </Intro>

      <Posts>
        {isAdmin && (
          <Card
            onClick={handleAddPost}
            style={{
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
            }}
          >
            Add Post
            <ActionPlusButton onClick={handleAddPost} />
          </Card>
        )}
        {posts?.map((post) => {
          return (
            (isAdmin || post[PUBLISHED]) && (
              <Card
                key={post[SLUG]}
                style={{
                  backgroundColor: post[PUBLISHED]
                    ? "white"
                    : theme.colors.lightRed,
                }}
              >
                {isAdmin && (
                  <PublishedIconWrapper
                    isPublished={post[PUBLISHED]}
                    onClick={() =>
                      handleOnFieldChange(
                        post[SLUG],
                        PUBLISHED
                      )(!post[PUBLISHED])
                    }
                  >
                    <Icon id={post[PUBLISHED] ? "visible" : "hidden"} />
                  </PublishedIconWrapper>
                )}
                <Post>
                  <ImageWrapper>
                    <EditableImage
                      name={post[SLUG]}
                      src={
                        post[IMAGE] ||
                        "https://source.unsplash.com/random/200x200"
                      }
                      isEditingEnabled={isAdmin}
                      onSelect={({ url }) =>
                        handleOnFieldChange(post[SLUG], IMAGE)(url)
                      }
                    />
                  </ImageWrapper>
                  <Meta>
                    <Link href={`/blog/${post[SLUG]}`}>
                      <EditableText
                        value={post[TITLE]}
                        isEditingEnabled={isAdmin}
                        onChange={handleOnFieldChange(post[SLUG], TITLE)}
                        as="h1"
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
                      value={post[DESCRIPTION]}
                      isEditingEnabled={isAdmin}
                      onChange={handleOnFieldChange(post[SLUG], DESCRIPTION)}
                      as="p"
                    />
                  </Meta>
                </Post>
              </Card>
            )
          );
        })}
      </Posts>
    </>
  );
};

export default Blog;
