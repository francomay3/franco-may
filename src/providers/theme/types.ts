export interface ThemeType {
  aspectRatio: number;
  shadows: {
    1: string;
    2: string;
    3: string;
  };
  zIndex: {
    dropdown: number;
    sticky: number;
    fixed: number;
    modalBackdrop: number;
    offcanvas: number;
    modal: number;
    popover: number;
    tooltip: number;
  };
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
    darkGreen: string;
    lightRed: string;
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
  breakpoints: {
    mobile: number;
    tablet: number;
  };
  mediaQueries: {
    mobile: string;
    tablet: string;
  };
  borderRadius: {
    1: string;
    2: string;
    3: string;
    4: string;
  };
}
