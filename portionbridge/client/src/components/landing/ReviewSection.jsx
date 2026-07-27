import React, { useState, useEffect } from "react";
import axios from "axios";
import { Stars } from "../common/Stars";
import { Reveal } from "../common/Reveal";
import { useReveal } from "../hooks/useReveal";

const PRIMARY = "oklch(60.6% 0.25 292.717)";
const PRIMARY_DEEP = "oklch(38% 0.19 292.717)";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const FALLBACK_REVIEWS = [
  { name: "Nusrat Jahan", rating: 5, text: "Donated leftover iftar rice from my restaurant. The volunteer arrived on time and the process was seamless." },
  { name: "Karim Uddin", rating: 5, text: "As a volunteer, I love how organized the zone system is. No overlap, clear pickups, and the app makes tracking easy." },
  { name: "Fatima Begum", rating: 4, text: "Great initiative! Donated clothes for my children who outgrew them. Happy to see them go to families who need them." },
  { name: "Ahmed Ali", rating: 5, text: "The leaderboard feature motivates me to donate more. Seeing my impact in real numbers is rewarding." },
];

const FALLBACK_RATING_SUMMARY = {
  totalReviews: 428,
  averageRating: 4.8,
  breakdown: [
    { star: 5, count: 304, percentage: 71 },
    { star: 4, count: 68, percentage: 16 },
    { star: 3, count: 30, percentage: 7 },
    { star: 2, count: 17, percentage: 4 },
    { star: 1, count: 9, percentage: 2 },
  ],
};

/**
 * ReviewSection component - Displays user reviews and rating breakdown
 */
export function ReviewSection() {
  const [ref, visible] = useReveal();
  const [reviews, setReviews] = useState([]);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [reviewsRes, summaryRes] = await Promise.all([
          axios.get(`${API_BASE}/public/reviews?limit=10`),
          axios.get(`${API_BASE}/public/ratings/summary`),
        ]);

        setReviews(reviewsRes.data.data.reviews || []);
        setRatingSummary(summaryRes.data.data);
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
        setError('Failed to load reviews');
        setReviews(FALLBACK_REVIEWS);
        setRatingSummary(FALLBACK_RATING_SUMMARY);
      } finally {
        setLoading(false);
      }
    };

    if (visible) {
      fetchReviews();
    }
  }, [visible]);

  const displayReviews = loading ? FALLBACK_REVIEWS : reviews;
  const displaySummary = loading ? FALLBACK_RATING_SUMMARY : ratingSummary;
  const ratingBreakdown = displaySummary?.breakdown || FALLBACK_RATING_SUMMARY.breakdown;

  if (loading && displayReviews.length === 0) {
    return (
      <section ref={ref} className="py-24 md:py-28">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="font-mono text-xs mb-4" style={{ color: PRIMARY_DEEP }}>USER REVIEWS</div>
          <h2 className="font-serif text-4xl md:text-5xl max-w-xl mb-14">Loading reviews...</h2>
          <div className="grid md:grid-cols-[0.85fr_1.15fr] gap-14">
            <div className="animate-pulse">
              <div className="h-8 w-32 bg-gray-200 rounded mb-4" />
              <div className="space-y-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 bg-gray-200 rounded" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="py-24 md:py-28">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <Reveal>
          <div className="font-mono text-xs mb-4" style={{ color: PRIMARY_DEEP }}>USER REVIEWS</div>
          <h2 className="font-serif text-4xl md:text-5xl max-w-xl mb-14">What people are saying.</h2>
        </Reveal>
        <div className="grid md:grid-cols-[0.85fr_1.15fr] gap-14">
          <Reveal>
            <div className="flex items-center gap-3 mb-2">
              <Stars rating={displaySummary?.averageRating || 5} size="w-5 h-5" />
              <span className="text-sm text-black/60">Based on {displaySummary?.totalReviews || 428} reviews</span>
            </div>
            <div className="flex flex-col gap-2.5 mt-6">
              {ratingBreakdown.map((r) => (
                <div key={r.star} className="flex items-center gap-3 text-sm">
                  <span className="w-3 text-black/60">{r.star}</span>
                  <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 shrink-0" fill="#FBBF24">
                    <path d="M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7z" />
                  </svg>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${r.percentage}%`, background: "#FBBF24" }} />
                  </div>
                  <span className="w-8 text-right text-black/50 text-xs">{r.percentage}%</span>
                </div>
              ))}
            </div>
          </Reveal>
          <div className="flex flex-col">
            {displayReviews.length === 0 ? (
              <div className="text-center py-12 text-black/50">
                No reviews yet. Be the first to share your experience!
              </div>
            ) : (
              displayReviews.map((r, i) => (
                <Reveal key={`${r.name}-${i}`} delay={i * 80}>
                  <div className={`py-6 ${i !== 0 ? "border-t border-black/5" : "pt-0"}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                        style={{ background: PRIMARY }}
                      >
                        {r.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{r.name}</div>
                        <Stars rating={r.rating} />
                      </div>
                    </div>
                    <p className="text-sm text-black/65 italic leading-relaxed">{r.text}</p>
                  </div>
                </Reveal>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
