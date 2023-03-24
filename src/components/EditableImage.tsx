import Image from "next/image";
import { useState } from "react";
import { ActionEditButton } from "./design-system/ActionButtons";
import ImageSelectionDialog from "./ImageSelectionDialog";
import { ImageData } from "@/utils/types";

interface EditableImageProps {
  name: string;
  isEditingEnabled?: boolean;
  src?: string;
  onSelect: (image: ImageData) => void;
}

const EditableImage = ({
  name,
  isEditingEnabled = false,
  src,
  onSelect,
}: EditableImageProps) => {
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <ImageSelectionDialog
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        onSelect={onSelect}
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
        sizes="(max-width: 640px) 100vw, 320px"
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
