import { useEffect, useState } from "react";
import { mobile } from "@/providers/Theme";

export const useIsMobile = () => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(mobile);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches]);

  return matches;
};
