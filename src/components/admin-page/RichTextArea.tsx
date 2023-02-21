import { useState } from "react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const modules = {
  toolbar: [
    [
      { header: [3, false] },
      "bold",
      "italic",
      "blockquote",
      { list: "ordered" },
      { list: "bullet" },
      "link",
    ],
  ],
};

function RichTextArea() {
  const [value, setValue] = useState("");

  return <ReactQuill value={value} onChange={setValue} modules={modules} />;
}

export default RichTextArea;
