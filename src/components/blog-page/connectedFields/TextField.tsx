import { BlogField } from "@/utils/types";

type As = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";

interface TextFieldProps {
  value: string;
  isEditingEnabled: boolean;
  onChange: (field: BlogField, value: string) => void;
  as: As;
  field: BlogField;
}

const getWrapper = (as: As) => {
  switch (as) {
    case "h1":
      return function H1({ children, ...props }: any) {
        return <h1 {...props}>{children}</h1>;
      };
    case "h2":
      return function H2({ children, ...props }: any) {
        return <h2 {...props}>{children}</h2>;
      };
    case "h3":
      return function H3({ children, ...props }: any) {
        return <h3 {...props}>{children}</h3>;
      };
    case "h4":
      return function H4({ children, ...props }: any) {
        return <h4 {...props}>{children}</h4>;
      };
    case "h5":
      return function H5({ children, ...props }: any) {
        return <h5 {...props}>{children}</h5>;
      };
    case "h6":
      return function H6({ children, ...props }: any) {
        return <h6 {...props}>{children}</h6>;
      };
    case "p":
      return function P({ children, ...props }: any) {
        return <p {...props}>{children}</p>;
      };
    case "span":
      return function Span({ children, ...props }: any) {
        return <span {...props}>{children}</span>;
      };
    default:
      return function Div({ children, ...props }: any) {
        return <div {...props}>{children}</div>;
      };
  }
};

const TextField = ({
  value,
  isEditingEnabled,
  onChange,
  as,
  field,
}: TextFieldProps) => {
  const Wrapper = getWrapper(as);
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const newValue = e.target.innerHTML;
    if (newValue === value) return;
    onChange(field, newValue === "" ? "empty" : newValue);
  };
  return (
    <Wrapper
      contentEditable={isEditingEnabled}
      dangerouslySetInnerHTML={{ __html: value }}
      onBlur={handleBlur}
    />
  );
};

export default TextField;
