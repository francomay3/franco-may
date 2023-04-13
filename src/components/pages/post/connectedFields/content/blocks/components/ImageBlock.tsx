import { useState } from "react";
import { ImageBlockData } from "../types";
import { ImageWithCaption } from "@/components/design-system";
import { ImageData } from "@/utils/types";

interface ImageBlockProps {
  block: ImageBlockData;
  isEditingEnabled?: boolean;
  onChange?: (block: ImageBlockData | undefined) => void | null;
}

function ImageBlock({
  block,
  isEditingEnabled = false,
  onChange = () => null,
}: ImageBlockProps) {
  const [blockState, setBlockState] = useState(block);

  const updateCaption = (newCaption: string) => {
    setBlockState((prev) => {
      const newBlock = { ...prev, caption: newCaption };
      if (newBlock.caption === prev.caption) return prev;
      onChange(newBlock);
      return newBlock;
    });
  };

  const updateImage = (newImage: ImageData) => {
    setBlockState((prev) => {
      const newBlock = { ...prev, ...newImage };
      onChange(newBlock);
      return newBlock;
    });
  };

  return (
    <>
      <ImageWithCaption
        caption={blockState.caption}
        imageName={blockState.title}
        isEditingEnabled={isEditingEnabled}
        onCaptionChange={updateCaption}
        onSelect={updateImage}
        url={blockState.url}
      />
    </>
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
