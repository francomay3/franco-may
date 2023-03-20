import styled from "@emotion/styled";
import { ReactNode } from "react";
import { useState } from "react";
import {
  ActionMinusButton,
  ActionMoveButton,
} from "../../../../design-system/ActionButtons";
import { BlockData } from "./blocks/types";

const MoveButtonWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  transform: translate(-160%, 70%);
`;
const Wrapper = styled.section`
  position: relative;
`;
const DraggableExpansion = styled.div<{ left?: boolean }>`
  position: absolute;
  top: 0;
  ${({ left }) => (left ? "right: 0" : "left: 0")};
  width: 6rem;
  height: 100%;
  transform: translate(${({ left }) => (left ? "100%" : "-100%")}, 0);
`;

const DraggableBlock = ({
  children,
  draggable,
  block,
  setDraggedBlock,
  onDelete,
}: {
  children: ReactNode;
  draggable: boolean;
  block: BlockData;
  setDraggedBlock: (block: BlockData | null) => void;
  onDelete: () => void;
}) => {
  const [isHovering, setIsHovering] = useState(false);
  return (
    <Wrapper
      draggable={draggable}
      onDragEnd={() => {
        setDraggedBlock(null);
      }}
      onDragStart={() => {
        setDraggedBlock(block);
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <DraggableExpansion />
      <DraggableExpansion left />

      {children}
      {draggable && (
        <>
          <MoveButtonWrapper
            id={`${block.blockId}-move-button`}
            style={{
              opacity: isHovering ? 1 : 0,
              transition: "opacity 0.2s",
            }}
          >
            <ActionMoveButton />
          </MoveButtonWrapper>
          <ActionMinusButton
            onClick={onDelete}
            style={{
              opacity: isHovering ? 1 : 0,
              transition: "opacity 0.2s",
              position: "absolute",
              top: "0",
              right: "0",
              transform: "translate(160%, 70%)",
            }}
          />
        </>
      )}
    </Wrapper>
  );
};

export default DraggableBlock;
