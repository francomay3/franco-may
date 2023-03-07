import ImageWithCaption from "@/components/ImageWithCaption";
import { useState } from "react";

function ImageBlock({ block, isEditing, onChange }) {
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
      isEditing={isEditing}
      onChange={updateBlock}
    />
  );
}

export default ImageBlock;
