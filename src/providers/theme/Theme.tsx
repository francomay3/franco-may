import { ThemeProvider } from "@emotion/react";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import styled from "@emotion/styled";
import { baseTheme, darkTheme, ThemeType } from "./themeValues";

declare module "@emotion/react" {
  // eslint-disable-next-line
  export interface Theme extends ThemeType {}
}

interface DarkModeContextProps {
  isDark: boolean;
  setIsDark: (isDark: boolean) => void;
}

const DarkModeContext = createContext<DarkModeContextProps>({
  isDark: false,
  setIsDark: () => null,
});

const DarkModeProvider = ({ children }: { children: ReactNode }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem("isDark");
    if (isDark) {
      setIsDark(JSON.parse(isDark));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("isDark", JSON.stringify(isDark));
  }, [isDark]);

  const Style = styled.div`
    p,
    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      color: ${({ theme }) => theme.colors.text};
    }
  `;

  return (
    <DarkModeContext.Provider value={{ isDark, setIsDark }}>
      <ThemeProvider theme={isDark ? darkTheme : baseTheme}>
        <Style>{children}</Style>
      </ThemeProvider>
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = () => useContext(DarkModeContext);

export default DarkModeProvider;
