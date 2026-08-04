import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, Shirt, Calendar, User, Package, Eye, Edit, Trash2, MoreVertical } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

/**
 * DonationCard component for displaying donation in card view
 */
export function DonationCard({ donation, onViewDetails, onEdit, onCancel }) {
  const navigate = useNavigate();

  const {
    id,
    title,
    category,
    status,
    created_at,
    pickup_date,
    volunteer_name,
    description,
    quantity,
    quantity_unit,
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

  const canEdit = status === 'pending';
  const canCancel = status === 'pending' || status === 'accepted';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-2 border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Cover Image */}
      {coverImage ? (
        <div className="aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-900">
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-video w-full bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-950/30 dark:to-purple-900/30 flex items-center justify-center">
          {category === 'food' ? (
            <Utensils size={48} className="text-purple-400 dark:text-purple-600" />
          ) : (
            <Shirt size={48} className="text-purple-400 dark:text-purple-600" />
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate mb-1">
              {title}
            </h3>
            <div className="flex items-center gap-2">
              <StatusBadge status={status} size="small" />
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
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
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {shortDescription}
          </p>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Package size={16} className="text-gray-400 dark:text-gray-500" />
            <span className="text-gray-700 dark:text-gray-300">
              {quantity} {quantity_unit}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar size={16} className="text-gray-400 dark:text-gray-500" />
            <span className="text-gray-700 dark:text-gray-300">
              {formatDate(pickup_date)}
            </span>
          </div>
          {volunteer_name && (
            <div className="flex items-center gap-2 text-sm col-span-2">
              <User size={16} className="text-gray-400 dark:text-gray-500" />
              <span className="text-gray-700 dark:text-gray-300 truncate">
                {volunteer_name}
              </span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleViewDetails}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-950/50 transition-colors text-sm font-medium"
          >
            <Eye size={16} />
            View
          </button>
          {canEdit && (
            <button
              onClick={handleEdit}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              <Edit size={16} />
              Edit
            </button>
          )}
          {canCancel && (
            <button
              onClick={handleCancel}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors text-sm font-medium"
            >
              <Trash2 size={16} />
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
