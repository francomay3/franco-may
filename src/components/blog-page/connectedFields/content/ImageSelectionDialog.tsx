import React from "react";
import { useState, useEffect } from "react";
import styled from "@emotion/styled";
import { getImages } from "@/utils/storageUtils";
import Dialog from "@/components/Dialog";
import { ImageData } from "@/utils/types";
import { Tab } from "@headlessui/react";

const Thumbnail = styled.img`
  width: 100px;
  height: 100px;
  object-fit: cover;
  &:hover {
    opacity: 0.8;
  }
`;

const ImagesWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  align-content: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const ThumbnailWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid ${({ theme }) => theme.colors.lightGrey};
  border-radius: ${({ theme }) => theme.borderRadius[3]};
  overflow: hidden;
  background-color: white;
  cursor: pointer;
`;

const TabOptions = styled(Tab.List)<{ children: React.ReactNode }>`
  background-color: ${({ theme }) => theme.colors.lightGrey};
  display: flex;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => theme.spacing[1]};
  width: fit-content;
  border-radius: ${({ theme }) => theme.borderRadius[3]};
`;

const TabPanels = styled(Tab.Panels)<{ children: React.ReactNode }>`
  height: 50vh;
  overflow-y: scroll;
  padding: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius[3]};
  background-color: ${({ theme }) => theme.colors.lightGrey};
  overflow: hidden;
`;

const TabOption = styled(Tab)<{ children: React.ReactNode }>`
  height: 100%;
  padding: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius[3]};
  cursor: pointer;
  &[data-headlessui-state="selected"] {
    background-color: white;
    color: ${({ theme }) => theme.colors.black};
  }
`;

const TabGroup = styled(Tab.Group)<{ as: string; children: React.ReactNode }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
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
      <TabGroup as="div">
        <TabOptions>
          <TabOption>Choose</TabOption>
          <TabOption>Upload</TabOption>
        </TabOptions>
        <TabPanels>
          <Tab.Panel>
            <ImagesWrapper>
              {images.map(({ url, name }) => (
                <ThumbnailWrapper
                  key={url}
                  onClick={() => onSelect({ url, name })}
                >
                  <Thumbnail alt={name} src={url} />
                  <p>{name}</p>
                </ThumbnailWrapper>
              ))}
            </ImagesWrapper>
          </Tab.Panel>
          <Tab.Panel>Upload</Tab.Panel>
        </TabPanels>
      </TabGroup>
    </Dialog>
  );
};

export default ImageSelectionDialog;
