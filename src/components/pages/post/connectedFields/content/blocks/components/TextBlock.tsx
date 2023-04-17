import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { TextBlockData } from "../types";
import { useAuth } from "@/providers/AuthProvider";

interface TextBlockProps {
  block: TextBlockData;
  onChange?: (block: TextBlockData) => void;
}

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
  font-size: 18px;
  line-height: 1.75rem;
  letter-spacing: -0.003em;
  word-break: break-word;
  color: ${({ theme }) => theme.colors.text};
`;

function TextBlock({ block, onChange }: TextBlockProps) {
  const { isEditing } = useAuth();
  const [blockState, setBlockState] = useState(block);

  useEffect(() => {
    setBlockState(block);
  }, [block]);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!isEditing || !onChange) return;
    setBlockState((prev) => {
      const newBlock = { ...prev, data: e.target.innerHTML };
      if (newBlock.data === prev.data) return prev;
      onChange(newBlock);
      return newBlock;
    });
  };

  return (
    <TextContainer
      contentEditable={isEditing}
      dangerouslySetInnerHTML={{ __html: blockState.data }}
      onBlur={handleBlur}
      suppressContentEditableWarning={true}
    />
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
