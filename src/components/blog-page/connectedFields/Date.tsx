import { useState } from "react";
import { getDateAsString } from "@/utils/generalUtils";
import { BlogField } from "@/utils/types";

interface DateFieldProps {
  date: number;
  isEditingEnabled: boolean;
  onChange: (field: BlogField, value: number) => void;
  field: BlogField;
}

const DateField = ({
  date,
  isEditingEnabled,
  onChange,
  field,
}: DateFieldProps) => {
  const [isEditingDate, setIsEditingDate] = useState(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = new Date(e.target.value).getTime();
    setIsEditingDate(false);
    onChange(field, time);
  };
  return isEditingDate ? (
    <input onChange={handleChange} type="date" />
  ) : (
    <span
      onClick={() => {
        if (isEditingEnabled) setIsEditingDate(true);
      }}
    >
      {getDateAsString(date)}
    </span>
  );
};

export default DateField;
