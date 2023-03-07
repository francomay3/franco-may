import { anyOf } from "@/utils/generalUtils";
import styled from "@emotion/styled";

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

const Component = ({ tags, isEditing, onChange }) => {
  return (
    <Tags>
      {tags.map((tag) => (
        <Tag key={tag}>{tag}</Tag>
      ))}
    </Tags>
  );
};

export default Component;
