import ImageWithCaption from "@/components/ImageWithCaption";
import { useState } from "react";

function ImageBlock({ block, isEditingEnabled, onChange }) {
  const [blockState, setBlockState] = useState(block);
  const updateBlock = (newCaption) => {
    setBlockState((prev) => {
      const newBlock = { ...prev, caption: newCaption };
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
