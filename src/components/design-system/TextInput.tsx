import styled from "@emotion/styled";
import React from "react";

interface TextInputProps {
  name: string;
  onChange: (e: any) => void;
  value: string;
}

const StyledTextInput = styled.input`
  border: 1px solid ${(props) => props.theme.form.borderColor};
  border-radius: ${(props) => props.theme.form.borderRadius};
  background-color: ${(props) => props.theme.form.backgroundColor};
  color: ${(props) => props.theme.colors.text};
  padding: ${(props) => props.theme.form.padding};
  &:focus {
    outline: none;
    border: 1px solid ${(props) => props.theme.form.borderFocusColor};
  }
  transition: border 0.2s ease-in-out;
`;

const TextInput = ({ name, onChange, value }: TextInputProps) => {
  return (
    <StyledTextInput
      name={name}
      onChange={onChange}
      type="text"
      value={value}
    />
  );
};

export default TextInput;
