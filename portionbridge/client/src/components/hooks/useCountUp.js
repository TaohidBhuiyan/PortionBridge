import { useState, useEffect } from "react";

/**
 * Custom hook for animated number counting
 * @param {number} target - Target number to count to
 * @param {boolean} active - Whether animation should be active
 * @param {number} duration - Animation duration in ms
 * @returns {number} Current count value
 */
export function useCountUp(target, active, duration = 1200) {
  const [val, setVal] = useState(0);
  
  useEffect(() => {
    if (!active) return;
    let frame;
    const start = performance.now();
    const from = 0;
    
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(from + (target - from) * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, target, duration]);
  
  return val;
}
