import { BlockData } from "./blocks/types";
import { BlogField } from "@/utils/types";
import AddBlock from "./blocks/AddBlock";
import { ImageBlock, TextBlock } from "./blocks";
import NewBlockDialog from "./NewBlockDialog";
import React, { useState } from "react";
import DraggableBlock from "./DraggableBlock";
import {
  addBlock,
  deleteBlock,
  mergeTextBlocks,
  moveBlock,
  updateBlock,
} from "./utils";

interface ContentProps {
  content: string;
  isEditingEnabled: boolean;
  onChange: (field: BlogField, value: string) => void;
  field: BlogField;
}

const Content = ({
  content: rawContent,
  isEditingEnabled,
  onChange,
  field,
}: ContentProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectionIndex, setSelectionIndex] = useState(0);
  const [draggedBlock, setDraggedBlock] = useState<BlockData | null>(null);
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
        isDraggingBlock={!!draggedBlock}
        onClick={() => {
          setSelectionIndex(0);
          setIsDialogOpen(true);
        }}
        onDrop={() => {
          setDraggedBlock(null);
          handleChange(moveBlock(draggedBlock, content, 0));
        }}
      />
      {content.map((block, i) => {
        switch (block.type) {
          case "text":
            return (
              <React.Fragment key={block.blockId}>
                <DraggableBlock
                  draggable={isEditingEnabled}
                  block={block}
                  setDraggedBlock={setDraggedBlock}
                >
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
                </DraggableBlock>
                <AddBlock
                  isDraggingBlock={!!draggedBlock}
                  onClick={() => {
                    setSelectionIndex(i + 1);
                    setIsDialogOpen(true);
                  }}
                  onDrop={() => {
                    handleChange(moveBlock(draggedBlock, content, i + 1));
                  }}
                />
              </React.Fragment>
            );
          case "image":
            return (
              <React.Fragment key={block.blockId}>
                <DraggableBlock
                  draggable={isEditingEnabled}
                  block={block}
                  setDraggedBlock={setDraggedBlock}
                >
                  <ImageBlock
                    block={block}
                    isEditingEnabled={isEditingEnabled}
                    onChange={(updatedBlock) =>
                      handleChange(updateBlock(content, updatedBlock))
                    }
                  />
                </DraggableBlock>

                <AddBlock
                  isDraggingBlock={!!draggedBlock}
                  onClick={() => {
                    setSelectionIndex(i + 1);
                    setIsDialogOpen(true);
                  }}
                  onDrop={() => {
                    handleChange(moveBlock(draggedBlock, content, i + 1));
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
