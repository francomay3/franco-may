import ImageWithCaption from "@/components/ImageWithCaption";
import { useState } from "react";
import { ImageBlockData } from "./types";

interface ImageBlockProps {
  block: ImageBlockData;
  isEditingEnabled?: boolean;
  onChange?: (block: ImageBlockData) => void;
}

function ImageBlock({
  block,
  isEditingEnabled = false,
  onChange = () => {},
}: ImageBlockProps) {
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

export const ImageBlockDataDefault: ImageBlockData = {
  type: "image",
  blockId: `${new Date().getTime()}`,
  title: "Image Title",
  caption: "This is a beautiful image, isn't it?",
  url: "https://source.unsplash.com/random/600x400",
};

export const ExampleImageBlock = () => (
  <ImageBlock block={ImageBlockDataDefault} />
);

export default ImageBlock;
