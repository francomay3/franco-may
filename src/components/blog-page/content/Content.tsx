import React, { useState } from "react";
import AddOrDropBlock from "./blocks/AddOrDropBlock";
import { ImageBlock, TextBlock } from "./blocks";
import NewBlockDialog from "./NewBlockDialog";
import { BlockData } from "./blocks/types";
import DraggableBlock from "./DraggableBlock";
import {
  addBlock,
  deleteBlock,
  mergeTextBlocks,
  moveBlock,
  updateBlock,
} from "./utils";
import { BlogField } from "@/utils/types";

type OnChange = (field: BlogField, value: string) => void;

interface ContentProps {
  content: string;
  field: BlogField;
  isEditingEnabled: boolean;
  onChange: OnChange;
}

const Content = ({
  content: rawContent,
  field,
  isEditingEnabled,
  onChange,
}: ContentProps) => {
  const [draggedBlock, setDraggedBlock] = useState<BlockData | null>(null);
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
        addBlock={(newBlock) => {
          handleChange(addBlock(content, newBlock, selectionIndex));
          setIsDialogOpen(false);
        }}
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
      />
      <AddOrDropBlock
        isDraggingBlock={Boolean(draggedBlock)}
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
                  block={block}
                  draggable={isEditingEnabled}
                  setDraggedBlock={setDraggedBlock}
                >
                  <TextBlock
                    block={block}
                    isEditingEnabled={isEditingEnabled}
                    onChange={(updatedBlock) =>
                      handleChange(updateBlock(content, updatedBlock))
                    }
                    onDelete={() => {
                      handleChange(deleteBlock(content, i));
                    }}
                  />
                </DraggableBlock>
                <AddOrDropBlock
                  isDraggingBlock={Boolean(draggedBlock)}
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
                  block={block}
                  draggable={isEditingEnabled}
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

                <AddOrDropBlock
                  isDraggingBlock={Boolean(draggedBlock)}
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
