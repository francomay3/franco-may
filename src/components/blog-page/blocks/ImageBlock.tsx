import ImageWithCaption from "@/components/ImageWithCaption";
import { useState } from "react";
import { ImageBlockData } from "./types";

interface ImageBlockProps {
  block: ImageBlockData;
  isEditingEnabled: boolean;
  onChange: (block: ImageBlockData) => void;
}

function ImageBlock({ block, isEditingEnabled, onChange }: ImageBlockProps) {
  const [blockState, setBlockState] = useState(block);
  const updateBlock = (newCaption: string) => {
    setBlockState((prev) => {
      const newBlock = { ...prev, caption: newCaption };
      if (newBlock.caption === prev.caption) return prev;
      onChange(newBlock);
      return newBlock;
    });
  };
  return (
    <ImageWithCaption
      imageName={blockState.title}
      caption={blockState.caption}
      url={blockState.url}
      isEditingEnabled={isEditingEnabled}
      onChange={updateBlock}
    />
  );
}

export default ImageBlock;
