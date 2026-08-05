import { useState } from 'react';
import { Star, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { ratingApi } from '../../services/ratingApi';

/**
 * RatingSubmission - Component for donors to rate volunteers after donation completion
 * Only shown when donation status is 'completed' and user hasn't rated yet
 */
export function RatingSubmission({ donation, onRatingSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleStarClick = (value) => {
    setRating(value);
    setError(null);
  };

  const handleStarHover = (value) => {
    setHoverRating(value);
  };

  const handleStarLeave = () => {
    setHoverRating(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await ratingApi.createRating({
        donationId: donation.id,
        rating,
        comment: comment.trim() || undefined,
      });

      if (result.success) {
        setSuccess(true);
        setComment('');
        setRating(0);
        
        // Notify parent component
        if (onRatingSubmitted) {
          onRatingSubmitted(result.data.rating);
        }
      } else {
        setError(result.error || 'Failed to submit rating');
      }
    } catch (err) {
      setError('Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStar = (value) => {
    const isActive = value <= (hoverRating || rating);
    
    return (
      <button
        type="button"
        onClick={() => handleStarClick(value)}
        onMouseEnter={() => handleStarHover(value)}
        onMouseLeave={handleStarLeave}
        disabled={submitting || success}
        className="transition-transform hover:scale-110 disabled:cursor-not-allowed"
      >
        <Star
          size={32}
          className={`${
            isActive
              ? 'text-yellow-500 fill-yellow-500'
              : 'text-gray-300 dark:text-gray-600'
          }`}
        />
      </button>
    );
  };

  if (success) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
          <CheckCircle size={24} />
          <div>
            <p className="font-medium">Rating Submitted!</p>
            <p className="text-sm">Thank you for your feedback.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Rate Your Experience
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            How was your experience with {donation.volunteer_name || 'the volunteer'}?
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => renderStar(value))}
          </div>
          {rating > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </p>
          )}
        </div>

        {/* Comment */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Additional Feedback (Optional)
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              setError(null);
            }}
            placeholder="Share your experience..."
            disabled={submitting}
            maxLength={500}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 resize-none"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
            {comment.length}/500
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle size={16} />
            <p>{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send size={18} />
              Submit Rating
            </>
          )}
        </button>
      </form>
    </div>
  );
}
