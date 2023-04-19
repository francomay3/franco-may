import {
  Card,
  Dialog,
  EditableImage,
  Icon,
  toast,
} from "@/components/design-system";
import Image from "next/image";
import styled from "@emotion/styled";
import { useTheme } from "@emotion/react";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

interface ImagePreviewDialogProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (value: boolean) => void;
  src: string;
}

const ImagePreviewDialog = ({
  isDialogOpen,
  setIsDialogOpen,
  src,
}: ImagePreviewDialogProps) => {
  const theme = useTheme();
  return (
    <Dialog
      isDialogOpen={isDialogOpen}
      setIsDialogOpen={setIsDialogOpen}
      title="Image preview"
    >
      <Container>
        <Image
          src={src}
          alt="Image preview"
          width={1000}
          height={1000 / theme.aspectRatio}
          objectFit="contain"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            borderRadius: theme.borderRadius[4],
          }}
        />
      </Container>
    </Dialog>
  );
};

export default ImagePreviewDialog;
