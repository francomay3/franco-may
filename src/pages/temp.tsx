import React, { useEffect } from "react";
import styled from "@emotion/styled";
import Icon from "@/components/Icon";
import { useState } from "react";

const Toolbar = styled.div`
  display: flex;
  background-color: ${({ theme }) => theme.colors.lightGrey};
  padding: 4px;
`;

const ToolbarButton = styled.button`
  background-color: ${({ theme }) => theme.colors.white};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  aspect-ratio: 4/3;
  border: 1px solid ${({ theme }) => theme.colors.grey};
  &:not(:last-child) {
    border-right: none;
  }
  &:last-child {
    border-start-end-radius: 4px;
    border-end-end-radius: 4px;
  }
  &:first-child {
    border-start-start-radius: 4px;
    border-end-start-radius: 4px;
  }
  &:hover {
    background-color: ${({ theme }) => theme.colors.lightGrey};
  }
`;

const exampleData = [
  { content: "Hello", type: "text" },
  {
    type: "image",
    src: "https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg",
  },
  { content: "world!", type: "text" },
];

function temp() {
  const [state, setState] = useState(exampleData);
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      window.document.execCommand("insertHTML", false, "<h2>hello</h2");
    }
  };
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>, blockId: number) => {
    setState((prev) => {
      const newState = [...prev];
      newState[blockId].content = e.target.innerHTML;
      return newState;
    });
  };

  return (
    <>
      <Toolbar>
        {["bold", "italic", "underline", "strikeThrough"].map((id) => (
          <ToolbarButton
            onClick={() => {
              window.document.execCommand(id);
            }}
          >
            <Icon id={id} />
          </ToolbarButton>
        ))}
      </Toolbar>

      {state.map((data, i) => {
        switch (data.type) {
          case "text":
            return (
              <div
                contentEditable
                onBlur={(e) => handleBlur(e, i)}
                dangerouslySetInnerHTML={{ __html: data.content }}
              />
            );
          case "image":
            return <img src={data.src} style={{ maxWidth: "50%" }} />;
        }
      })}
    </>
  );
}

export default temp;
