import { anyOf } from "@/utils/generalUtils";
import styled from "@emotion/styled";
import ImageWithCaption from "@/components/ImageWithCaption";
import { getPost } from "@/utils/postUtils";

const Wrapper = styled.div`
  width: 100%;
  max-width: 680px;
  gap: ${({ theme }) => theme.spacing[4]};
  display: flex;
  flex-direction: column;
  margin-block: 3.5rem;
  #blog-title {
    margin-top: 1.25rem;
  }
`;

const Tag = styled.span`
  color: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius[4]};
  padding-block: ${({ theme }) => theme.spacing[1]};
  padding-inline: ${({ theme }) => theme.spacing[2]};
  background-color: ${({ theme }) => {
    const { red, orange, green, lightBlue, blue, violet } = theme.colors;
    return anyOf([red, orange, green, lightBlue, blue, violet]);
  }};
`;

const Tags = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const AuthorAndDate = styled.p`
  color: ${({ theme }) => theme.colors.grey};
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

type contentItem = {
  type: "text" | "image";
  title?: string;
  caption?: string;
  data?: string;
};

const Post = (props: PostProps) => {
  const { author, date, description, image, location, tags, title } = props;
  const content: contentItem[] = JSON.parse(props.content);
  console.log(content);
  return (
    <Wrapper>
      <Tags>
        {tags.map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </Tags>
      <div>
        <AuthorAndDate>
          {author || "Franco May"} | {date}
        </AuthorAndDate>
        <h1 id="blog-title">{title}</h1>
      </div>
      {content.map(({ type, title, caption, data = "<p>no data</p>" }) =>
        type === "image" ? (
          <ImageWithCaption
            key={title}
            imageName={title}
            caption={caption}
            cloudStorage
          />
        ) : (
          <p key={data} dangerouslySetInnerHTML={{ __html: data }} />
        )
      )}
    </Wrapper>
  );
};

export default Post;
