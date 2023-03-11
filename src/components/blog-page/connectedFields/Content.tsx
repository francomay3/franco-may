import TextBlock from "../blocks/TextBlock";
import ImageBlock from "../blocks/ImageBlock";
import { BlockData } from "../blocks/types";
import { BlogField } from "@/utils/types";

const getNewContent = (parsedContent: BlockData[], newBlock: BlockData) =>
  JSON.stringify(
    parsedContent.map((block) => {
      if (block.blockId === newBlock.blockId) {
        return newBlock;
      }
      return block;
    })
  );

interface ContentProps {
  content: string;
  isEditingEnabled: boolean;
  onChange: (field: BlogField, value: string) => void;
  field: BlogField;
}

const Content = ({
  content,
  isEditingEnabled,
  onChange,
  field,
}: ContentProps) => {
  const parsedContent: BlockData[] = JSON.parse(content);
  return (
    <>
      {parsedContent.map((block) => {
        switch (block.type) {
          case "text":
            return (
              <TextBlock
                key={block.blockId}
                isEditingEnabled={isEditingEnabled}
                block={block}
                onChange={(newBlock) =>
                  onChange(field, getNewContent(parsedContent, newBlock))
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
                  onChange(field, getNewContent(parsedContent, newBlock))
                }
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
};

export default Content;
