import React from "react";
import { useState, useEffect } from "react";
import styled from "@emotion/styled";
import { Tab } from "@headlessui/react";
import Image from "next/image";
import { getImages } from "@/utils/storageUtils";
import Dialog from "@/components/design-system/Dialog";
import { ImageData } from "@/utils/types";
import Icon from "@/components/design-system/Icon";
import Card from "@/components/design-system/Card";
import { uploadImage } from "@/utils/storageUtils";

const ImagesWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  align-content: center;
  gap: ${({ theme }) => theme.spacing[2]};
  & > * {
    &:hover {
      opacity: 0.8;
    }
    & img {
      object-fit: cover;
      flex: 1;
      height: 100px;
      min-width: 100px;
      max-width: 150px;
    }
    cursor: pointer;
  }
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[1]};
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

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[2]};
  background-color: ${({ theme }) => theme.colors.darkGreen};
  color: white;
  padding-block: ${({ theme }) => theme.spacing[2]};
  padding-inline: ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.borderRadius[3]};
  flex: 1;
  cursor: pointer;
  &:hover {
    opacity: 0.8;
  }
  overflow: hidden;
`;

const ImagePreview = styled.div`
  background-size: cover;
  background-position: center;
  height: 100%;
  width: 100%;
  border-radius: ${({ theme }) => theme.borderRadius[3]};
`;

const FileUpload = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[5]};
  height: 100%;
  align-items: stretch;
`;

const Fields = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  height: fit-content;
  align-self: center;
  input {
    padding: ${({ theme }) => theme.spacing[2]};
    border-radius: ${({ theme }) => theme.borderRadius[3]};
    border: 1px solid ${({ theme }) => theme.colors.lightGrey};
    &:focus {
      outline: none;
      border: 2px solid ${({ theme }) => theme.colors.darkGreen};
    }
  }
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileData, setFileData] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    getImages()
      .then((images) => setImages(images))
      .catch(() => null);
  }, []);

  const selectImage = async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const file = await window.showOpenFilePicker({
      types: [
        {
          description: "Image",
          accept: {
            "image/*": [".png", ".jpg", ".jpeg"],
          },
        },
      ],
    });
    const fileHandle = file[0];
    const fileData = await fileHandle.getFile();
    const fileUrl = URL.createObjectURL(fileData);
    const fileName = fileData.name;
    setFileName(fileName);
    setImagePreview(fileUrl);
    setFileData(fileData);
  };

  const handleOnUpload = () => {
    if (fileData) {
      uploadImage(fileData, fileName || "image")
        .then((image) => {
          onSelect(image);
          return setIsDialogOpen(false);
        })
        .catch(() => null);
    }
  };

  return (
    <Dialog
      isDialogOpen={isDialogOpen}
      setIsDialogOpen={setIsDialogOpen}
      title="Select or upload image"
    >
      <TabGroup as="div">
        <TabOptions>
          <TabOption>
            <Icon id="image" />
            Gallery
          </TabOption>
          <TabOption>
            <Icon id="upload" />
            Upload
          </TabOption>
        </TabOptions>
        <TabPanels>
          <Tab.Panel>
            <ImagesWrapper>
              {images.map(({ url, name }) => (
                <Card key={url} onClick={() => onSelect({ url, name })}>
                  <Image alt={name} src={url} />
                </Card>
              ))}
            </ImagesWrapper>
          </Tab.Panel>
          <Tab.Panel style={{ height: "100%" }}>
            <FileUpload>
              <Fields>
                <Button onClick={selectImage}>
                  Browse Image <Icon id="image" />
                </Button>
                {imagePreview && (
                  <>
                    <input
                      onChange={(e) => {
                        setFileName(e.target.value);
                      }}
                      placeholder="Image Name"
                      type="text"
                      value={fileName || ""}
                    />

                    <Button onClick={handleOnUpload}>
                      <strong>UPLOAD</strong> <Icon id="upload" />
                    </Button>
                  </>
                )}
              </Fields>
              <Card style={{ flex: 4 }}>
                {imagePreview && (
                  <ImagePreview
                    style={{
                      backgroundImage: `url(${imagePreview})`,
                    }}
                  />
                )}
              </Card>
            </FileUpload>
          </Tab.Panel>
        </TabPanels>
      </TabGroup>
    </Dialog>
  );
};

export default ImageSelectionDialog;
