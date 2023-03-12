import TextBlock from "../blocks/TextBlock";
import ImageBlock from "../blocks/ImageBlock";
import { BlockData } from "../blocks/types";
import { BlogField } from "@/utils/types";
import AddBlock from "../blocks/AddBlock";

const getNewContent = (parsedContent: BlockData[], updatedBlock: BlockData) =>
  JSON.stringify(
    parsedContent.map((block) => {
      if (block.blockId === updatedBlock.blockId) {
        return updatedBlock;
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

const exampleBlockData: BlockData = {
  data: "Hello World!",
  blockId: `${new Date().getTime()}`,
  type: "text",
};

const addBlock = (
  parsedContent: BlockData[],
  block: BlockData,
  index: number
): string => {
  const newContent = [...parsedContent];
  newContent.splice(index, 0, block);

  return JSON.stringify(newContent);
};

const deleteBlock = (parsedContent: BlockData[], index: number): string => {
  const newContent = [...parsedContent];
  newContent.splice(index, 1);
  return JSON.stringify(newContent);
};

const Content = ({
  content,
  isEditingEnabled,
  onChange,
  field,
}: ContentProps) => {
  const parsedContent: BlockData[] = JSON.parse(content);
  return (
    <>
      <AddBlock
        onClick={() => {
          onChange(field, addBlock(parsedContent, exampleBlockData, 0));
        }}
      />
      {parsedContent.map((block, i) => {
        switch (block.type) {
          case "text":
            return (
              <>
                <TextBlock
                  key={block.blockId}
                  isEditingEnabled={isEditingEnabled}
                  block={block}
                  onChange={(updatedBlock) =>
                    onChange(field, getNewContent(parsedContent, updatedBlock))
                  }
                  onDelete={() => {
                    onChange(field, deleteBlock(parsedContent, i));
                  }}
                />
                <AddBlock
                  onClick={() => {
                    onChange(
                      field,
                      addBlock(parsedContent, exampleBlockData, i + 1)
                    );
                  }}
                />
              </>
            );
          case "image":
            return (
              <>
                <ImageBlock
                  key={block.blockId}
                  block={block}
                  isEditingEnabled={isEditingEnabled}
                  onChange={(updatedBlock) =>
                    onChange(field, getNewContent(parsedContent, updatedBlock))
                  }
                />
                <AddBlock
                  onClick={() => {
                    onChange(
                      field,
                      addBlock(parsedContent, exampleBlockData, i + 1)
                    );
                  }}
                />
              </>
            );
          default:
            return null;
        }
      })}
    </>
  );
};

export default Content;
