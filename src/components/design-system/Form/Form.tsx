import { useState } from "react";
import styled from "@emotion/styled";
import { Button, TextInput } from "@/components/design-system";

const Wrapper = styled.form`
  max-width: 750px;
  display: grid;
  grid-template-columns: auto 1fr;
  grid-gap: 1rem;
  width: 100%;
  align-items: center;
  ${(props) => props.theme.mediaQueries.onlyMobile} {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

const InputWrapper = styled.div<{ index: number }>`
  grid-column: 2;
  grid-row: ${({ index }) => index + 1};
  ${(props) => props.theme.mediaQueries.onlyMobile} {
    grid-column: 1;
    grid-row: auto;
  }
`;

const Label = styled.label<{ index: number }>`
  grid-column: 1;
  grid-row: ${({ index }) => index + 1};
  ${(props) => props.theme.mediaQueries.onlyMobile} {
    grid-column: 1;
    grid-row: auto;
    margin-bottom: -0.5rem;
    margin-inline-start: 0.5rem;
  }
`;

const ButtonWrapper = styled.div<{ fields: Field[] }>`
  grid-column: 2;
  grid-row: ${({ fields }) => fields.length + 1};
  justify-self: end;
  ${(props) => props.theme.mediaQueries.onlyMobile} {
    grid-column: 1;
    grid-row: auto;
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
            <Label htmlFor={label} index={index}>
              <h3
                dangerouslySetInnerHTML={{
                  __html: `${label}${required ? "&nbsp;*" : ""}`,
                }}
                style={{
                  display: "inline",
                }}
              />
            </Label>
          );
          return (
            <>
              {labelComp}
              <InputWrapper index={index}>
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
              </InputWrapper>
            </>
          );
        }
      )}
      <ButtonWrapper fields={fields}>
        <Button
          disabled={isSubmitDisabled}
          onClick={(e) => {
            e.preventDefault();
            onSubmit(formData);
          }}
          type="submit"
          value="Submit"
        />
      </ButtonWrapper>
    </Wrapper>
  );
};

export default Form;
