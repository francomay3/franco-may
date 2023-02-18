import styled from "@emotion/styled";
import { anyOf } from "@/utils";

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

const Wraper = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const Tags = ({ tags }: { tags: string[] }) => {
  return (
    <Wraper>
      {tags.map((tag) => (
        <Tag key={tag}>{tag}</Tag>
      ))}
    </Wraper>
  );
};
