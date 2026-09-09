import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Smoothly scrolls to the element whose id matches the current URL hash
 * (e.g. a "/#roles" or "/#leaderboard" link scrolls to <section id="roles">).
 *
 * Reusable across any page: mount it once near the top of a route's page
 * component. React Router does not scroll to hash targets on its own, so
 * without this, hash links only change the URL. Works both when the hash
 * changes while already on the page (Navbar/Footer links) and when
 * arriving from a different route with a hash already in the URL.
 */
export function useHashScroll() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;

    const id = hash.slice(1);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [hash]);
}
