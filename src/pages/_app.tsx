import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/react";
import Theme from "@/providers/theme/Theme";
import { AuthProvider } from "@/providers/AuthProvider";
import { Toast } from "@/components/design-system";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Theme>
        <Toast />
        <Component {...pageProps} />
        <Analytics />
      </Theme>
    </AuthProvider>
  );
}
