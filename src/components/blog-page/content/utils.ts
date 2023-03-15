import { BlockData } from "./blocks/types";

export const updateBlock = (
  oldContent: BlockData[],
  updatedBlock: BlockData
): BlockData[] =>
  oldContent.map((block) => {
    if (block.blockId === updatedBlock.blockId) {
      return updatedBlock;
    }
    return block;
  });

export const addBlock = (
  oldContent: BlockData[],
  newBlock: BlockData,
  position: number
): BlockData[] => {
  const newContent = [...oldContent];
  newContent.splice(position, 0, newBlock);

  return newContent;
};

export const deleteBlock = (
  oldContent: BlockData[],
  position: number
): BlockData[] => {
  const newContent = [...oldContent];
  newContent.splice(position, 1);
  return newContent;
};

export const moveBlock = (
  draggedBlock: BlockData | null,
  oldContent: BlockData[],
  position: number
): BlockData[] => {
  if (!draggedBlock) return oldContent;
  const currentBlockIndex = oldContent.findIndex(
    (block) => block.blockId === draggedBlock.blockId
  );
  if (currentBlockIndex < position) position -= 1;

  const newContent = [...oldContent];
  const draggedBlockIndex = newContent.findIndex(
    (block) => block.blockId === draggedBlock.blockId
  );
  newContent.splice(draggedBlockIndex, 1);
  newContent.splice(position, 0, draggedBlock);
  return newContent;
};

export const mergeTextBlocks = (oldContent: BlockData[]): BlockData[] => {
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
