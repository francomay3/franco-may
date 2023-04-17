import Image from "next/image";
import { useState } from "react";
import styled from "@emotion/styled";
import { ActionEditButton } from "../ActionButtons";
import ImageSelectionDialog from "./ImageSelectionDialog";
import { ImageData } from "@/utils/types";
import { useAuth } from "@/providers/AuthProvider";

type Size = "small" | "medium" | "large" | "thumbnail";
interface EditableImageProps {
  name: string;
  src?: string;
  onSelect?: (image: ImageData) => void;
  size?: Size;
  style?: React.CSSProperties;
  wrapperStyles?: React.CSSProperties;
}

const ImageWrapper = styled.div<{
  isEditing?: boolean;
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
  cursor: ${({ isEditing }) => (isEditing ? "pointer" : "default")};
`;

const EditableImage = ({
  name,
  src,
  size = "medium",
  onSelect = () => null,
  style,
  wrapperStyles,
}: EditableImageProps) => {
  const { isEditing } = useAuth();
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
        isEditing={isEditing}
        size={sizes[size]}
        style={wrapperStyles}
      >
        <Image
          alt={name}
          draggable={!isEditing}
          fill
          objectFit="cover"
          onClick={() => (isEditing ? setIsDialogOpen(true) : undefined)}
          onMouseEnter={() => {
            isEditing && setIsHoveringImage(true);
          }}
          onMouseLeave={() => setIsHoveringImage(false)}
          sizes={`${sizes[size]}px`}
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
