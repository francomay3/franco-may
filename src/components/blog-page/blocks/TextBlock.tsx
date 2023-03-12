import { useState } from "react";
import { TextBlockData } from "./types";
import { MinusButton } from "../ActionButtons";

interface TextBlockProps {
  block: TextBlockData;
  isEditingEnabled: boolean;
  onChange: (block: TextBlockData) => void;
  onDelete: () => void;
}

function TextBlock({
  block,
  isEditingEnabled,
  onDelete,
  onChange,
}: TextBlockProps) {
  const [blockState, setBlockState] = useState(block);
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setBlockState((prev) => {
      const newBlock = { ...prev, data: e.target.innerHTML };
      if (newBlock.data === prev.data) return prev;
      onChange(newBlock);
      return newBlock;
    });
  };

  return (
    <div
      style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}
    >
      <div
        style={{ flexGrow: "1" }}
        onBlur={handleBlur}
        contentEditable={isEditingEnabled}
        dangerouslySetInnerHTML={{ __html: blockState.data }}
      />
      <MinusButton onClick={onDelete} />
    </div>
  );
}

export default TextBlock;
