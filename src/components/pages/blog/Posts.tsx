import styled from "@emotion/styled";
import React, { useState } from "react";
import PostCard from "./PostCard";
import { PUBLISHED, SLUG } from "@/utils/constants";
import { Card, ActionPlusButton } from "@/components/design-system";
import { useAuth } from "@/providers/AuthProvider";
import NewPostDialog from "@/components/pages/blog/NewPostDialog";
import { PostFields } from "@/utils/types";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[8]};
  gap: 2rem;
  width: 100%;
`;

const Posts = ({ posts: InitialPosts }: { posts: PostFields[] }) => {
  const [posts, setPosts] = useState<PostFields[]>(InitialPosts);
  const [isNewPostDialogOpen, setIsNewPostDialogOpen] = useState(false);
  const { isEditing } = useAuth();

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

  return (
    <Wrapper>
      <NewPostDialog
        isDialogOpen={isNewPostDialogOpen}
        setIsDialogOpen={setIsNewPostDialogOpen}
      />
      {isEditing && (
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
          (isEditing || post[PUBLISHED]) && (
            <PostCard
              key={post[SLUG]}
              post={post}
              updatePostField={updatePostField}
            />
          )
        );
      })}
    </Wrapper>
  );
};

export default Posts;
