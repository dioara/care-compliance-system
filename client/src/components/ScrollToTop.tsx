import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * ScrollToTop component that scrolls the window to the top
 * whenever the route changes.
 */
export function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location]);

  return null;
}

export default ScrollToTop;
