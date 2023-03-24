import Image from "next/image";
import { useState } from "react";
import { useTheme } from "@emotion/react";
import { ActionEditButton } from "./design-system/ActionButtons";
import ImageSelectionDialog from "./ImageSelectionDialog";
import { ImageData } from "@/utils/types";

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
        onSelect={onSelect}
        setIsDialogOpen={setIsDialogOpen}
      />
      <Image
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
        style={{
          cursor: isEditingEnabled ? "pointer" : "default",
        }}
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
