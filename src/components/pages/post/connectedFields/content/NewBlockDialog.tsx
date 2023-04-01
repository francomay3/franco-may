// import { Dialog } from "@headlessui/react";
import styled from "@emotion/styled";
import Dialog from "../../../../design-system/Dialog";
import { blocksExamples } from "./blocks";
import { BlockData } from "./blocks/types";

const Block = styled.div`
  padding: 0;
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: 0.5rem;
  padding: 0.5rem;
`;

const BlockTitle = styled.h3`
  margin-bottom: 0.5rem;
  margin-inline-start: 0.5rem;
`;

const Blocks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const BlockSelectionWrapper = styled.div`
  border: 2px solid ${({ theme }) => theme.colors.lightblue};
  padding: 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  &:hover {
    border: 2px solid ${({ theme }) => theme.colors.darkblue};
  }
`;

const NewBlockDialog = ({
  isDialogOpen,
  setIsDialogOpen,
  addBlock,
}: {
  isDialogOpen: boolean;
  setIsDialogOpen: (value: boolean) => void;
  addBlock: (block: BlockData) => void;
}) => {
  return (
    <Dialog
      isDialogOpen={isDialogOpen}
      setIsDialogOpen={setIsDialogOpen}
      title="Add new block"
    >
      <Blocks>
        {blocksExamples.map(({ title, Component, data }) => (
          <Block key={title}>
            <BlockTitle>{title}</BlockTitle>
            <BlockSelectionWrapper onClick={() => addBlock(data)}>
              <Component />
            </BlockSelectionWrapper>
          </Block>
        ))}
      </Blocks>
    </Dialog>
  );
};

export default NewBlockDialog;
