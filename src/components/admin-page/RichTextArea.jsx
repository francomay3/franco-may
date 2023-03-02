import { useState, useRef, useEffect } from "react";
import "react-quill/dist/quill.snow.css";
import RQ from "react-quill";
import ImageUploadModal from "./ImageUploadModal";

const ReactQuill = ({ forwardedRef, ...props }) => (
  <RQ ref={forwardedRef} {...props} />
);

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

function RichTextArea({ value, setValue }) {
  const [open, setOpen] = useState(false);
  const quillRef = useRef(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!quillRef.current) return;
    const editor = quillRef.current.getEditor();
    editor.getModule("toolbar").addHandler("image", () => {
      setIndex(editor.getSelection().index);
      setOpen(true);
    });
  }, []);

  return (
    <>
      <ImageUploadModal
        open={open}
        setOpen={setOpen}
        quillRef={quillRef}
        index={index}
      />
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
