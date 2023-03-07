import { anyOf } from "@/utils/generalUtils";
import styled from "@emotion/styled";
import { memo } from "react";

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

const Tags = memo(
  styled.div`
    display: flex;
    gap: ${({ theme }) => theme.spacing[2]};
  `,
  (prevProps, nextProps) => prevProps.tag === nextProps.tag
);

const Component = ({ tags, isEditing, onChange }) => {
  const parsedTags = JSON.parse(tags);
  return (
    <Tags>
      {parsedTags.map((tag) => (
        <Tag key={tag} tag={tag}>
          {tag}
        </Tag>
      ))}
    </Tags>
  );
};

export default Component;
