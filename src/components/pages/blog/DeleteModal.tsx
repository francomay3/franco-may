import styled from "@emotion/styled";
import { Dialog, Button } from "@/components/design-system";

const ButtonsWrapper = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[1]};
  justify-content: flex-end;
`;

const DeleteModal = ({
  isDialogOpen,
  setIsDialogOpen,
  onDelete,
  slug,
  title,
}: {
  slug: string;
  title: string;
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
      <p>
        <strong>title:</strong> {title}
      </p>
      <p>
        <strong>slug:</strong> {slug}
      </p>

      <ButtonsWrapper>
        <Button
          color="danger"
          onClick={() => {
            setIsDialogOpen(false);
            onDelete();
          }}
        >
          Yes, delete
        </Button>
        <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
      </ButtonsWrapper>
    </Dialog>
  );
};

export default DeleteModal;
