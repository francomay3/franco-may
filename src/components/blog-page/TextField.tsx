import styled from "@emotion/styled";
import { memo } from "react";

const TextField = ({ content, isEditing, onChange, as, name }) => {
  const StyledTextField = styled(as)``;
  const handleBlur = (e) => {
    const targetValue = e.target.innerHTML;
    onChange(targetValue === "" ? "Untitled" : targetValue);
  };
  return (
    <StyledTextField
      onBlur={handleBlur}
      contentEditable={isEditing}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );

  // use the as prop to determine the element type
  // https://emotion.sh/docs/styled#changing-the-rendered-tag-type
};

export default TextField;
