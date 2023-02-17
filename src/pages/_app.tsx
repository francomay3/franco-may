import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Theme from "@/providers/Theme";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Theme>
      <Component {...pageProps} />
    </Theme>
  );
}
