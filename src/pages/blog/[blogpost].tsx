import Layout from "@/components/Layout";
import { useRouter } from "next/router";
import { getDate, anyOf } from "@/utils";
import styled from "@emotion/styled";
import ImageWithCaption from "@/components/ImageWithCaption";

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
  #blog-title {
    margin-bottom: ${({ theme }) => theme.spacing[4]};
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

const BlogPost = () => {
  const {
    query: { blogpost: id },
  } = useRouter();

  const date = getDate(new Date());
  const author = "Franco May";
  const title = "Blog Post Title";
  const tags = ["Philosophy", "A.I.", "fuck you"];
  const description = "Blog Post Description";
  const image = "https://francomay.com/images/blog-post-image.png";
  const imageCaption = "Blog Post Image Caption";
  const location = "Göteborg, Sverige";
  const content =
    "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";
  console.log({
    date,
    author,
    title,
    description,
    image,
    imageCaption,
    location,
    content,
  });
  return (
    <Layout>
      <ContentWrapper>
        <Tags>
          {tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </Tags>
        <div>
          <AuthorAndDate>
            {author} | {date}
          </AuthorAndDate>
          <h1 id="blog-title">{title}</h1>
        </div>
        <p>
          Lorem Ipsum is simply dummy text of the printing and typesetting
          industry. Lorem Ipsum has been the industry&apos;s standard dummy text
          ever since the 1500s, when an unknown printer took a galley of type
          and scrambled it to make a type specimen book. It has survived not
          only five centuries, but also the leap into electronic typesetting,
          remaining essentially unchanged. It was popularised in the 1960s with
          the release of Letraset sheets containing Lorem Ipsum passages, and
          more recently with desktop publishing software like Aldus PageMaker
          including versions of Lorem Ipsum.
        </p>
        <ImageWithCaption
          imageName={"musk.webp"}
          caption={"Elon is such a great guy."}
        />
        <p>
          Lorem Ipsum is simply dummy text of the printing and typesetting
          industry. Lorem Ipsum has been the industry&apos;s standard dummy text
          ever since the 1500s, when an unknown printer took a galley of type
          and scrambled it to make a type specimen book. It has survived not
          only five centuries, but also the leap into electronic typesetting,
          remaining essentially unchanged. It was popularised in the 1960s with
          the release of Letraset sheets containing Lorem Ipsum passages, and
          more recently with desktop publishing software like Aldus PageMaker
          including versions of Lorem Ipsum.
        </p>
      </ContentWrapper>
    </Layout>
  );
};

export default BlogPost;
