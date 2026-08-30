import { useState, useEffect } from "react";
import axios from "axios";
import { Quote } from "lucide-react";
import { Stars } from "../common/Stars";
import { Reveal } from "../common/Reveal";
import { useReveal } from "../hooks/useReveal";

const PRIMARY = "var(--color-primary)";
const PRIMARY_DEEP = "var(--color-primary-deep)";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

function formatReviewDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function ReviewCardSkeleton() {
  return (
    <div className="p-5 rounded-2xl border border-black/5 bg-white animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 bg-gray-200 rounded" />
          <div className="h-2.5 w-16 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-4/5" />
      </div>
    </div>
  );
}

/**
 * ReviewSection component - Displays real user reviews and rating breakdown.
 *
 * AUDIT FIX: this previously shipped hardcoded fake reviews (fictional
 * names, ratings, and testimonial text) and a fake "428 reviews, 4.8
 * average" summary, shown on every page load while the real data was
 * loading AND permanently on any API failure. Both fallbacks are removed
 * — the section now only ever displays real data from GET /public/reviews
 * and GET /public/ratings/summary, with a proper skeleton while loading,
 * an honest empty state if there are genuinely zero reviews yet, and a
 * plain error message (not fake content) if the request fails.
 */
export function ReviewSection() {
  const [ref, visible] = useReveal();
  const [reviews, setReviews] = useState([]);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (!visible || hasFetched) return;

    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);

        const [reviewsRes, summaryRes] = await Promise.all([
          axios.get(`${API_BASE}/public/reviews?limit=9`),
          axios.get(`${API_BASE}/public/ratings/summary`),
        ]);

        setReviews(reviewsRes.data.data.reviews || []);
        setRatingSummary(summaryRes.data.data);
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
        setError('Reviews are temporarily unavailable. Please check back soon.');
      } finally {
        setLoading(false);
        setHasFetched(true);
      }
    };

    fetchReviews();
  }, [visible, hasFetched]);

  const hasReviews = reviews.length > 0;
  const breakdown = ratingSummary?.breakdown || [];

  return (
    <section ref={ref} className="py-24 md:py-28">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <Reveal>
          <div className="font-mono text-xs mb-4 tracking-wider" style={{ color: PRIMARY_DEEP }}>USER REVIEWS</div>
          <h2 className="font-serif text-4xl md:text-5xl max-w-[576px] mb-3">What people are saying.</h2>
          <p className="text-slate-500 max-w-[512px] text-sm md:text-base font-normal mb-14">
            Real feedback from donors and volunteers using PortionBridge.
          </p>
        </Reveal>

        {loading ? (
          <div className="grid md:grid-cols-[0.85fr_1.15fr] gap-14">
            <div className="animate-pulse">
              <div className="h-6 w-40 bg-gray-200 rounded mb-6" />
              <div className="space-y-2.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-4 bg-gray-100 rounded" />
                ))}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <ReviewCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16 px-6 rounded-2xl border border-black/5 bg-slate-50/60">
            <p className="text-slate-500 text-sm">{error}</p>
          </div>
        ) : !hasReviews ? (
          <div className="text-center py-16 px-6 rounded-2xl border border-dashed border-black/10">
            <Quote className="w-8 h-8 mx-auto mb-3 text-black/20" strokeWidth={1.5} />
            <p className="text-slate-600 font-medium mb-1">No reviews yet</p>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              Be the first to complete a donation or pickup and leave your feedback.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-[0.85fr_1.15fr] gap-14">
            <Reveal>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-serif text-4xl font-semibold text-slate-900">
                  {(ratingSummary?.averageRating ?? 0).toFixed(1)}
                </span>
                <Stars rating={ratingSummary?.averageRating || 0} size="w-4 h-4" />
              </div>
              <p className="text-sm text-black/50 mb-6">
                Based on {ratingSummary?.totalReviews ?? 0} review{ratingSummary?.totalReviews === 1 ? '' : 's'}
              </p>
              <div className="flex flex-col gap-2.5">
                {breakdown.map((r) => (
                  <div key={r.star} className="flex items-center gap-3 text-sm">
                    <span className="w-3 text-black/60">{r.star}</span>
                    <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 shrink-0" fill="#FBBF24" aria-hidden="true">
                      <path d="M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7z" />
                    </svg>
                    <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${r.percentage}%`, background: "#FBBF24" }}
                      />
                    </div>
                    <span className="w-8 text-right text-black/50 text-xs">{r.percentage}%</span>
                  </div>
                ))}
              </div>
            </Reveal>

            <div className="grid sm:grid-cols-2 gap-4">
              {reviews.map((r, i) => {
                const initials = r.name.split(" ").map((w) => w[0]).slice(0, 2).join("");
                const dateLabel = formatReviewDate(r.createdAt);
                return (
                  <Reveal key={`${r.name}-${i}`} delay={i * 70}>
                    <div className="group relative h-full p-5 rounded-2xl border border-black/5 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300">
                      <Quote
                        className="absolute top-4 right-4 w-6 h-6 opacity-[0.06] group-hover:opacity-10 transition-opacity"
                        style={{ color: PRIMARY }}
                        strokeWidth={2.5}
                      />
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                          style={{ background: PRIMARY }}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-900 truncate">{r.name}</div>
                          <div className="flex items-center gap-1.5">
                            <Stars rating={r.rating} size="w-3 h-3" />
                            {dateLabel && (
                              <span className="text-[11px] text-black/35">· {dateLabel}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-black/65 italic leading-relaxed relative z-10">
                        {r.text}
                      </p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
