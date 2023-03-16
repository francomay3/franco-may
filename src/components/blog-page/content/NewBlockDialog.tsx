import { Dialog } from "@headlessui/react";
import styled from "@emotion/styled";
import { ReactNode } from "react";
import { MinusButton } from "../ActionButtons";
import { blocksExamples } from "./blocks";
import { BlockData } from "./blocks/types";

const BackDrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: ${({ theme }) => theme.zIndex.modalBackdrop};
`;

const Panel = styled(Dialog.Panel)<{ children: ReactNode }>`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  max-width: 800px;
  background-color: white;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  z-index: ${({ theme }) => theme.zIndex.modal};
  & .closedialog {
    position: absolute;
    top: 1rem;
    right: 1rem;
  }
`;

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
  border: 2px solid ${({ theme }) => theme.colors.lightBlue};
  padding: 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  &:hover {
    border: 2px solid ${({ theme }) => theme.colors.darkBlue};
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
    <Dialog onClose={() => setIsDialogOpen(false)} open={isDialogOpen}>
      <BackDrop aria-hidden="true" />
      <Panel>
        <Dialog.Title style={{ marginBottom: "1.5rem" }}>
          Choose New Block
        </Dialog.Title>

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

        <MinusButton
          className="closedialog"
          onClick={() => setIsDialogOpen(false)}
        />
      </Panel>
    </Dialog>
  );
};

export default NewBlockDialog;
