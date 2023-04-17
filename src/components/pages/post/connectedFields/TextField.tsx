import { BlogField } from "@/utils/types";
import EditableText from "@/components/EditableText";
import { HtmlElementTag } from "@/utils/types";

interface TextFieldProps {
  value: string;
  onChange: (field: BlogField, value: string) => void;
  as: HtmlElementTag;
  field: BlogField;
  style?: React.CSSProperties;
}

const TextField = ({ value, onChange, as, field, style }: TextFieldProps) => (
  <EditableText
    as={as}
    onChange={(value) => onChange(field, value)}
    style={style}
    value={value}
  />
);

export default TextField;
