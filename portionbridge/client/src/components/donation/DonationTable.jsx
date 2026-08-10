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
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
              Donation
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
              Category
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
              Status
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
              Volunteer
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
              Pickup Date
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
              Created
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-text-primary">
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
                className="border-b border-border hover:bg-surface-hover transition-colors"
              >
                {/* Donation */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={title}
                        className="w-12 h-12 rounded-lg object-cover bg-surface-hover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-dash-primary-soft to-dash-primary-soft/50 dark:from-dash-primary-soft/30 dark:to-dash-primary-soft/10 flex items-center justify-center">
                        {category === 'food' ? (
                          <Utensils size={20} className="text-dash-primary dark:text-dash-primary" />
                        ) : (
                          <Shirt size={20} className="text-dash-primary dark:text-dash-primary" />
                        )}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate max-w-[200px]">
                        {title}
                      </p>
                      <p className="text-xs text-text-secondary flex items-center gap-1">
                        <Package size={12} />
                        {quantity} {quantity_unit}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Category */}
                <td className="py-4 px-4">
                  <span className="text-sm text-text-primary capitalize flex items-center gap-1">
                    {category === 'food' ? (
                      <Utensils size={14} className="text-dash-primary" />
                    ) : (
                      <Shirt size={14} className="text-dash-primary" />
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
                    <span className="text-sm text-text-primary flex items-center gap-1">
                      <User size={14} className="text-text-secondary" />
                      {volunteer_name}
                    </span>
                  ) : (
                    <span className="text-sm text-text-secondary">-</span>
                  )}
                </td>

                {/* Pickup Date */}
                <td className="py-4 px-4">
                  <span className="text-sm text-text-primary flex items-center gap-1">
                    <Calendar size={14} className="text-text-secondary" />
                    {formatDate(pickup_date)}
                  </span>
                </td>

                {/* Created */}
                <td className="py-4 px-4">
                  <span className="text-sm text-text-secondary">
                    {formatDate(created_at)}
                  </span>
                </td>

                {/* Actions */}
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onViewDetails?.(id)}
                      className="p-2 rounded-lg hover:bg-surface-hover text-text-secondary transition-colors"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => onEdit?.(id)}
                        className="p-2 rounded-lg hover:bg-surface-hover text-text-secondary transition-colors"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    {canCancel && (
                      <button
                        onClick={() => onCancel?.(id)}
                        className="p-2 rounded-lg hover:bg-danger-soft text-danger transition-colors"
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
