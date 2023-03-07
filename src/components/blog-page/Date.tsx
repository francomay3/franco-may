import { getDateAsString } from "@/utils/generalUtils";
import { useState } from "react";

const DateField = ({ date, isEditing, onChange }) => {
  const [isEditingDate, setIsEditingDate] = useState(false);
  const handleChange = (e) => {
    const time = new Date(e.target.value).getTime();
    setIsEditingDate(false);
    onChange(time);
  };
  return isEditingDate ? (
    <input type="date" onChange={handleChange} />
  ) : (
    <span
      onClick={() => {
        if (isEditing) setIsEditingDate(true);
      }}
    >
      {getDateAsString(date)}
    </span>
  );
};

export default DateField;
