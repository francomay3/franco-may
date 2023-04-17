import React, { useState } from "react";
import AddOrDropBlock from "./AddOrDropBlock";
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
import { useAuth } from "@/providers/AuthProvider";

type OnChange = (field: BlogField, value: string) => void;
interface ContentProps {
  content: string;
  field: BlogField;
  onChange: OnChange;
}

const Content = ({ content: rawContent, field, onChange }: ContentProps) => {
  const { isEditing } = useAuth();
  const [draggedBlock, setDraggedBlock] = useState<BlockData | null>(null);
  const [isNewBlockDialogOpen, setIsNewBlockDialogOpen] = useState(false);
  const [selectionIndex, setSelectionIndex] = useState(0);
  const content: BlockData[] = JSON.parse(rawContent);

  const handleChange = (newContent: BlockData[]) => {
    const preparedContent = mergeTextBlocks(newContent);
    onChange(field, JSON.stringify(preparedContent));
  };

  return (
    <>
      {isEditing && (
        <>
          <NewBlockDialog
            addBlock={(newBlock) => {
              handleChange(addBlock(content, newBlock, selectionIndex));
              setIsNewBlockDialogOpen(false);
            }}
            isDialogOpen={isNewBlockDialogOpen}
            setIsDialogOpen={setIsNewBlockDialogOpen}
          />

          <AddOrDropBlock
            isDraggingBlock={Boolean(draggedBlock)}
            onClick={() => {
              setSelectionIndex(0);
              setIsNewBlockDialogOpen(true);
            }}
            onDrop={() => {
              setDraggedBlock(null);
              handleChange(moveBlock(draggedBlock, content, 0));
            }}
          />
        </>
      )}
      {content.map((block, i) => {
        const props = {
          isEditing,
          onChange: (updatedBlock?: BlockData) => {
            if (updatedBlock) handleChange(updateBlock(content, updatedBlock));
          },
        };
        return (
          <React.Fragment key={block.blockId}>
            <DraggableBlock
              block={block}
              draggable={isEditing}
              onDelete={() => {
                handleChange(deleteBlock(content, i));
              }}
              setDraggedBlock={setDraggedBlock}
            >
              {block.type === "text" && <TextBlock {...props} block={block} />}
              {block.type === "image" && (
                <ImageBlock {...props} block={block} />
              )}
            </DraggableBlock>
            {isEditing && (
              <AddOrDropBlock
                isDraggingBlock={Boolean(draggedBlock)}
                onClick={() => {
                  setSelectionIndex(i + 1);
                  setIsNewBlockDialogOpen(true);
                }}
                onDrop={() => {
                  handleChange(moveBlock(draggedBlock, content, i + 1));
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

export default Content;
