import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import styled from "@emotion/styled";
import { useTheme, Theme } from "@emotion/react";
import { uploadImage } from "../../utils/storageUtils";

const FORM_ID = "image-form";
const TITLE_ID = "image-title";
const CAPTION_ID = "image-caption";
const FILE_ID = "image-file";

const DialogWrapper = (theme: Theme) => ({
  width: "100%",
  height: "100%",
  position: "fixed",
  top: 0,
  left: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing.aWholeLot,
});

const Panel = (theme: Theme) => ({
  backgroundColor: theme.colors.darkGrey,
  borderRadius: theme.borderRadius[3],
  padding: theme.spacing[4],
  display: "flex",
  gap: "1rem",
  flexDirection: "column",
  color: theme.colors.white,
});

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const FormSection = styled.div`
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  & > input {
    width: 100%;
  }
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: ${({ theme }) => theme.spacing[3]};
`;

interface submitImageArgs {
  e: React.FormEvent<HTMLFormElement>;
  title: string;
  caption: string;
  quillRef: React.MutableRefObject<any>;
  index: number;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const submitImage = async ({
  e,
  title,
  caption,
  quillRef,
  index,
  setOpen,
}: submitImageArgs) => {
  e.preventDefault();
  const quill = quillRef.current.getEditor();
  const fileInput: HTMLInputElement | null = document.querySelector(
    `#${FILE_ID}`
  );
  const file = fileInput?.files ? fileInput.files[0] : null;

  // TODO: Alert user to fill out all fields. Maybe use a toast?
  if (!file || !title || !caption) {
    if (!file) {
      console.warn("No file selected");
    }
    if (!title) {
      console.warn("No title provided");
    }
    if (!caption) {
      console.warn("No caption provided");
    }
    return;
  }

  const url = await uploadImage(file, title);
  const p = document.createElement("p");
  p.innerText = JSON.stringify({ title, caption, url });
  p.setAttribute("class", "image");
  const img = document.createElement("img");
  img.setAttribute("alt", JSON.stringify({ title, caption, url }));
  img.setAttribute("src", url);
  quill.clipboard.dangerouslyPasteHTML(index, img.outerHTML);
  setOpen(false);
};

interface ImageUploadModalProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  quillRef: React.MutableRefObject<any>;
  index: number;
}

function ImageUploadModal({
  open,
  setOpen,
  quillRef,
  index,
}: ImageUploadModalProps) {
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const theme = useTheme();
  return (
    <Dialog
      onClose={() => setOpen(false)}
      open={open}
      style={DialogWrapper(theme) as React.CSSProperties}
    >
      <Dialog.Panel style={Panel(theme) as React.CSSProperties}>
        <Dialog.Title>Upload an Image</Dialog.Title>
        <Form
          id={FORM_ID}
          onSubmit={(e) =>
            submitImage({
              e,
              title,
              caption,
              quillRef,
              index,
              setOpen,
            })
          }
        >
          <FormSection>
            <label htmlFor={TITLE_ID}>Title</label>
            <input
              id={TITLE_ID}
              onChange={(e) => setTitle(e.target.value)}
              type="text"
              value={title}
            />
          </FormSection>
          <FormSection>
            <label htmlFor={CAPTION_ID}>Caption</label>
            <input
              id={CAPTION_ID}
              onChange={(e) => setCaption(e.target.value)}
              type="text"
              value={caption}
            />
          </FormSection>
          <FormSection>
            <label htmlFor={FILE_ID}>File</label>
            <input accept="image/*" id={FILE_ID} type="file" />
          </FormSection>
        </Form>
        <Footer>
          <button form={FORM_ID} onClick={() => setOpen(false)} type="reset">
            Cancel
          </button>
          <button form={FORM_ID} type="submit">
            Upload
          </button>
        </Footer>
      </Dialog.Panel>
    </Dialog>
  );
}

export default ImageUploadModal;
