import { useState, useEffect, useRef } from 'react';

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
  const [count, setCount] = useState(immediate ? endValue : 0);
  const animationRef = useRef(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
  }, []);

  useEffect(() => {
    const finalValue = parseInt(endValue) || 0;
    
    // Skip animation if immediate mode or reduced motion is preferred
    if (immediate || prefersReducedMotion) {
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
  }, [endValue, duration, immediate, prefersReducedMotion]);

  return count;
}
