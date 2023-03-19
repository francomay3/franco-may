import { useEffect, useState } from "react";
import { TextBlockData } from "../types";

interface TextBlockProps {
  block: TextBlockData;
  isEditingEnabled?: boolean;
  onChange?: (block: TextBlockData) => void;
}

function TextBlock({ block, isEditingEnabled, onChange }: TextBlockProps) {
  const [blockState, setBlockState] = useState(block);
  useEffect(() => {
    setBlockState(block);
  }, [block]);
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!isEditingEnabled || !onChange) return;
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
      contentEditable={isEditingEnabled}
        dangerouslySetInnerHTML={{ __html: blockState.data }}
        onBlur={handleBlur}
        style={{ flexGrow: "1" }}
        suppressContentEditableWarning={true}
      />
    </div>
  );
}

export const TextBlockDataDefault: TextBlockData = {
  type: "text",
  blockId: `${new Date().getTime() - 1000}`,
  data: "As the sun began to rise over the horizon, the birds began to chirp their morning melodies. The world was waking up to a new day, full of possibilities and opportunities. For many people, mornings were a time of reflection and preparation for the day ahead. They would sip their coffee or tea, read the newspaper, or simply sit in silence and gather their thoughts.",
};

export const ExampleTextBlock = () => (
  <TextBlock block={TextBlockDataDefault} />
);

export default TextBlock;