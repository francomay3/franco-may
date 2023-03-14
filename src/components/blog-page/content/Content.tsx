import { BlockData } from "./blocks/types";
import { BlogField } from "@/utils/types";
import AddBlock from "./blocks/AddBlock";
import { ImageBlock, TextBlock } from "./blocks";
import NewBlockDialog from "./NewBlockDialog";
import React, { useState } from "react";

interface ContentProps {
  content: string;
  isEditingEnabled: boolean;
  onChange: (field: BlogField, value: string) => void;
  field: BlogField;
}

const updateBlock = (
  oldContent: BlockData[],
  updatedBlock: BlockData
): BlockData[] =>
  oldContent.map((block) => {
    if (block.blockId === updatedBlock.blockId) {
      return updatedBlock;
    }
    return block;
  });

const addBlock = (
  oldContent: BlockData[],
  newBlock: BlockData,
  position: number
): BlockData[] => {
  const newContent = [...oldContent];
  newContent.splice(position, 0, newBlock);

  return newContent;
};

const deleteBlock = (
  oldContent: BlockData[],
  position: number
): BlockData[] => {
  const newContent = [...oldContent];
  newContent.splice(position, 1);
  return newContent;
};

const mergeTextBlocks = (oldContent: BlockData[]): BlockData[] => {
  const newContent = oldContent.reduce((acc, currentBlock, i) => {
    console.log(i);
    const previousBlock: BlockData | undefined = oldContent[i - 1];
    if (currentBlock.type === "text" && currentBlock.data === "") {
      return acc;
    }
    if (
      currentBlock.type === "text" &&
      previousBlock &&
      previousBlock.type === "text"
    ) {
      return [
        ...acc.slice(0, -1),
        {
          ...previousBlock,
          data: `${previousBlock.data}<br><br>${currentBlock.data}`,
        },
      ];
    }

    return [...acc, currentBlock];
  }, [] as BlockData[]);
  return newContent;
};

const Content = ({
  content: rawContent,
  isEditingEnabled,
  onChange,
  field,
}: ContentProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectionIndex, setSelectionIndex] = useState(0);
  const content: BlockData[] = JSON.parse(rawContent);

  const handleChange = (newContent: BlockData[]) => {
    const preparedContent = mergeTextBlocks(newContent);
    onChange(field, JSON.stringify(preparedContent));
  };

  return (
    <>
      <NewBlockDialog
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        addBlock={(newBlock) => {
          handleChange(addBlock(content, newBlock, selectionIndex));
          setIsDialogOpen(false);
        }}
      />
      <AddBlock
        onClick={() => {
          setSelectionIndex(0);
          setIsDialogOpen(true);
        }}
      />
      {content.map((block, i) => {
        switch (block.type) {
          case "text":
            return (
              <React.Fragment key={block.blockId}>
                <TextBlock
                  isEditingEnabled={isEditingEnabled}
                  block={block}
                  onChange={(updatedBlock) =>
                    handleChange(updateBlock(content, updatedBlock))
                  }
                  onDelete={() => {
                    handleChange(deleteBlock(content, i));
                  }}
                />
                <AddBlock
                  onClick={() => {
                    setSelectionIndex(i + 1);
                    setIsDialogOpen(true);
                  }}
                />
              </React.Fragment>
            );
          case "image":
            return (
              <React.Fragment key={block.blockId}>
                <ImageBlock
                  block={block}
                  isEditingEnabled={isEditingEnabled}
                  onChange={(updatedBlock) =>
                    handleChange(updateBlock(content, updatedBlock))
                  }
                />
                <AddBlock
                  onClick={() => {
                    setSelectionIndex(i + 1);
                    setIsDialogOpen(true);
                  }}
                />
              </React.Fragment>
            );
          default:
            return null;
        }
      })}
    </>
  );
};

export default Content;
