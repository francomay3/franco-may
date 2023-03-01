import React from "react";
import { Dialog } from "@headlessui/react";
import styled from "@emotion/styled";
import { useState } from "react";
import { uploadImage } from "./utils/utils";

const FORM_ID = "image-form";
const TITLE_ID = "image-title";
const CAPTION_ID = "image-caption";
const FILE_ID = "image-file";

const DialogWrapper = styled(Dialog)`
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.aWholeLot};
`;
const Panel = styled(Dialog.Panel)`
  background-color: ${({ theme }) => theme.colors.darkGrey};
  border-radius: ${({ theme }) => theme.borderRadius[3]};
  padding: ${({ theme }) => theme.spacing[4]};
  display: flex;
  gap: 1rem;
  flex-direction: column;
  color: ${({ theme }) => theme.colors.white};

  & > h2 {
    text-align: center;
  }
`;

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

const submitImage = async ({ e, title, caption, quillRef, index, setOpen }) => {
  e.preventDefault();
  const quill = quillRef.current.getEditor();
  const fileInput = document.querySelector(`#${FILE_ID}`);
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

function ImageUploadModal({ open, setOpen, quillRef, index }) {
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  return (
    <DialogWrapper open={open} onClose={() => setOpen(false)}>
      <Panel>
        <Dialog.Title>Upload an Image</Dialog.Title>
        <Form id={FORM_ID}>
          <FormSection>
            <label htmlFor={TITLE_ID}>Title</label>
            <input
              type="text"
              id={TITLE_ID}
              onChange={(e) => setTitle(e.target.value)}
              value={title}
            />
          </FormSection>
          <FormSection>
            <label htmlFor={CAPTION_ID}>Caption</label>
            <input
              type="text"
              id={CAPTION_ID}
              onChange={(e) => setCaption(e.target.value)}
              value={caption}
            />
          </FormSection>
          <FormSection>
            <label htmlFor={FILE_ID}>File</label>
            <input type="file" accept="image/*" id={FILE_ID} />
          </FormSection>
        </Form>
        <Footer>
          <button type="cancel" form={FORM_ID} onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button
            type="submit"
            form={FORM_ID}
            onClick={(e) =>
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
            Upload
          </button>
        </Footer>
      </Panel>
    </DialogWrapper>
  );
}

export default ImageUploadModal;
