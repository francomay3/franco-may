import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { css } from "@emotion/css";
import { useTheme } from "@emotion/react";
import { Stack } from "../Layout";
import { Theme } from "@/utils/types";

interface TextInputProps {
  hasError?: boolean;
  name: string;
  required?: boolean;
  ruleExplanation?: string;
  setErrors?: (errors: any) => void;
  type?: string;
  validationRule?: string | RegExp;
  handleChange: ({ name, value }: { name: string; value: string }) => void;
  value: string;
}

const getBorderColor = (theme: Theme, hasError: boolean, touched: boolean) => {
  if (hasError) return theme.colors.danger;
  if (!hasError && touched) return theme.colors.success;
  return theme.form.borderColor;
};

const inputStyles = ({ theme, hasError, touched }: any) => css`
  background-color: ${theme.form.backgroundColor};
  border-radius: ${theme.borderRadius};
  border: 1px solid ${getBorderColor(theme, hasError, touched)};
  color: ${theme.colors.text};
  padding: ${theme.form.padding};
  resize: vertical;

  &:focus {
    outline: none;
    border: 1px solid ${theme.form.borderFocusColor};
  }
  transition: border 0.2s ease-in-out;
`;

const TextInput = ({
  handleChange,
  hasError,
  name,
  required = false,
  ruleExplanation,
  setErrors,
  type = "text",
  validationRule,
  value,
}: TextInputProps) => {
  const [errorText, setErrorText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const theme = useTheme();
  useEffect(() => {
    const setFieldError = (name: string, hasError: boolean) => {
      if (!setErrors) return;
      setErrors((errors: any) =>
        errors.map((error: any) => {
          if (error.name === name) {
            return { ...error, hasError: hasError };
          }
          return error;
        })
      );
    };
    if (setFieldError && touched) {
      if (isFocused) {
        return setFieldError(name, false);
      }
      if (required && !value) {
        setErrorText("Please fill this field!");
        return setFieldError(name, true);
      }
      if (validationRule) {
        setErrorText(ruleExplanation || "Invalid input!");
        return setFieldError(name, !value.match(validationRule));
      }
    }
  }, [
    isFocused,
    name,
    required,
    ruleExplanation,
    setErrors,
    touched,
    validationRule,
    value,
  ]);

  const inputProps = {
    hasError: hasError,
    touched: touched,
    name: name,
    onBlur: () => {
      setTouched(true);
      setIsFocused(false);
    },
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const value = e.target.value;
      handleChange({ name, value });
    },
    onFocus: () => setIsFocused(true),
    type: type,
    className: inputStyles({ theme, hasError, touched }),
  };

  return (
    <Stack gap="0">
      {type === "text" && <input {...inputProps} />}
      {type === "textarea" && <textarea {...inputProps} />}

      <motion.span
        animate={{
          opacity: hasError ? 1 : 0,
          y: hasError ? 0 : -10,
          height: hasError ? "auto" : 0,
          marginTop: hasError ? "0.5rem" : 0,
        }}
        style={{ color: theme.colors.danger }}
      >
        {errorText}
      </motion.span>
    </Stack>
  );
};

export default TextInput;
