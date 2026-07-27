import { useState, useEffect, useRef } from "react";

/**
 * Custom hook for scroll reveal animations using Intersection Observer
 * @returns {[React.RefObject, boolean]} Ref object and visibility state
 */
export function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  
  return [ref, visible];
}
