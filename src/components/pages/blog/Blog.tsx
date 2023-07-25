import styled from "@emotion/styled";
import { css } from "@emotion/css";
import React from "react";
import Posts from "./Posts";
import { PostFields } from "@/utils/types";
import { EditableImage, Emphasis, Section } from "@/components/design-system";

const containerStyles = css`
  display: flex;
  flex-direction: column;
  gap: 3rem;
`;

const Intro = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
`;

const IntroText = styled.div`
  flex-shrink: 100;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  justify-content: center;
  min-width: 300px;
  flex: 1;
`;

const Blog = ({ posts }: { posts: PostFields[] }) => {
  return (
    <Section className={containerStyles}>
      <Intro>
        <EditableImage
          name="JimCarrey"
          src="/images/jim.png"
          wrapperStyles={{
            flex: 1,
            minWidth: "300px",
            maxWidth: "300px",
          }}
        />
        <IntroText>
          <h1>
            <b>
              <Emphasis>Hej!</Emphasis>
            </b>
            <br />
            Welcome to my blog.
          </h1>
          <h3>
            This is where I intend to write about anything. From technical stuff
            to philosophy. It&apos;s just a place for me to get my ideas
            straight.
          </h3>
          <h5>
            <strong>*disclaimer:</strong> I tend to write with overconfidence
            about things I have no idea about.
          </h5>
        </IntroText>
      </Intro>
      <Posts posts={posts} />
    </Section>
  );
};

export default Blog;
