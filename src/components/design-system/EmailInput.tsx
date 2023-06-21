import React from "react";
import styled from "@emotion/styled";

interface EmailInputProps {
  name: string;
  onChange: (e: any) => void;
  value: string;
}

const StyledEmailInput = styled.input`
  border: 1px solid ${(props) => props.theme.form.borderColor};
  border-radius: ${(props) => props.theme.borderRadius};
  background-color: ${(props) => props.theme.form.backgroundColor};
  color: ${(props) => props.theme.colors.text};
  padding: ${(props) => props.theme.form.padding};
  &:focus {
    outline: none;
    border: 1px solid ${(props) => props.theme.form.borderFocusColor};
  }
  transition: border 0.2s ease-in-out;
`;

const EmailInput = ({ name, onChange, value }: EmailInputProps) => {
  return (
    <StyledEmailInput
      name={name}
      onChange={onChange}
      type="email"
      value={value}
    />
  );
};

export default EmailInput;
