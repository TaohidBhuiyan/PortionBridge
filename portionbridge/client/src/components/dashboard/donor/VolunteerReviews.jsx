import { useState, useEffect } from 'react';
import { Star, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { volunteerProfileApi } from '../../services/volunteerProfileApi';

/**
 * Volunteer Reviews Component
 * Displays volunteer's reviews with rating distribution
 */
const VolunteerReviews = ({ volunteerId, ratingSummary }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('recent');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [volunteerId, sortBy]);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    
    const result = await volunteerProfileApi.getVolunteerReviews(volunteerId, {
      page: 1,
      limit: 10,
    });

    if (result.success) {
      setReviews(result.data.reviews || []);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getReviewerInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 dark:text-gray-600'}`}
      />
    ));
  };

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Reviews</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Reviews</h2>
        <p className="text-red-600 dark:text-red-400">Failed to load reviews: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Reviews</h2>

      {/* Rating Summary */}
      <div className="flex flex-col md:flex-row gap-6 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
        {/* Average Rating */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-4xl font-bold text-gray-900 dark:text-white">
              {ratingSummary?.average_rating || '0.0'}
            </p>
            <div className="flex justify-center my-1">
              {renderStars(Math.round(ratingSummary?.average_rating || 0))}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {ratingSummary?.total_ratings || 0} reviews
            </p>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = reviews.filter(r => r.rating === star).length;
            const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 w-8">{star}★</span>
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 w-8 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedReviews.map((review) => (
            <div
              key={review.id}
              className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4"
            >
              <div className="flex items-start gap-4">
                {/* Reviewer Avatar */}
                {review.reviewer_photo ? (
                  <img
                    src={review.reviewer_photo}
                    alt={review.reviewer_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                    {getReviewerInitials(review.reviewer_name)}
                  </div>
                )}

                {/* Review Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {review.reviewer_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {review.donation_title && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      For: {review.donation_title}
                      {review.donation_category && ` (${review.donation_category})`}
                    </p>
                  )}

                  {review.comment && (
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Load More Button */}
          {reviews.length > 3 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              {showAll ? (
                <>
                  Show Less
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  Show All Reviews ({reviews.length})
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default VolunteerReviews;
