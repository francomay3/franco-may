import styled from "@emotion/styled";
import { PlusButton } from "../../ActionButtons";
import { BlockData } from "./types";
import { useState, useCallback } from "react";

const Wrapper = styled.div`
  height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const DropZone = styled.div<{ isDraggingBlock: boolean }>`
  height: ${({ isDraggingBlock }) => (isDraggingBlock ? "100px" : "0")};
  transition: height 0.1s linear;
  width: 100vw;
  position: absolute;
`;

const Line = styled.div<{ blockHovering: boolean }>`
  border-top: 3px dashed
    ${({ blockHovering, theme }) =>
      blockHovering ? theme.colors.darkBlue : "transparent"};
  transition: border-top 0.1s linear;
  width: 85vw;
  position: absolute;
`;

function AddBlock({
  onClick,
  onDrop,
  isDraggingBlock,
}: {
  onClick: () => void;
  onDrop: () => void;
  isDraggingBlock: boolean;
}) {
  const [draggedOver, setDraggedOver] = useState(false);
  return (
    <Wrapper>
      <Line blockHovering={draggedOver} />
      <DropZone
        isDraggingBlock={isDraggingBlock}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setDraggedOver(true)}
        onDragLeave={() => setDraggedOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDraggedOver(false);
          onDrop();
        }}
      />
      <PlusButton onClick={onClick} />
    </Wrapper>
  );
}

export default AddBlock;
