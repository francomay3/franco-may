import React, { useState } from "react";
import AddOrDropBlock from "./AddOrDropBlock";
import { ImageBlock, TextBlock } from "./blocks";
import NewBlockDialog from "./NewBlockDialog";
import ImageSelectionDialog from "./ImageSelectionDialog";
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
  const [isNewBlockDialogOpen, setIsNewBlockDialogOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [selectionIndex, setSelectionIndex] = useState(0);
  const content: BlockData[] = JSON.parse(rawContent);

  const handleChange = (newContent: BlockData[]) => {
    const preparedContent = mergeTextBlocks(newContent);
    onChange(field, JSON.stringify(preparedContent));
  };

  return (
    <>
      {isEditingEnabled && (
        <>
          <NewBlockDialog
            addBlock={(newBlock) => {
              handleChange(addBlock(content, newBlock, selectionIndex));
              setIsNewBlockDialogOpen(false);
            }}
            isDialogOpen={isNewBlockDialogOpen}
            setIsDialogOpen={setIsNewBlockDialogOpen}
          />
          <ImageSelectionDialog
            isDialogOpen={!isNewBlockDialogOpen && isImageDialogOpen}
            setIsDialogOpen={setIsImageDialogOpen}
            onSelect={(image) => {
              console.log(image);
              setIsImageDialogOpen(false);
            }}
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
          onImageClick: () => {
            setIsImageDialogOpen(true);
          },
          isEditingEnabled,
          onChange: (updatedBlock?: BlockData) => {
            if (updatedBlock) handleChange(updateBlock(content, updatedBlock));
          },
        };
        return (
          <React.Fragment key={block.blockId}>
            <DraggableBlock
              block={block}
              draggable={isEditingEnabled}
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
            {isEditingEnabled && (
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
