// import { createContext, useContext, useEffect, useState } from "react";
// import { ThemeProvider } from "@emotion/react";
// import { ReactNode } from "react";

// interface DarkModeContextProps {
//     isDark: boolean;
//     setIsDark: (isDark: boolean) => void;
// }

// const DarkModeContext = createContext<DarkModeContextProps>({
//     isDark: false,
//     setIsDark: () => {},
// });

// export const useDarkMode = () => useContext(DarkModeContext);

// const DarkModeProvider = ({ children }: {children: ReactNode}) => {
//     const [isDark, setIsDark] = useState(false);

//     useEffect(() => {
//         const isDark = localStorage.getItem("isDark");
//         if (isDark) {
//             setIsDark(JSON.parse(isDark));
//         }
//     }, []);

//     useEffect(() => {
//         localStorage.setItem("isDark", JSON.stringify(isDark));
//     }, [isDark]);

//     return (
//         <DarkModeContext.Provider value={{ isDark, setIsDark }}>
//             <ThemeProvider theme={{ isDark }}>{children}</ThemeProvider>
//         </DarkModeContext.Provider>
//     );
// };

// export default DarkModeProvider;
