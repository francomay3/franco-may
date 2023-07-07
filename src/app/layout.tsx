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
    <html>
      <head>
        <title>Franco May</title>
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
