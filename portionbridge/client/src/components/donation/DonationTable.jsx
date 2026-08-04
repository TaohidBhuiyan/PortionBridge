import React from 'react';
import { Utensils, Shirt, Calendar, User, Package, Eye, Edit, Trash2, MoreVertical } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

/**
 * DonationTable component for displaying donations in table view
 */
export function DonationTable({ donations, onViewDetails, onEdit, onCancel }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
              Donation
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
              Category
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
              Status
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
              Volunteer
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
              Pickup Date
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
              Created
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {donations.map((donation) => {
            const {
              id,
              title,
              category,
              status,
              created_at,
              pickup_date,
              volunteer_name,
              quantity,
              quantity_unit,
              photo,
              images,
            } = donation;

            const coverImage = photo || (images && images.length > 0 ? images[0] : null);
            const canEdit = status === 'pending';
            const canCancel = status === 'pending' || status === 'accepted';

            return (
              <tr 
                key={id}
                className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                {/* Donation */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={title}
                        className="w-12 h-12 rounded-lg object-cover bg-gray-100 dark:bg-gray-900"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-950/30 dark:to-purple-900/30 flex items-center justify-center">
                        {category === 'food' ? (
                          <Utensils size={20} className="text-purple-400 dark:text-purple-600" />
                        ) : (
                          <Shirt size={20} className="text-purple-400 dark:text-purple-600" />
                        )}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                        {title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Package size={12} />
                        {quantity} {quantity_unit}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Category */}
                <td className="py-4 px-4">
                  <span className="text-sm text-gray-700 dark:text-gray-300 capitalize flex items-center gap-1">
                    {category === 'food' ? (
                      <Utensils size={14} className="text-purple-500" />
                    ) : (
                      <Shirt size={14} className="text-purple-500" />
                    )}
                    {category}
                  </span>
                </td>

                {/* Status */}
                <td className="py-4 px-4">
                  <StatusBadge status={status} size="small" />
                </td>

                {/* Volunteer */}
                <td className="py-4 px-4">
                  {volunteer_name ? (
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <User size={14} className="text-gray-400 dark:text-gray-500" />
                      {volunteer_name}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                  )}
                </td>

                {/* Pickup Date */}
                <td className="py-4 px-4">
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <Calendar size={14} className="text-gray-400 dark:text-gray-500" />
                    {formatDate(pickup_date)}
                  </span>
                </td>

                {/* Created */}
                <td className="py-4 px-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(created_at)}
                  </span>
                </td>

                {/* Actions */}
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onViewDetails?.(id)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => onEdit?.(id)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    {canCancel && (
                      <button
                        onClick={() => onCancel?.(id)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 transition-colors"
                        title="Cancel"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
