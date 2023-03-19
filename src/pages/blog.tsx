import styled from "@emotion/styled";
import React, { useState } from "react";
import { useRouter } from "next/router";
import { useTheme } from "@emotion/react";
import Layout from "@/components/Layout";
import { createPost, getPosts, setPostField } from "@/utils/postUtils";
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
import Card from "@/components/Card";
import { useAuth } from "@/providers/AuthProvider";
import { PlusButton } from "@/components/design-system/ActionButtons";
import Dialog from "@/components/design-system/Dialog";
import Button from "@/components/design-system/Button";
import Icon from "@/components/design-system/Icon";

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

const InputWrapper = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  align-items: center;
`;

const DialogContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const PublishedIconWrapper = styled.div<{ isPublished: boolean }>`
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

export async function getServerSideProps() {
  try {
    const posts = await getPosts();

    return {
      props: {
        posts,
      },
    };
  } catch (error) {
    return { props: {} };
  }
}

type Post = {
  [SLUG]: string;
  [TITLE]: string;
  [DESCRIPTION]: string;
  [CREATED_AT]: number;
  [AUTHOR]: string;
  [IMAGE]: string;
  [TAGS]: string;
  [PUBLISHED]: boolean;
};

const getJustLetters = (str: string) =>
  str.replace(/[^a-zA-Z]/g, "").toLowerCase();

const Blog = ({ posts }: { posts: Post[] }) => {
  // getPosts().then((posts) => console.log(posts));
  const { isAdmin } = useAuth();
  const [isNewPostDialogOpen, setIsNewPostDialogOpen] = useState(false);
  const [newPostSlug, setNewPostSlug] = useState("");
  const Router = useRouter();
  const theme = useTheme();

  const handleAddPost = () => {
    setIsNewPostDialogOpen(true);
  };

  return (
    <Layout>
      <Dialog
        isDialogOpen={isNewPostDialogOpen}
        setIsDialogOpen={setIsNewPostDialogOpen}
        title="Add new Post"
      >
        <DialogContent>
          <h3>
            <strong>Beware:</strong> the slug can not be modified in the future.
          </h3>
          <InputWrapper>
            <label htmlFor={SLUG}>Slug:</label>
            <input
              id={SLUG}
              onChange={(e) => setNewPostSlug(getJustLetters(e.target.value))}
              type="text"
              value={newPostSlug}
            />
            <Button
              onClick={() => {
                // TODO: handle loading, error and success states
                createPost(newPostSlug)
                  .then((result) => {
                    // eslint-disable-next-line promise/always-return
                    if (result === true) {
                      return Router.push(`/blog/${newPostSlug}`);
                    } else {
                      // eslint-disable-next-line no-console
                      console.log("error");
                    }
                  })
                  .catch((error) => {
                    // eslint-disable-next-line no-console
                    console.error(error);
                  });
              }}
            >
              Create
            </Button>
          </InputWrapper>
        </DialogContent>
      </Dialog>
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
            <PlusButton onClick={handleAddPost} />
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
                    onClick={() => {
                      // TODO: handle loading, error and success states
                      setPostField(post[SLUG], PUBLISHED, !post[PUBLISHED])
                        .then(() => {
                          return Router.reload();
                        })
                        .catch((error) => {
                          // eslint-disable-next-line no-console
                          console.error(error);
                        });
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
    </Layout>
  );
};

export default Blog;
