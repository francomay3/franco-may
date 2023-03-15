import { BlockData } from "./blocks/types";
import { MoveButton } from "../ActionButtons";
import styled from "@emotion/styled";
import { useState } from "react";

const MoveButtonWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  transform: translate(-160%, 70%);
`;
const Wrapper = styled.div`
  position: relative;
`;

const DraggableBlock = ({
  children,
  draggable,
  block,
  setDraggedBlock,
}: {
  children: React.ReactNode;
  draggable: boolean;
  block: BlockData;
  setDraggedBlock: (block: BlockData | null) => void;
}) => {
  return (
    <Wrapper
      draggable={draggable}
      onDragStart={() => {
        setDraggedBlock(block);
      }}
      onDragEnd={() => {
        setDraggedBlock(null);
      }}
    >
      {children}
      <MoveButtonWrapper id={`${block.blockId}-move-button`}>
        <MoveButton />
      </MoveButtonWrapper>
    </Wrapper>
  );
};

export default DraggableBlock;
