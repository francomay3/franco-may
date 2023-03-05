import React, { useEffect } from "react";
import styled from "@emotion/styled";
import Icon from "@/components/Icon";

// Textarea that expands and contracts based on the content
const Textarea = styled.textarea``;

function temp() {
  return (
    <>
      <button
        onClick={() => {
          window.document.execCommand("bold");
        }}
      >
        <Icon id="format_bold" />
      </button>
      <button
        onClick={() => {
          window.document.execCommand("italic");
        }}
      >
        <Icon id="format_italic" />
      </button>
      <button
        onClick={() => {
          window.document.execCommand("underline");
        }}
      >
        <Icon id="format_underlined" />
      </button>
      <button
        onClick={() => {
          window.document.execCommand("strikeThrough");
        }}
      >
        <Icon id="format_strikethrough" />
      </button>

      <div
        contentEditable
        // onInput={(e) => {
        //   console.log(e.target.textContent);
        // }}
      >
        hola este es un textarea buenisimo! ahora que queres que haga? esto es
        lo mas lindo que podes hacer en tu vida. y? que mas? vamos a ver. que
        mas podemos hacer? podemos hacer muchas cosas. por ejemplo podemos hacer
        que este textarea se expanda y se contraiga. y tu mama tambien se
        expande y se contrae. y tu papa tambien se expande y se contrae. y tu
        hermano tambien se expande y se contrae. y tu hermana tambien se expande
        y se contrae. y tu perro tambien se expande y se contrae. y tu gato
        tambien se expande y se contrae. y tu tortuga tambien se expande y se
        contrae. y tu loro tambien se expande y se contrae. tu mama es una
        tortuga? no? tu papa es un loro? no? tu hermano es un loro? no? tu
        hermana es un loro? no? tu perro es un loro? no? tu gato es un loro? no?
        tu tortuga es un loro? no? tu loro es un loro? si! como me cojeria a tu
        mama. tiene la concha peluda. nunca se la depilo. y el ano tambien.
      </div>
    </>
  );
}

export default temp;
