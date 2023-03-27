import Image from "next/image";
import { useState } from "react";
import styled from "@emotion/styled";
import { ActionEditButton } from "./design-system/ActionButtons";
import ImageSelectionDialog from "./ImageSelectionDialog";
import { ImageData } from "@/utils/types";

type Size = "small" | "medium" | "large" | "thumbnail";
interface EditableImageProps {
  name: string;
  isEditingEnabled?: boolean;
  src?: string;
  onSelect?: (image: ImageData) => void;
  size?: Size;
  style?: React.CSSProperties;
  wrapperStyles?: React.CSSProperties;
}

const ImageWrapper = styled.div<{
  isEditingEnabled?: boolean;
  size: number;
}>`
  width: 100%;
  max-width: 100vw;
  aspect-ratio: ${({ theme }) => theme.aspectRatio} / 1;
  position: relative;
  border-radius: ${({ theme }) => theme.borderRadius[4]};
  overflow: hidden;
  display: flex;
  justify-content: center;
  cursor: ${({ isEditingEnabled }) =>
    isEditingEnabled ? "pointer" : "default"};
`;

const EditableImage = ({
  name,
  isEditingEnabled = false,
  src,
  size = "medium",
  onSelect = () => null,
  style,
  wrapperStyles,
}: EditableImageProps) => {
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const sizes = {
    thumbnail: 80,
    small: 160,
    medium: 320,
    large: 640,
  };

  return (
    <>
      <ImageSelectionDialog
        isDialogOpen={isDialogOpen}
        onSelect={onSelect}
        setIsDialogOpen={setIsDialogOpen}
      />
      <ImageWrapper
        isEditingEnabled={isEditingEnabled}
        size={sizes[size]}
        style={wrapperStyles}
      >
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
          sizes={sizes[size] + "px"}
          src={src || `/images/${name}`}
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            ...style,
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
      </ImageWrapper>
    </>
  );
};

export default EditableImage;
