import React from "react";
import { useState, useEffect } from "react";
import styled from "@emotion/styled";
import Image from "next/image";
import { ImageData } from "@/utils/types";
import {
  Button,
  Card,
  Dialog,
  Icon,
  Tabs,
  toast,
} from "@/components/design-system";
import { uploadImage, getImages } from "@/utils/storageUtils";

const ImagesWrapper = styled.div`
  align-content: center;
  align-items: center;
  display: grid;
  gap: 3px;
  grid-template-columns: repeat(auto-fill, 100px);
  justify-content: center;
  justify-items: center;
  overflow-y: scroll;
`;

const Thumbnail = styled(Image)`
  border-radius: 4px;
  cursor: pointer;
  flex: 1;
  height: 100px;
  max-width: 150px;
  min-width: 100px;
  object-fit: cover;

  &:hover {
    opacity: 0.8;
  }
`;

const ImagePreview = styled.div`
  background-position: center;
  background-size: cover;
  border-radius: ${({ theme }) => theme.borderRadius[3]};
  height: 100%;
  width: 100%;
`;

const FileUpload = styled.div`
  align-items: center;
  align-items: stretch;
  display: flex;
  gap: 1.25rem;
  height: 100%;
  justify-content: center;
`;

const Fields = styled.div`
  align-self: center;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  height: fit-content;

  input {
    border-radius: ${({ theme }) => theme.borderRadius[3]};
    border: 1px solid ${({ theme }) => theme.colors.lightgrey};
    padding: 0.5rem;

    &:focus {
      border: 2px solid ${({ theme }) => theme.colors.darkgreen};
      outline: none;
    }
  }
`;

const ImageSelectionDialog = ({
  isDialogOpen,
  onSelect,
  setIsDialogOpen,
}: {
  isDialogOpen: boolean;
  onSelect: (image: ImageData) => any;
  setIsDialogOpen: (value: boolean) => void;
}) => {
  const [fileData, setFileData] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [images, setImages] = useState<ImageData[]>([]);

  useEffect(() => {
    if (isDialogOpen) {
      getImages()
        .then((images) => setImages(images))
        .catch(() => null);
    }
  }, [isDialogOpen]);

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

  const handleOnUpload = async () => {
    if (fileData) {
      const res: ImageData = await toast.promise(
        uploadImage(fileData, fileName || "image"),
        {
          pending: "Uploading image...",
          success: "Image uploaded",
          error: "Error uploading image",
        }
      );
      onSelect(res);
      setIsDialogOpen(false);
    }
  };

  return (
    <Dialog
      isDialogOpen={isDialogOpen}
      setIsDialogOpen={setIsDialogOpen}
      title="Select or upload image"
    >
      <Tabs
        data={[
          {
            title: "Gallery",
            content: (
              <ImagesWrapper>
                {images.map(({ url, name }) => (
                  <Thumbnail
                    alt={name}
                    height={100}
                    key={url}
                    objectFit="cover"
                    onClick={() => {
                      onSelect({ url, name });
                      setIsDialogOpen(false);
                    }}
                    src={url}
                    width={100}
                  />
                ))}
              </ImagesWrapper>
            ),
          },
          {
            title: "Upload",
            content: (
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
            ),
          },
        ]}
      />
    </Dialog>
  );
};

export default ImageSelectionDialog;
