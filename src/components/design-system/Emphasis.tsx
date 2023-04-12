import React from "react";
import styled from "@emotion/styled";
import { useTheme } from "@emotion/react";

function Emphasis({
  as = "span",
  children,
  ...props
}: {
  as?: keyof JSX.IntrinsicElements;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const Component = styled(as)`
    background: linear-gradient(
      126deg,
      ${theme.colors.darkprimary},
      ${theme.colors.lightprimary}
    );
    background-clip: text;
    -webkit-text-fill-color: transparent;
  `;

  return <Component {...props}>{children}</Component>;
}

export default Emphasis;
