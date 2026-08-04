import React from 'react';
import { Utensils, Shirt, Package, MapPin, Phone, Calendar, Clock, Edit2, CheckCircle } from 'lucide-react';

/**
 * Step 5 - Review & Submit
 * Shows complete summary of all form data
 */
export function Step5Review({ formData, onEditStep }) {
  const {
    title,
    category,
    description,
    quantity,
    quantityUnit,
    foodType,
    foodName,
    numberOfServings,
    ingredients,
    allergens,
    storageRequirement,
    isVegetarian,
    isHalal,
    expiryDate,
    clothingCategory,
    gender,
    ageGroup,
    itemCondition,
    brand,
    size,
    color,
    season,
    savedAddressId,
    pickupAddress,
    contactPhone,
    pickupDate,
    pickupTimeSlot,
    specialInstructions,
    images,
    coverImage
  } = formData;

  const formatStorageRequirement = (value) => {
    const map = {
      'room_temperature': 'Room Temperature',
      'refrigerated': 'Refrigerated',
      'frozen': 'Frozen'
    };
    return map[value] || value;
  };

  const formatItemCondition = (value) => {
    const map = {
      'new': 'New',
      'like_new': 'Like New',
      'good': 'Good',
      'fair': 'Fair'
    };
    return map[value] || value;
  };

  const formatTimeSlot = (value) => {
    const map = {
      'morning': 'Morning (6 AM - 12 PM)',
      'afternoon': 'Afternoon (12 PM - 6 PM)',
      'evening': 'Evening (6 PM - 10 PM)'
    };
    return map[value] || value;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'Not specified';
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Package size={20} className="text-purple-500" />
            Basic Information
          </h3>
          <button
            type="button"
            onClick={() => onEditStep(0)}
            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1 text-sm font-medium transition-colors"
          >
            <Edit2 size={16} />
            Edit
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-sm text-gray-500 dark:text-gray-400">Title</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white text-right max-w-[60%]">
              {title || '-'}
            </span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm text-gray-500 dark:text-gray-400">Category</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
              {category === 'food' ? (
                <>
                  <Utensils size={16} className="text-purple-500" />
                  Food
                </>
              ) : category === 'clothes' ? (
                <>
                  <Shirt size={16} className="text-purple-500" />
                  Clothes
                </>
              ) : '-'}
            </span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm text-gray-500 dark:text-gray-400">Description</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white text-right max-w-[60%]">
              {description || '-'}
            </span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm text-gray-500 dark:text-gray-400">Quantity</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {quantity} {quantityUnit || '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Donation Details */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            {category === 'food' ? (
              <Utensils size={20} className="text-purple-500" />
            ) : (
              <Shirt size={20} className="text-purple-500" />
            )}
            {category === 'food' ? 'Food Details' : 'Clothes Details'}
          </h3>
          <button
            type="button"
            onClick={() => onEditStep(1)}
            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1 text-sm font-medium transition-colors"
          >
            <Edit2 size={16} />
            Edit
          </button>
        </div>

        {category === 'food' ? (
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-sm text-gray-500 dark:text-gray-400">Food Type</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                {foodType || '-'}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm text-gray-500 dark:text-gray-400">Food Name</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {foodName || '-'}
              </span>
            </div>
            {numberOfServings && (
              <div className="flex justify-between items-start">
                <span className="text-sm text-gray-500 dark:text-gray-400">Servings</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {numberOfServings}
                </span>
              </div>
            )}
            {ingredients && (
              <div className="flex justify-between items-start">
                <span className="text-sm text-gray-500 dark:text-gray-400">Ingredients</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white text-right max-w-[60%]">
                  {ingredients}
                </span>
              </div>
            )}
            {allergens && allergens.length > 0 && (
              <div className="flex justify-between items-start">
                <span className="text-sm text-gray-500 dark:text-gray-400">Allergens</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white text-right max-w-[60%]">
                  {allergens.join(', ')}
                </span>
              </div>
            )}
            <div className="flex justify-between items-start">
              <span className="text-sm text-gray-500 dark:text-gray-400">Storage</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatStorageRequirement(storageRequirement) || '-'}
              </span>
            </div>
            {isVegetarian && (
              <div className="flex justify-between items-start">
                <span className="text-sm text-gray-500 dark:text-gray-400">Type</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {isVegetarian === 'vegetarian' ? 'Vegetarian' : 'Non-Vegetarian'}
                </span>
              </div>
            )}
            {isHalal && (
              <div className="flex justify-between items-start">
                <span className="text-sm text-gray-500 dark:text-gray-400">Halal</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {isHalal}
                </span>
              </div>
            )}
            {expiryDate && (
              <div className="flex justify-between items-start">
                <span className="text-sm text-gray-500 dark:text-gray-400">Expiry Date</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDateTime(expiryDate)}
                </span>
              </div>
            )}
          </div>
        ) : category === 'clothes' ? (
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-sm text-gray-500 dark:text-gray-400">Category</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                {clothingCategory?.replace('_', ' ') || '-'}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm text-gray-500 dark:text-gray-400">Gender</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                {gender || '-'}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm text-gray-500 dark:text-gray-400">Age Group</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                {ageGroup || '-'}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm text-gray-500 dark:text-gray-400">Condition</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatItemCondition(itemCondition) || '-'}
              </span>
            </div>
            {brand && (
              <div className="flex justify-between items-start">
                <span className="text-sm text-gray-500 dark:text-gray-400">Brand</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {brand}
                </span>
              </div>
            )}
            {size && (
              <div className="flex justify-between items-start">
                <span className="text-sm text-gray-500 dark:text-gray-400">Size</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white uppercase">
                  {size}
                </span>
              </div>
            )}
            {color && (
              <div className="flex justify-between items-start">
                <span className="text-sm text-gray-500 dark:text-gray-400">Color</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {color}
                </span>
              </div>
            )}
            {season && (
              <div className="flex justify-between items-start">
                <span className="text-sm text-gray-500 dark:text-gray-400">Season</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {season}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No category selected
          </p>
        )}
      </div>

      {/* Pickup Information */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin size={20} className="text-purple-500" />
            Pickup Information
          </h3>
          <button
            type="button"
            onClick={() => onEditStep(2)}
            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1 text-sm font-medium transition-colors"
          >
            <Edit2 size={16} />
            Edit
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-sm text-gray-500 dark:text-gray-400">Address</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white text-right max-w-[60%]">
              {savedAddressId ? 'Saved Address' : (pickupAddress?.fullAddress || '-')}
            </span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm text-gray-500 dark:text-gray-400">Contact Phone</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {contactPhone || '-'}
            </span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm text-gray-500 dark:text-gray-400">Pickup Date</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
              <Calendar size={14} />
              {formatDate(pickupDate)}
            </span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm text-gray-500 dark:text-gray-400">Time Slot</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
              <Clock size={14} />
              {formatTimeSlot(pickupTimeSlot)}
            </span>
          </div>
          {specialInstructions && (
            <div className="flex justify-between items-start">
              <span className="text-sm text-gray-500 dark:text-gray-400">Special Instructions</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white text-right max-w-[60%]">
                {specialInstructions}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Images */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Package size={20} className="text-purple-500" />
            Images ({images?.length || 0})
          </h3>
          <button
            type="button"
            onClick={() => onEditStep(3)}
            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1 text-sm font-medium transition-colors"
          >
            <Edit2 size={16} />
            Edit
          </button>
        </div>

        {images && images.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {images.map((image, index) => (
              <div
                key={image.id}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                  coverImage === image.id ? 'border-purple-500' : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <img
                  src={image.preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {coverImage === image.id && (
                  <div className="absolute top-1 left-1 bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <CheckCircle size={10} />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No images uploaded
          </p>
        )}
      </div>

      {/* Ready Message */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-800">
        <div className="flex items-start gap-3">
          <CheckCircle size={24} className="text-purple-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
              Ready to Submit
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please review all information above. Once submitted, your donation will be visible to volunteers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
