"use client";

import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/react";
import NProgress from "nprogress";
import Theme from "@/providers/theme/Theme";
import { AuthProvider } from "@/providers/AuthProvider";
import { Toast } from "@/components/design-system";
import Layout from "@/components/Layout";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>👨‍💻</text></svg>"
          rel="icon"
        />
        <meta
          content="#4a70f7"
          media="(prefers-color-scheme: light)"
          name="theme-color"
        />
        <meta
          content="#242526"
          media="(prefers-color-scheme: dark)"
          name="theme-color"
        />
        {/* <title>Franco May</title> */}
      </head>

      <body>
        <AuthProvider>
          <Theme>
            <Toast />
            <Layout>{children}</Layout>
          </Theme>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
