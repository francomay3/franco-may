import { ThemeProvider } from "@emotion/react";
import "@emotion/react";

const theme = {
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
  },
};
export default function Theme({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
