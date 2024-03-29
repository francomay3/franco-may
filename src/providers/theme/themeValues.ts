const smallScreen = 550;
const mediumScreen = 900;

const transparent = "transparent";
const grey0 = "black";
const grey1 = "#1b1b1d";
const grey2 = "#242526";
const grey3 = "#1c1e21";
const grey4 = "#444950";
const grey5 = "#606770";
const grey6 = "#8d949e";
const grey7 = "#ccd0d5";
const grey8 = "#dadde1";
const grey9 = "#ebedf0";
const grey10 = "#f5f6f7";
const grey11 = "white";
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
  button: {
    disabledColor: grey6,
  },
  isDark: false,
  aspectRatio: 1.4,
  dialog: {
    backgroundColor: grey11,
    borderColor: transparent,
    backdropIntensity: 0.3,
  },
  form: {
    borderColor: grey7,
    borderFocusColor: blue,
    backgroundColor: grey10,
    padding: "0.5rem",
  },
  shadows: {
    1: "1px 2px 4px rgb(0 0 0 / 40%)",
    2: "3px 4px 8px rgb(0 0 0 / 20%)",
    3: "5px 6px 16px rgb(0 0 0 / 15%)",
  },
  zIndex: {
    dropdown: 1000,
    fixed: 1030,
    modal: 1060,
    modalBackdrop: 1040,
    offcanvas: 1050,
    popover: 1070,
    sticky: 1020,
    tooltip: 1080,
  },
  footer: {
    backgroundColor: blue,
    borderColor: transparent,
  },
  header: {
    width: "3rem",
    activeColor: grey11,
    backgroundColor: blue,
    itemBorderColor: darkBlue,
    barBorderColor: transparent,
  },
  card: {
    backgroundColor: grey11,
    borderColor: transparent,
  },
  colors: {
    background: grey9,
    black: "black",
    blue,
    danger: red,
    darkbackground: grey8,
    darkblue: darkBlue,
    darkdanger: darkRed,
    darkgreen: darkGreen,
    darkgrey: grey8,
    darkinfo: darkBlue,
    darkorange: darkOrange,
    darkprimary: darkBlue,
    darkred: darkRed,
    darksecondary: darkOrange,
    darksuccess: darkGreen,
    darkviolet: darkViolet,
    darkwarning: darkOrange,
    darkyellow: darkYellow,
    green,
    grey: grey6,
    grey0,
    grey1,
    grey2,
    grey3,
    grey4,
    grey5,
    grey6,
    grey7,
    grey8,
    grey9,
    grey10,
    grey11,
    info: blue,
    lightbackground: grey11,
    lightblue: lightBlue,
    lightdanger: lightRed,
    lightgreen: lightGreen,
    lightgrey: grey3,
    lightinfo: lightBlue,
    lightorange: lightOrange,
    lightprimary: lightBlue,
    lightred: lightRed,
    lightsecondary: lightOrange,
    lightsuccess: lightGreen,
    lightviolet: lightViolet,
    lightwarning: lightOrange,
    lightyellow: lightYellow,
    orange,
    primary: blue,
    red,
    secondary: orange,
    success: green,
    text: grey1,
    violet,
    warning: orange,
    white: "white",
    yellow,
  },
  mediaQueries: {
    onlyMobile: `@media only screen and (max-width: ${smallScreen}px)`,
    onlyTablet: `@media only screen and (min-width: ${
      smallScreen + 1
    }px) and (max-width: ${mediumScreen}px)`,
    mobileAndTablet: `@media only screen and (max-width: ${mediumScreen}px)`,
  },
  breakpoints: {
    mobile: smallScreen,
    tablet: mediumScreen,
  },
  borderRadius: "0.25rem",
};

const darkTheme = {
  ...baseTheme,
  isDark: true,
  card: {
    ...baseTheme.card,
    backgroundColor: grey2,
    borderColor: grey4,
  },
  form: {
    ...baseTheme.form,
    borderColor: grey4,
    borderFocusColor: blue,
    backgroundColor: grey2,
  },
  colors: {
    ...baseTheme.colors,
    background: grey1,
    danger: darkRed,
    darkbackground: grey6,
    grey: grey5,
    info: darkBlue,
    lightdanger: lightRed,
    lightinfo: lightBlue,
    lightsuccess: lightGreen,
    lightwarning: lightOrange,
    primary: blue,
    success: darkGreen,
    text: grey10,
    warning: darkOrange,
  },
  footer: {
    ...baseTheme.footer,
    backgroundColor: grey2,
    borderColor: grey4,
  },
  header: {
    ...baseTheme.header,
    activeColor: grey11,
    backgroundColor: grey2,
    barBorderColor: grey4,
    itemBorderColor: grey4,
  },
  dialog: {
    ...baseTheme.dialog,
    backgroundColor: grey1,
    borderColor: grey4,
    backdropIntensity: 0.6,
  },
};

export type ThemeType = typeof baseTheme;

export { baseTheme, darkTheme };
