import { useEffect, useState } from "react";
import { useTheme } from "@emotion/react";

export const useIsMobile = () => {
  const [matches, setMatches] = useState(false);
  const theme = useTheme();
  const mobile = theme.breakpoints.mobile;

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${mobile}px)`);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, mobile]);

  return matches;
};
