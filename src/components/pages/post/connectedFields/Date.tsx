import { useState } from "react";
import { getDateAsString } from "@/utils/generalUtils";
import { BlogField } from "@/utils/types";
import { useAuth } from "@/providers/AuthProvider";

interface DateFieldProps {
  date: number;
  onChange: (field: BlogField, value: number) => void;
  field: BlogField;
}

const DateField = ({ date, onChange, field }: DateFieldProps) => {
  const { isEditing } = useAuth();
  const [isEditingDate, setIsEditingDate] = useState(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = new Date(e.target.value).getTime();
    setIsEditingDate(false);
    onChange(field, time);
  };
  return isEditingDate ? (
    <input onChange={handleChange} type="date" />
  ) : (
    <time
      onClick={() => {
        if (isEditing) setIsEditingDate(true);
      }}
    >
      {getDateAsString(date)}
    </time>
  );
};

export default DateField;
