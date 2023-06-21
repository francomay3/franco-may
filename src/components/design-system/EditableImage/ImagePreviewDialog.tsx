import Image from "next/image";
import { useTheme } from "@emotion/react";
import { Dialog, Stack } from "@/components/design-system";

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
      <Stack gap="0" style={{ alignItems: "center" }}>
        <Image
          alt="Image preview"
          height={1000 / theme.aspectRatio}
          objectFit="contain"
          src={src}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            borderRadius: theme.borderRadius,
          }}
          width={1000}
        />
      </Stack>
    </Dialog>
  );
};

export default ImagePreviewDialog;
