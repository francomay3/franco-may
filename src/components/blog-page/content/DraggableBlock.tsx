import styled from "@emotion/styled";
import { ReactNode } from "react";
import { MoveButton } from "../ActionButtons";
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

const DraggableBlock = ({
  children,
  draggable,
  block,
  setDraggedBlock,
}: {
  children: ReactNode;
  draggable: boolean;
  block: BlockData;
  setDraggedBlock: (block: BlockData | null) => void;
}) => {
  return (
    <Wrapper
      draggable={draggable}
      onDragEnd={() => {
        setDraggedBlock(null);
      }}
      onDragStart={() => {
        setDraggedBlock(block);
      }}
    >
      {children}
      {draggable && (
        <MoveButtonWrapper id={`${block.blockId}-move-button`}>
          <MoveButton />
        </MoveButtonWrapper>
      )}
    </Wrapper>
  );
};

export default DraggableBlock;
