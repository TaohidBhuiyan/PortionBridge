import { Share2, Heart, MessageCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Volunteer Quick Actions Component
 * Displays action buttons for volunteer profile
 */
const VolunteerQuickActions = ({ volunteer, onRequestPickup }) => {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Check out ${volunteer.name} on PortionBridge`,
        text: `View ${volunteer.name}'s volunteer profile`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Profile link copied to clipboard!');
    }
  };

  const handleFavorite = () => {
    // Placeholder for future phase
    toast('Favorite functionality coming in a future phase!');
  };

  const handleMessage = () => {
    // Placeholder for future phase
    toast('Chat functionality coming in a future phase!');
  };

  return (
    <div className="bg-page border border-border rounded-xl p-6">
      <h2 className="text-xl font-semibold text-text-primary mb-6">Quick Actions</h2>

      <div className="space-y-3">
        {/* Request Pickup - Disabled for now */}
        <button
          onClick={() => onRequestPickup?.(volunteer)}
          disabled
          className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-dash-primary hover:bg-dash-primary-hover disabled:bg-surface-disabled disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
        >
          <AlertCircle className="w-5 h-5" />
          Request Pickup
          <span className="text-xs opacity-75">(Coming Soon)</span>
        </button>

        {/* Favorite - Placeholder */}
        <button
          onClick={handleFavorite}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 border border-border text-text-primary hover:bg-surface-hover rounded-lg transition-colors font-medium"
        >
          <Heart className="w-5 h-5" />
          Add to Favorites
          <span className="text-xs text-text-muted">(Coming Soon)</span>
        </button>

        {/* Message - Placeholder */}
        <button
          onClick={handleMessage}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 border border-border text-text-primary hover:bg-surface-hover rounded-lg transition-colors font-medium"
        >
          <MessageCircle className="w-5 h-5" />
          Send Message
          <span className="text-xs text-text-muted">(Coming Soon)</span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 border border-border text-text-primary hover:bg-surface-hover rounded-lg transition-colors font-medium"
        >
          <Share2 className="w-5 h-5" />
          Share Profile
        </button>
      </div>
    </div>
  );
};

export default VolunteerQuickActions;
