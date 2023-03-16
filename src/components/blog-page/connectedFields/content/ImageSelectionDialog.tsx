import React from "react";
import { useState, useEffect } from "react";
import styled from "@emotion/styled";
import { getImages, ImageData } from "@/utils/storageUtils";
import Dialog from "@/components/Dialog";

const Thumbnail = styled.img`
  width: 100px;
  height: 100px;
  object-fit: cover;
`;

const ImagesWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  align-content: center;
  gap: 1rem;
`;

const ThumbnailWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid ${({ theme }) => theme.colors.lightGrey};
  border-radius: 1rem;
  overflow: hidden;
`;

const ImageSelectionDialog = ({
  isDialogOpen,
  setIsDialogOpen,
  onSelect,
}: {
  isDialogOpen: boolean;
  setIsDialogOpen: (value: boolean) => void;
  onSelect: (image: ImageData) => any;
}) => {
  const [images, setImages] = useState<ImageData[]>([]);

  useEffect(() => {
    getImages()
      .then((images) => setImages(images))
      .catch(() => null);
  }, []);

  return (
    <Dialog
      isDialogOpen={isDialogOpen}
      setIsDialogOpen={setIsDialogOpen}
      title="Select or upload image"
    >
      <ImagesWrapper>
        {images.map(({ url, name }) => (
          <ThumbnailWrapper key={url} onClick={() => onSelect({ url, name })}>
            <Thumbnail alt={name} src={url} />
            <p>{name}</p>
          </ThumbnailWrapper>
        ))}
      </ImagesWrapper>
    </Dialog>
  );
};

export default ImageSelectionDialog;
