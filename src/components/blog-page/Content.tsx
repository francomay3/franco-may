import TextBlock from "./blocks/TextBlock";
import ImageBlock from "./blocks/ImageBlock";
import { memo } from "react";

const getNewContent = (parsedContent, newBlock) =>
  JSON.stringify(
    parsedContent.map((block) => {
      if (block.blockId === newBlock.blockId) {
        return newBlock;
      }
      return block;
    })
  );

const Content = ({ content, isEditing, onChange }) => {
  const parsedContent = JSON.parse(content);
  return parsedContent.map((block) => {
    switch (block.type) {
      case "text":
        return (
          <TextBlock
            key={block.blockId}
            isEditing={isEditing}
            block={block}
            onChange={(newBlock) =>
              onChange(getNewContent(parsedContent, newBlock))
            }
          />
        );
      case "image":
        return (
          <ImageBlock
            key={block.blockId}
            block={block}
            isEditing={isEditing}
            onChange={(newBlock) =>
              onChange(getNewContent(parsedContent, newBlock))
            }
          />
        );
      default:
        return null;
    }
  });
};

export default Content;
