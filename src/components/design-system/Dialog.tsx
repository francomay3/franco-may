import { Dialog as HeadlessDialog } from "@headlessui/react";
import styled from "@emotion/styled";
import { ReactNode } from "react";
import { useTheme } from "@emotion/react";
import { ActionMinusButton } from "./ActionButtons";

const BackDrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(
    0,
    0,
    0,
    ${({ theme }) => theme.dialog.backdropIntensity}
  );
  z-index: ${({ theme }) => theme.zIndex.modalBackdrop};
`;

const Panel = styled(HeadlessDialog.Panel)<{ children: ReactNode }>`
  border: 1px solid ${({ theme }) => theme.dialog.borderColor};
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  max-width: min(800px, 95vw);
  background-color: ${({ theme }) => theme.dialog.backgroundColor};
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  z-index: ${({ theme }) => theme.zIndex.modal};
`;

const Dialog = ({
  isDialogOpen,
  setIsDialogOpen,
  title,
  children,
}: {
  isDialogOpen: boolean;
  setIsDialogOpen: (value: boolean) => void;
  title: string;
  children: ReactNode;
}) => {
  const theme = useTheme();
  return (
    <HeadlessDialog onClose={() => setIsDialogOpen(false)} open={isDialogOpen}>
      <BackDrop aria-hidden="true" />
      <Panel>
        <HeadlessDialog.Title
          style={{ marginBottom: "1.5rem", color: theme.colors.text }}
        >
          {title}
        </HeadlessDialog.Title>
        <ActionMinusButton
          onClick={() => setIsDialogOpen(false)}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
          }}
        />
        {children}
      </Panel>
    </HeadlessDialog>
  );
};

export default Dialog;
