const smallScreen = 550;
const mediumScreen = 900;

const lightTheme = {
  aspectRatio: 1.4,
  shadows: {
    1: "1px 2px 4px rgb(0 0 0 / 40%)",
    2: "3px 4px 8px rgb(0 0 0 / 20%)",
    3: "5px 6px 16px rgb(0 0 0 / 15%)",
  },
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    offcanvas: 1050,
    modal: 1060,
    popover: 1070,
    tooltip: 1080,
  },
  colors: {
    lightRed: "#fce1e1",
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
    darkGreen: "#53c563",
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
  mediaQueries: {
    mobile: `@media only screen and (max-width: ${smallScreen}px)`,
    tablet: `@media only screen and (min-width: ${
      smallScreen + 1
    }px) and (max-width: ${mediumScreen}px)`,
  },
  breakpoints: {
    mobile: smallScreen,
    tablet: mediumScreen,
  },
  borderRadius: {
    1: "0.125rem",
    2: "0.25rem",
    3: "0.5rem",
    4: "1rem",
  },
};

const darkColors = {
  ...lightTheme.colors,
  black: "#ecf2f8",
  lightBlack: "#c6cdd5",
  darkGrey: "#89929b",
  grey: "#21262d",
  lightGrey: "#161b22",
  white: "#0d1117",
  red: "#fa7970",
  orange: "#faa356",
  green: "#7ce38b",
  lightBlue: "#a2d2fb",
  blue: "#77bdfb",
  violet: "#cea5fb",
  darkBlue: "#459ae4",
  darkGreen: "#53c563",
  link: {
    text: "#0969da",
    underline: "rgba(0, 127, 255, 0.4)",
    hover: "#0057b8",
  },
};

const darkTheme = {
  ...lightTheme,
  colors: darkColors,
};

export { lightTheme, darkTheme };
