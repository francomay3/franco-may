import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Theme from "@/providers/Theme";
import { AuthProvider } from "@/providers/AuthProvider";
import { Toast } from "@/components/design-system/Toast";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Theme>
        <Toast />
        <Component {...pageProps} />
      </Theme>
    </AuthProvider>
  );
}
