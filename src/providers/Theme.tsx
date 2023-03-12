import { ThemeProvider } from "@emotion/react";
import "@emotion/react";
import { useState } from "react";

declare module "@emotion/react" {
  export interface Theme {
    colors: {
      black: string;
      lightBlack: string;
      darkGrey: string;
      grey: string;
      lightGrey: string;
      white: string;
      red: string;
      orange: string;
      green: string;
      lightBlue: string;
      blue: string;
      violet: string;
      darkBlue: string;
      link: {
        text: string;
        underline: string;
        hover: string;
      };
    };
    spacing: {
      0: string;
      1: string;
      2: string;
      3: string;
      4: string;
      5: string;
      6: string;
      7: string;
      8: string;
      aBit: string;
      aLot: string;
      aWholeLot: string;
    };
    mobile: string;
    tablet: string;
    borderRadius: {
      1: string;
      2: string;
      3: string;
      4: string;
    };
  }
}

const smallScreen = 550;
const mediumScreen = 900;
export const mobile = `(max-width: ${smallScreen}px)`;
export const tablet = `(min-width: ${
  smallScreen + 1
}px) and (max-width: ${mediumScreen}px)`;

export const theme = {
  colors: {
    black: "#0d1117",
    lightBlack: "#161b22",
    darkGrey: "#21262d",
    grey: "#89929b",
    lightGrey: "#c6cdd5",
    white: "#ecf2f8",
    red: "#fa7970",
    orange: "#faa356",
    green: "#7ce38b",
    lightBlue: "#a2d2fb",
    blue: "#77bdfb",
    violet: "#cea5fb",
    darkBlue: "#459ae4",
    link: {
      text: "#0969da",
      underline: "rgba(0, 127, 255, 0.4)",
      hover: "#0057b8",
    },
  },
  spacing: {
    0: "0",
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    7: "1.75rem",
    8: "2rem",
    aBit: "0.5rem",
    aLot: "3rem",
    aWholeLot: "8rem",
  },
  mobile: `@media only screen and (max-width: ${smallScreen}px)`,
  tablet: `@media only screen and (min-width: ${
    smallScreen + 1
  }px) and (max-width: ${mediumScreen}px)`,
  borderRadius: {
    1: "0.125rem",
    2: "0.25rem",
    3: "0.5rem",
    4: "1rem",
  },
};

export default function Theme({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
