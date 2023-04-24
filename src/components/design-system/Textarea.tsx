import React from "react";
import styled from "@emotion/styled";

interface TextareaProps {
  name: string;
  onChange: (e: any) => void;
  value: string;
  style?: React.CSSProperties;
}

const StyledTextarea = styled.textarea`
  border: 1px solid ${(props) => props.theme.form.borderColor};
  border-radius: ${(props) => props.theme.form.borderRadius};
  background-color: ${(props) => props.theme.form.backgroundColor};
  color: ${(props) => props.theme.colors.text};
  resize: none;
  padding: ${(props) => props.theme.form.padding};
  &:focus {
    outline: none;
    border: 1px solid ${(props) => props.theme.form.borderFocusColor};
  }
  transition: border 0.2s ease-in-out;
`;

const Textarea = ({ name, onChange, value, style }: TextareaProps) => {
  return (
    <StyledTextarea
      name={name}
      onChange={onChange}
      style={style}
      value={value}
    />
  );
};

export default Textarea;
