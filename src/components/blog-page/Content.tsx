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

const Content = ({ content, isEditingEnabled, onChange }) => {
  const parsedContent = JSON.parse(content);
  return parsedContent.map((block) => {
    switch (block.type) {
      case "text":
        return (
          <TextBlock
            key={block.blockId}
            isEditingEnabled={isEditingEnabled}
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
            isEditingEnabled={isEditingEnabled}
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
