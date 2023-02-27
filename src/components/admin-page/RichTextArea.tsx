import { useState, useRef, useEffect, forwardRef } from "react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import("react-quill");

    return ({ forwardedRef, ...props }) => <RQ ref={forwardedRef} {...props} />;
  },
  {
    ssr: false,
  }
);

import { Dialog } from "@headlessui/react";
import styled from "@emotion/styled";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const DialogWrapper = styled(Dialog)`
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10vw;
`;
const Panel = styled(Dialog.Panel)`
  background-color: grey;
  border-radius: 10px;
  padding: 3rem;
  border: 1px solid black;
`;
const modules = {
  toolbar: {
    container: [
      [{ header: [3, false] }],
      ["bold", "italic", "blockquote"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image"],
    ],
  },
};

const submitImage = ({ e, title, caption, quillRef, index, setOpen }) => {
  e.preventDefault();
  const quill = quillRef.current.getEditor();
  const file = document.querySelector("#image-file").files[0];

  uploadBytes(ref(getStorage(), `images/${title}`), file)
    .then(() => {
      getDownloadURL(ref(getStorage(), `images/${title}`))
        .then((url) => {
          quill.insertEmbed(index, "image", url);
          setOpen(false);
        })
        .catch((err) => console.log(err));
    })
    .catch((err) => console.log(err));
};

function RichTextArea() {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [fileChosen, setFileChosen] = useState(false);
  const quillRef = useRef(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!quillRef.current) return;
    const editor = quillRef.current.getEditor();
    editor.getModule("toolbar").addHandler("image", () => {
      setIndex(editor.getSelection().index);
      setOpen(true);
    });
  }, [quillRef.current]);

  return (
    <>
      <DialogWrapper open={open} onClose={() => setOpen(false)}>
        <Panel>
          <Dialog.Title>Upload an Image</Dialog.Title>
          <form>
            <label htmlFor="image-title">Title</label>
            <input
              type="text"
              id="image-title"
              onChange={(e) => setTitle(e.target.value)}
              value={title}
            />
            <label htmlFor="image-caption">Caption</label>
            <input
              type="text"
              id="image-caption"
              onChange={(e) => setCaption(e.target.value)}
              value={caption}
            />
            <label htmlFor="image-file">File</label>
            <input
              type="file"
              accept="image/*"
              id="image-file"
              onChange={(e) => setFileChosen(e.target.value ? true : false)}
            />
            <button
              type="submit"
              onClick={(e) =>
                submitImage({
                  e,
                  title,
                  caption,
                  file: fileChosen,
                  quillRef,
                  index,
                  setOpen,
                })
              }
            >
              Upload
            </button>
          </form>
          <button onClick={() => setOpen(false)}>Cancel</button>
        </Panel>
      </DialogWrapper>
      <ReactQuill
        value={value}
        onChange={setValue}
        modules={modules}
        forwardedRef={quillRef}
      />
    </>
  );
}

export default RichTextArea;
