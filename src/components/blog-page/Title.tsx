import styled from "@emotion/styled";

const Component = ({ children, isEditing, onChange }) => {
  return (
    <h1 id="blog-title" contentEditable={isEditing}>
      {children}
    </h1>
  );
};

export default Component;
