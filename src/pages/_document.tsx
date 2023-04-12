import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link href="/favicon.ico" rel="icon" />
        <meta
          content="cyan"
          media="(prefers-color-scheme: light)"
          name="theme-color"
        />
        <meta
          content="black"
          media="(prefers-color-scheme: dark)"
          name="theme-color"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
