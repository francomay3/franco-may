import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/react";
import NProgress from "nprogress";
import Router from "next/router";
import Theme from "@/providers/theme/Theme";
import { AuthProvider } from "@/providers/AuthProvider";
import { Toast } from "@/components/design-system";
import Layout from "@/components/Layout";

Router.events.on("routeChangeStart", () => NProgress.start());
Router.events.on("routeChangeComplete", () => NProgress.done());
Router.events.on("routeChangeError", () => NProgress.done());

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <AuthProvider>
        <Theme>
          <Toast />
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </Theme>
      </AuthProvider>
      <Analytics />
    </>
  );
}
