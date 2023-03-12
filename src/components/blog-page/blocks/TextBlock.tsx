import { useState } from "react";
import { TextBlockData } from "./types";

interface TextBlockProps {
  block: TextBlockData;
  isEditingEnabled: boolean;
  onChange: (block: TextBlockData) => void;
}

function TextBlock({ block, isEditingEnabled, onChange }: TextBlockProps) {
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
    <p
      onBlur={handleBlur}
      contentEditable={isEditingEnabled}
      dangerouslySetInnerHTML={{ __html: blockState.data }}
    />
  );
}

export default TextBlock;
