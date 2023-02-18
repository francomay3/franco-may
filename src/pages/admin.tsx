import Header from "@/components/Header";
import styled from "@emotion/styled";
import { useState } from "react";
import dynamic from "next/dynamic";
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";
import useSaveToDB from "@/hooks/useSaveToDB";

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

const Wrapper = styled.div`
  h1 {
    margin-top: ${({ theme }) => theme.spacing[4]};
  }
  h3 {
    margin-bottom: ${({ theme }) => theme.spacing[4]};
  }
  h1,
  h3,
  #cheatsheet {
    margin-inline: ${({ theme }) => theme.spacing[4]};
  }
`;

const Admin = () => {
  const [value, setValue] = useState("");
  useSaveToDB(value);

  return (
    <Wrapper>
      <Header />
      <h1>Hello handsome.</h1>
      <div id="cheatsheet">
        <ul>
          <li>
            To add an image, just add a link. The link text will be the image
            name and the href its caption.
          </li>
        </ul>
      </div>
      <h3>Now do your thing! 👇</h3>
      <ReactQuill value={value} onChange={setValue} modules={modules} />
    </Wrapper>
  );
};

export default Admin;
