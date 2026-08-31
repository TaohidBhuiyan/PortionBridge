import { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * useCountUp - Animated number counter hook
 * Provides smooth count-up animation for statistics and metrics
 * Respects prefers-reduced-motion for accessibility
 *
 * @param {number} endValue - Target value to count to
 * @param {boolean} immediate - If true, skip animation and show final value immediately
 * @param {number} duration - Animation duration in milliseconds (default: 1000)
 * @returns {number} Current animated value
 */
export function useCountUp(endValue, immediate = false, duration = 1000) {
  const finalValue = parseInt(endValue) || 0;
  const prefersReducedMotion = useReducedMotion();
  const shouldSkipAnimation = immediate || prefersReducedMotion;
  const [count, setCount] = useState(shouldSkipAnimation ? finalValue : 0);
  const animationRef = useRef(null);

  useEffect(() => {
    // Skip animation if immediate mode or reduced motion is preferred
    if (shouldSkipAnimation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCount(finalValue);
      return;
    }

    const startTimestamp = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTimestamp) / duration, 1);

      // Easing function for smooth animation (easeOutQuart)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * finalValue);

      setCount(currentCount);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [finalValue, duration, shouldSkipAnimation]);

  return count;
}
