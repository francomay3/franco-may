import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* <link href="/favicon.ico" rel="icon" /> */}
        <link
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>👨‍💻</text></svg>"
          rel="icon"
        />
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
