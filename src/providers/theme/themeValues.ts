const smallScreen = 550;
const mediumScreen = 900;

const white = "white";
// const black = "#0d111d";
const black = "black";
const transparent = "transparent";
const greyDarken4 = "#070910";
const greyDarken3 = "#1b1f26";
const greyDarken2 = "#222831";
const greyDarken1 = "#32373f";
const grey = "#59616e";
const greyLighten1 = "#c1c7d1";
const greyLighten2 = "#ecf2f8";
const red = "#f7554a";
const lightRed = "#fa7970";
const darkRed = "#b2241a";
const orange = "#f99345";
const lightOrange = "#faa356";
const darkOrange = "#bd611b";
const yellow = "#f7dc4a";
const lightYellow = "#fdec90";
const darkYellow = "#c1a824";
const green = "#8ad24e";
const lightGreen = "#a8e773";
const darkGreen = "#539b17";
const blue = "#4a70f7";
const lightBlue = "#7690ed";
const darkBlue = "#1636a8";
const violet = "#ca4af7";
const lightViolet = "#d076f2";
const darkViolet = "#851aad";

const baseTheme = {
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
    card: white,
    border: transparent,
    text: greyDarken2,
    primary: blue,
    lightprimary: lightBlue,
    darkprimary: darkBlue,
    secondary: grey,
    lightsecondary: greyLighten1,
    darksecondary: greyDarken2,
    background: greyLighten2,
    lightbackground: white,
    darkbackground: greyLighten1,
    success: green,
    lightsuccess: lightGreen,
    darksuccess: darkGreen,
    info: blue,
    lightinfo: lightBlue,
    darkinfo: darkBlue,
    warning: orange,
    lightwarning: lightOrange,
    darkwarning: darkOrange,
    danger: red,
    lightdanger: lightRed,
    darkdanger: darkRed,
    white,
    black,
    grey,
    lightgrey: greyLighten1,
    darkgrey: greyDarken2,
    red,
    lightred: lightRed,
    darkred: darkRed,
    orange,
    lightorange: lightOrange,
    darkorange: darkOrange,
    yellow,
    lightyellow: lightYellow,
    darkyellow: darkYellow,
    green,
    lightgreen: lightGreen,
    darkgreen: darkGreen,
    blue,
    lightblue: lightBlue,
    darkblue: darkBlue,
    violet,
    lightviolet: lightViolet,
    darkviolet: darkViolet,
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

const darkTheme = {
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    primary: greyDarken4,
    text: white,
    border: greyDarken1,
    background: greyDarken3,
    card: greyDarken2,
    lightbackground: greyDarken2,
    darkbackground: black,
    success: darkGreen,
    lightsuccess: lightGreen,
    info: darkBlue,
    lightinfo: lightBlue,
    warning: darkOrange,
    lightwarning: lightOrange,
    danger: darkRed,
    lightdanger: lightRed,
  },
};

export type ThemeType = typeof baseTheme;

export { baseTheme, darkTheme };
