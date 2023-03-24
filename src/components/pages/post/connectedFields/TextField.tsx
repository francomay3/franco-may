import { BlogField } from "@/utils/types";
import EditableText from "@/components/EditableText";
import { HtmlElementTag } from "@/utils/types";

interface TextFieldProps {
  value: string;
  isEditingEnabled: boolean;
  onChange: (field: BlogField, value: string) => void;
  as: HtmlElementTag;
  field: BlogField;
}

const TextField = ({
  value,
  isEditingEnabled,
  onChange,
  as,
  field,
}: TextFieldProps) => (
  <EditableText
    value={value}
    isEditingEnabled={isEditingEnabled}
    onChange={(value) => onChange(field, value)}
    as={as}
  />
);

export default TextField;
