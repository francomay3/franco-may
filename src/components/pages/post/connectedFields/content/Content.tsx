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
import { useAuth } from "@/providers/AuthProvider";
import { CONTENT } from "@/utils/constants";

type OnChange = (field: typeof CONTENT, value: BlockData[]) => void;
interface ContentProps {
  content: BlockData[];
  onChange: OnChange;
}

const Content = ({ content, onChange }: ContentProps) => {
  const { isEditing } = useAuth();
  const [draggedBlock, setDraggedBlock] = useState<BlockData | null>(null);
  const [isNewBlockDialogOpen, setIsNewBlockDialogOpen] = useState(false);
  const [selectionIndex, setSelectionIndex] = useState(0);

  const handleChange = (newContent: BlockData[]) => {
    const preparedContent = mergeTextBlocks(newContent);
    onChange(CONTENT, preparedContent);
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
