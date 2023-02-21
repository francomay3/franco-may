import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Theme from "@/providers/Theme";
import { AuthProvider } from "@/providers/AuthProvider";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Theme>
        <Component {...pageProps} />
      </Theme>
    </AuthProvider>
  );
}
