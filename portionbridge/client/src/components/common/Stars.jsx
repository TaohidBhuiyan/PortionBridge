/**
 * Stars component for displaying star ratings
 * @param {number} rating - Rating value (1-5)
 * @param {string} size - CSS classes for size
 */
export function Stars({ rating, size = "w-4 h-4" }) {
  const rounded = Math.round(rating || 0);
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${rounded} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg 
          key={i} 
          viewBox="0 0 20 20" 
          className={size} 
          fill={i <= rating ? "#FBBF24" : "#E5E7EB"}
          aria-hidden="true"
        >
          <path d="M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7z" />
        </svg>
      ))}
    </div>
  );
}
