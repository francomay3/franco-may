import { useState } from "react";
import styled from "@emotion/styled";
import { ActionPlusButton } from "../../../../design-system/ActionButtons";

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
  z-index: 1;
`;

const Line = styled.div<{ blockHovering: boolean }>`
  border-top: 3px dashed
    ${({ blockHovering, theme }) =>
      blockHovering ? theme.colors.darkBlue : "transparent"};
  transition: border-top 0.1s linear;
  width: 85vw;
  position: absolute;
`;

function AddOrDropBlock({
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
        onDragEnter={() => setDraggedOver(true)}
        onDragLeave={() => setDraggedOver(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setDraggedOver(false);
          onDrop();
        }}
      />
      <ActionPlusButton onClick={onClick} />
    </Wrapper>
  );
}

export default AddOrDropBlock;
