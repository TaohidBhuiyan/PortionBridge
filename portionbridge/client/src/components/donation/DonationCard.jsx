import { useNavigate } from 'react-router-dom';
import { Utensils, Shirt, Calendar, User, Package, Eye, Edit, Trash2, MapPin, HandHeart, Loader2 } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

/**
 * DonationCard component for displaying donation in card view.
 *
 * PHASE 3: extended (not replaced) with an optional `onAccept` prop so this
 * one card can serve both the donor's "My Donations" list (Edit/Cancel, as
 * before — unaffected, since `onAccept` is undefined there) and the new
 * volunteer Opportunities grid (Accept, shown only when `onAccept` is
 * passed). `pickup_location` and `accepting` are additive/optional too, so
 * every existing caller keeps working unchanged.
 */
export function DonationCard({ donation, onViewDetails, onEdit, onCancel, onAccept, accepting = false }) {
  const navigate = useNavigate();

  const {
    id,
    title,
    category,
    status,
    pickup_date,
    pickup_location,
    volunteer_name,
    description,
    quantity,
    quantity_unit,
    number_of_servings,
    photo,
    images,
  } = donation;

  const coverImage = photo || (images && images.length > 0 ? images[0] : null);
  const shortDescription = description && description.length > 100 
    ? description.substring(0, 100) + '...' 
    : description;

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(id);
    } else {
      navigate(`/donations/${id}`);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(id);
    } else {
      navigate(`/donations/${id}/edit`);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel(id);
    }
  };

  const handleAccept = (e) => {
    e.stopPropagation();
    if (onAccept) {
      onAccept(id);
    }
  };

  // When onAccept is passed (volunteer Opportunities context), this card
  // shows Accept instead of the donor's Edit/Cancel actions — donor usage
  // never passes onAccept, so canEdit/canCancel behave exactly as before there.
  const canEdit = status === 'pending' && !onAccept;
  const canCancel = (status === 'pending' || status === 'accepted') && !onAccept;
  const canAccept = Boolean(onAccept) && status === 'pending';

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Cover Image */}
      {coverImage ? (
        <div className="aspect-video w-full overflow-hidden bg-surface-hover">
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-video w-full bg-gradient-to-br from-dash-primary-soft to-dash-primary-soft/50 dark:from-dash-primary-soft/30 dark:to-dash-primary-soft/10 flex items-center justify-center">
          {category === 'food' ? (
            <Utensils size={48} className="text-dash-primary dark:text-dash-primary" />
          ) : (
            <Shirt size={48} className="text-dash-primary dark:text-dash-primary" />
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-text-primary truncate mb-1">
              {title}
            </h3>
            <div className="flex items-center gap-2">
              <StatusBadge status={status} size="small" />
              <span className="text-xs text-text-secondary flex items-center gap-1">
                {category === 'food' ? (
                  <Utensils size={12} />
                ) : (
                  <Shirt size={12} />
                )}
                {category}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {shortDescription && (
          <p className="text-sm text-text-secondary mb-4 line-clamp-2">
            {shortDescription}
          </p>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Package size={16} className="text-text-secondary" />
            <span className="text-text-primary">
              {quantity} {quantity_unit}
              {category === 'food' && number_of_servings ? ` · ${number_of_servings} servings` : ''}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar size={16} className="text-text-secondary" />
            <span className="text-text-primary">
              {formatDate(pickup_date)}
            </span>
          </div>
          {/* pickup_location — real backend field, no fabricated distance.
              Shown whenever present, most relevant for volunteers deciding
              whether to accept, but harmless/useful for donor view too. */}
          {pickup_location && (
            <div className="flex items-center gap-2 text-sm col-span-2">
              <MapPin size={16} className="text-text-secondary shrink-0" />
              <span className="text-text-primary truncate">
                {pickup_location}
              </span>
            </div>
          )}
          {volunteer_name && (
            <div className="flex items-center gap-2 text-sm col-span-2">
              <User size={16} className="text-text-secondary" />
              <span className="text-text-primary truncate">
                {volunteer_name}
              </span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-border">
          <button
            onClick={handleViewDetails}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-dash-primary-soft text-dash-primary hover:bg-dash-primary-soft/70 transition-colors text-sm font-medium"
          >
            <Eye size={16} />
            View
          </button>
          {canEdit && (
            <button
              onClick={handleEdit}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-page border border-border text-text-primary hover:bg-surface-hover transition-colors text-sm font-medium"
            >
              <Edit size={16} />
              Edit
            </button>
          )}
          {canCancel && (
            <button
              onClick={handleCancel}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-danger-soft text-danger hover:bg-danger-soft/70 transition-colors text-sm font-medium"
            >
              <Trash2 size={16} />
              Cancel
            </button>
          )}
          {canAccept && (
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-dash-primary text-white hover:bg-dash-primary-hover transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {accepting ? <Loader2 size={16} className="animate-spin" /> : <HandHeart size={16} />}
              {accepting ? 'Accepting...' : 'Accept'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
