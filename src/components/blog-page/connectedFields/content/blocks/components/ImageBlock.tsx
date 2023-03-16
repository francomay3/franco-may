import { useState } from "react";
import { ImageBlockData } from "../types";
import ImageWithCaption from "@/components/ImageWithCaption";

interface ImageBlockProps {
  block: ImageBlockData;
  isEditingEnabled?: boolean;
  onChange?: (block: ImageBlockData | undefined) => void | null;
  onImageClick?: () => void;
}

function ImageBlock({
  block,
  isEditingEnabled = false,
  onChange = () => null,
  onImageClick = () => null,
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
      caption={blockState.caption}
      imageName={blockState.title}
      isEditingEnabled={isEditingEnabled}
      onChange={updateBlock}
      onImageClick={onImageClick}
      url={blockState.url}
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
