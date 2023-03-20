import styled from "@emotion/styled";
import React, { useState } from "react";
import { useRouter } from "next/router";
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
import { PostFields } from "@/utils/types";

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
  & img {
    width: 150px;
    aspect-ratio: 4/3;
    object-fit: cover;
    border-radius: ${({ theme }) => theme.borderRadius[3]};
  }
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

const IntroImg = styled.div`
  background-image: url("/images/jim.png");
  background-size: cover;
  background-position: center;
  width: 300px;
  aspect-ratio: 4/3;
  object-fit: cover;
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

const Blog = ({ posts }: { posts: PostFields[] }) => {
  const { isAdmin } = useAuth();
  const [isNewPostDialogOpen, setIsNewPostDialogOpen] = useState(false);
  const Router = useRouter();
  const theme = useTheme();

  const handleAddPost = () => {
    setIsNewPostDialogOpen(true);
  };

  return (
    <>
      <NewPostDialog
        isDialogOpen={isNewPostDialogOpen}
        setIsDialogOpen={setIsNewPostDialogOpen}
      />
      <Intro>
        <IntroImg />
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
                    onClick={async () => {
                      const settingToPublished = !post[PUBLISHED];
                      await toast.promise(
                        setPostField(post[SLUG], PUBLISHED, !post[PUBLISHED]),
                        {
                          pending: settingToPublished
                            ? "Publishing"
                            : "Unpublishing",
                          success: settingToPublished
                            ? "Published"
                            : "Unpublished",
                          error: settingToPublished
                            ? "Failed to publish"
                            : "Failed to unpublish",
                        }
                      );
                      // TODO: handle state instead of reloading
                      Router.reload();
                    }}
                  >
                    <Icon id={post[PUBLISHED] ? "visible" : "hidden"} />
                  </PublishedIconWrapper>
                )}
                <Post>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="post-image"
                    src={
                      post[IMAGE] ||
                      "https://source.unsplash.com/random/200x200"
                    }
                  />
                  <Meta>
                    <Link href={`/blog/${post[SLUG]}`}>
                      <h1 dangerouslySetInnerHTML={{ __html: post[TITLE] }} />
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
                    <p
                      dangerouslySetInnerHTML={{ __html: post[DESCRIPTION] }}
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
