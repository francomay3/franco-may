import Image from "next/image";
import { useState } from "react";
import { ActionEditButton } from "./design-system/ActionButtons";
import ImageSelectionDialog from "./ImageSelectionDialog";
import { ImageData } from "@/utils/types";
import { useTheme } from "@emotion/react";

interface EditableImageProps {
  name: string;
  isEditingEnabled?: boolean;
  src?: string;
  onSelect?: (image: ImageData) => void;
}

const EditableImage = ({
  name,
  isEditingEnabled = false,
  src,
  onSelect = () => null,
}: EditableImageProps) => {
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const theme = useTheme();

  return (
    <>
      <ImageSelectionDialog
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        onSelect={onSelect}
      />
      <Image
        style={{
          cursor: isEditingEnabled ? "pointer" : "default",
        }}
        alt={name}
        draggable={!isEditingEnabled}
        fill
        objectFit="cover"
        onClick={() => (isEditingEnabled ? setIsDialogOpen(true) : undefined)}
        onMouseEnter={() => {
          isEditingEnabled && setIsHoveringImage(true);
        }}
        onMouseLeave={() => setIsHoveringImage(false)}
        sizes={`
          ${theme.mobile} 100vw,
          ${theme.tablet} 50vw,
          25vw
        `}
        src={src || `/images/${name}`}
      />
      {isHoveringImage && (
        <ActionEditButton
          style={{
            position: "absolute",
            top: "0.8rem",
            right: "0.8rem",
          }}
        />
      )}
    </>
  );
};

export default EditableImage;
