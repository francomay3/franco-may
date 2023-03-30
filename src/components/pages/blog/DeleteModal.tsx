import { Dialog, Button } from "@/components/design-system";
import styled from "@emotion/styled";

const ButtonsWrapper = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[1]};
  justify-content: flex-end;
`;

const DeleteModal = ({
  isDialogOpen,
  setIsDialogOpen,
  onDelete,
}: {
  isDialogOpen: boolean;
  setIsDialogOpen: (value: boolean) => void;
  onDelete: () => void;
}) => {
  return (
    <Dialog
      isDialogOpen={isDialogOpen}
      setIsDialogOpen={setIsDialogOpen}
      title="Warning!"
    >
      <p>Are you sure you want to delete this post?</p>
      <ButtonsWrapper>
        <Button
          onClick={() => {
            setIsDialogOpen(false);
            onDelete();
          }}
          color="red"
        >
          Yes, delete
        </Button>
        <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
      </ButtonsWrapper>
    </Dialog>
  );
};

export default DeleteModal;
