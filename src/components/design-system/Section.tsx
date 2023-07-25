import React from "react";
import { css, cx } from "@emotion/css";
import Card from "./Card";
import WrappIf from "./WrappIf";
import { useDarkMode } from "@/providers/theme/Theme";
import { useIsMobile } from "@/hooks/useIsMobile";

interface SectionProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

const cardStyles = css`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Section = ({ children, style, className }: SectionProps) => {
  const { isDark } = useDarkMode();
  const isMobile = useIsMobile();
  return (
    <WrappIf
      Wrapper={Card}
      condition={!isMobile && !isDark}
      wrapperProps={{ className: cx(cardStyles) }}
    >
      <section className={className} style={style}>
        {children}
      </section>
    </WrappIf>
  );
};

export default Section;
