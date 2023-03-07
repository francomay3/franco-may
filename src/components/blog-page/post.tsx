import styled from "@emotion/styled";
import { getPost } from "@/utils/postUtils";
import { useAuth } from "@/providers/AuthProvider";
import Icon from "@/components/Icon";
import { useEffect, useState } from "react";
import Tags from "./Tags";
import AuthorAndDate from "./AuthorAndDate";
import Title from "./Title";
import TextBlock from "./blocks/TextBlock";
import ImageBlock from "./blocks/ImageBlock";
import Toolbar from "./Toolbar";

const Wrapper = styled.div`
  width: 100%;
  max-width: 680px;
  gap: ${({ theme }) => theme.spacing[4]};
  display: flex;
  flex-direction: column;
  margin-block: 3.5rem;
`;

export async function getServerSideProps(context: {
  params: { blogpost: any };
}) {
  const id = context.params?.blogpost;
  const post = await getPost(id);
  if (!post) {
    return {
      notFound: true,
    };
  }

  return {
    props: { post },
  };
}

type PostProps = {
  author: string;
  title: string;
  description: string;
  image: string;
  imageCaption: string;
  location: string;
  content: string;
  tags: string[];
  date: string;
};

const Post = (props: PostProps) => {
  const { author, date, description, image, location, tags, title } = props;
  // const content: contentItem[] = JSON.parse(props.content);
  const { user, isAdmin } = useAuth();
  const [content, setContent] = useState(JSON.parse(props.content));
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  useEffect(() => {
    // if (user && isAdmin) {
    if (true) {
      setIsEditing(true);
    }
  }, [user, isAdmin]);

  const updateBlockInContent = (newBlock) => {
    setContent((prev) => {
      const newContent = prev.map((block) => {
        if (block.blockId === newBlock.blockId) {
          return newBlock;
        }
        return block;
      });
      return newContent;
    });
    setHasUnsavedChanges(true);
  };

  return (
    <Wrapper>
      {isEditing && <Toolbar />}
      <Tags tags={tags} isEditing={isEditing} onChange={() => {}} />
      <AuthorAndDate isEditing={isEditing} onChange={() => {}}>
        {author || "Franco May"} | {date}
      </AuthorAndDate>
      <Title isEditing={isEditing} onChange={() => {}}>
        {title}
      </Title>
      {content.map((block) => {
        if (block.type === "text") {
          return (
            <TextBlock
              key={block.blockId}
              isEditing={isEditing}
              block={block}
              onChange={updateBlockInContent}
            />
          );
        }
        if (block.type === "image") {
          return (
            <ImageBlock
              key={block.blockId}
              block={block}
              isEditing={isEditing}
              onChange={updateBlockInContent}
            />
          );
        }
      })}
    </Wrapper>
  );
};

export default Post;
