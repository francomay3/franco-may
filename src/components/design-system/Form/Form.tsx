import { useState } from "react";
import { css } from "@emotion/css";
import styled from "@emotion/styled";
import { Button, TextInput } from "@/components/design-system";
import { useTheme } from "@emotion/react";

const Wrapper = styled.form`
  max-width: 750px;
  display: grid;
  grid-template-columns: auto 1fr;
  grid-gap: 1rem;
  width: 100%;
  align-items: center;
  ${(props) => props.theme.mediaQueries.onlyMobile} {
    grid-template-columns: 1fr;
    label {
      margin-bottom: -0.5rem;
    }
  }
`;

type Field = {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  ruleExplanation?: string;
  type?: string;
  validationRule?: string | RegExp;
};

type FieldValue = {
  [key: string]: string;
};

const Form = ({
  fields,
  onSubmit,
}: {
  fields: Field[];
  onSubmit: (formData: any) => void;
}) => {
  const theme = useTheme();
  const [errors, setErrors] = useState<{ name: string; hasError: boolean }[]>(
    fields.map(({ name }) => ({ name: name, hasError: false }))
  );
  const [formData, setFormData] = useState({} as any);

  const handleChange = ({ name, value }: FieldValue) => {
    setFormData({ ...formData, [name]: value });
  };

  const isSubmitDisabled =
    errors.some((error) => error.hasError) ||
    !fields
      .filter((field) => field.required)
      .every((field) => formData[field.name]);

  return (
    <Wrapper>
      {fields.map(
        (
          {
            type = "text",
            label,
            name,
            validationRule,
            ruleExplanation,
            required,
          },
          index
        ) => {
          const hasError = errors.find(
            (error) => error.name === name
          )?.hasError;
          const labelComp = (
            <label
              className={css`
                grid-column: 1;
                grid-row: ${index + 1};
                &:after {
                  content: "${required ? " *" : ""}";
                  color: ${theme.colors.text};
                }
              `}
              htmlFor={label}
            >
              <h3
                style={{
                  display: "inline",
                }}
              >
                {label}
              </h3>
            </label>
          );
          return (
            <>
              {labelComp}
              <div
                className={css`
                  grid-column: 2;
                  grid-row: ${index + 1};
                `}
              >
                <TextInput
                  handleChange={handleChange}
                  hasError={hasError}
                  name={name}
                  required={required}
                  ruleExplanation={ruleExplanation}
                  setErrors={setErrors}
                  type={type}
                  validationRule={validationRule}
                  value={formData[name]}
                />
              </div>
            </>
          );
        }
      )}
      <div
        className={css`
          grid-column: 2;
          grid-row: ${fields.length + 1};
          justify-self: end;
        `}
      >
        <Button
          disabled={isSubmitDisabled}
          onClick={(e) => {
            e.preventDefault();
            onSubmit(formData);
          }}
          type="submit"
          value="Submit"
        />
      </div>
    </Wrapper>
  );
};

export default Form;
