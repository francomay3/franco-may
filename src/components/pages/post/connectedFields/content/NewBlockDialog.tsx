import styled from "@emotion/styled";
import { blocksExamples } from "./blocks";
import { BlockData } from "./blocks/types";
import { Stack, Dialog } from "@/components/design-system";

const Block = styled.div`
  padding: 0;
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius};
  padding: 0.5rem;
`;

const BlockTitle = styled.h3`
  margin-bottom: 0.5rem;
  margin-inline-start: 0.5rem;
`;

const BlockSelectionWrapper = styled.div`
  border: 2px solid ${({ theme }) => theme.colors.lightblue};
  padding: 0.5rem;
  border-radius: ${({ theme }) => theme.borderRadius};
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
      <Stack gap="1rem">
        {blocksExamples.map(({ title, Component, data }) => (
          <Block key={title}>
            <BlockTitle>{title}</BlockTitle>
            <BlockSelectionWrapper
              onClick={() =>
                addBlock({ ...data, blockId: new Date().getTime() })
              }
            >
              <Component />
            </BlockSelectionWrapper>
          </Block>
        ))}
      </Stack>
    </Dialog>
  );
};

export default NewBlockDialog;
