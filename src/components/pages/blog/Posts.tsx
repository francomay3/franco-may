import styled from "@emotion/styled";
import React, { useState } from "react";
import PostCard from "./PostCard";
import { PUBLISHED, SLUG } from "@/utils/constants";
import { Button, Icon } from "@/components/design-system";
import { useAuth } from "@/providers/AuthProvider";
import NewPostDialog from "@/components/pages/blog/NewPostDialog";
import { PostFields } from "@/utils/types";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  gap: 2rem;
  width: 100%;
`;

const Posts = ({ posts: InitialPosts }: { posts: PostFields[] }) => {
  const [posts, setPosts] = useState<PostFields[]>(InitialPosts);
  const [isNewPostDialogOpen, setIsNewPostDialogOpen] = useState(false);
  const { isEditing } = useAuth();

  const updatePostField = (
    field: string,
    slug: string,
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
        <Button onClick={handleAddPost}>
          <Icon id="plus" /> Create Post
        </Button>
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
