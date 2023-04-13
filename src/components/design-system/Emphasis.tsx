import React from "react";
import styled from "@emotion/styled";
import { useTheme } from "@emotion/react";

function Emphasis({
  as = "span",
  onHover = false,
  secondary = false,
  children,
  ...props
}: {
  secondary?: boolean;
  onHover?: boolean;
  as?: keyof JSX.IntrinsicElements;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  const Component = styled(as)`
    ${onHover && "&:hover {"}

    background: linear-gradient(
        126deg,
        ${secondary ? colors.darksecondary : colors.darkprimary},
        ${secondary ? colors.lightsecondary : colors.lightprimary}
      );
    background-clip: text;
    -webkit-text-fill-color: transparent;
    ${onHover && "}"}
  `;

  return <Component {...props}>{children}</Component>;
}

export default Emphasis;
