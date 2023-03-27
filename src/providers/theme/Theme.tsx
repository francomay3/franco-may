import { ThemeProvider } from "@emotion/react";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { lightTheme, darkTheme } from "./themeValues";
import { ThemeType } from "./types";

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

  return (
    <DarkModeContext.Provider value={{ isDark, setIsDark }}>
      <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
        {children}
      </ThemeProvider>
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = () => useContext(DarkModeContext);

export default DarkModeProvider;
