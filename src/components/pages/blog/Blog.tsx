import styled from "@emotion/styled";
import React from "react";
import { PostFields } from "@/utils/types";
import EditableImage from "@/components/EditableImage";
import Posts from "./Posts";

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

const Blog = ({ posts }: { posts: PostFields[] }) => {
  return (
    <>
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
      <Posts posts={posts} />
    </>
  );
};

export default Blog;
