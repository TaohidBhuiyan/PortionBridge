import React from 'react';
import { Utensils, Shirt, Package, AlertCircle } from 'lucide-react';

/**
 * Step 1 - Basic Information
 * Fields: Title, Category, Description, Quantity, Unit
 */
export function Step1BasicInfo({ formData, errors, onChange, onValidationChange }) {
  const { title, category, description, quantity, quantityUnit } = formData;

  // Validation
  React.useEffect(() => {
    const isValid = 
      title?.trim().length > 0 &&
      title?.trim().length <= 200 &&
      category &&
      description?.trim().length > 0 &&
      description?.trim().length <= 500 &&
      quantity > 0 &&
      quantityUnit;

    onValidationChange?.(isValid);
  }, [title, category, description, quantity, quantityUnit, onValidationChange]);

  const handleTitleChange = (e) => {
    const value = e.target.value;
    onChange('title', value);
  };

  const handleCategoryChange = (value) => {
    onChange('category', value);
    // Reset category-specific fields when category changes
    onChange('foodType', null);
    onChange('foodName', '');
    onChange('clothingCategory', null);
    onChange('gender', null);
    onChange('ageGroup', null);
    onChange('itemCondition', null);
  };

  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    onChange('description', value);
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    onChange('quantity', value);
  };

  const handleQuantityUnitChange = (value) => {
    onChange('quantityUnit', value);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Donation Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={title || ''}
          onChange={handleTitleChange}
          placeholder="e.g., Fresh vegetables for community kitchen"
          maxLength={200}
          className={`
            w-full px-4 py-3 rounded-xl border-2 transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-purple-500/50
            ${errors.title 
              ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-950/20' 
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-500 dark:focus:border-purple-400'
            }
            text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
          `}
          aria-invalid={errors.title ? 'true' : 'false'}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        <div className="flex items-center justify-between mt-1">
          {errors.title && (
            <p id="title-error" className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle size={14} />
              {errors.title}
            </p>
          )}
          <span className={`text-sm ${errors.title ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'} ml-auto`}>
            {(title || '').length} / 200
          </span>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
          Donation Category <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          {/* Food Option */}
          <button
            type="button"
            onClick={() => handleCategoryChange('food')}
            className={`
              relative p-6 rounded-xl border-2 transition-all duration-200
              ${category === 'food'
                ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-950/20 ring-2 ring-purple-500/20'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-purple-400 dark:hover:border-purple-500'
              }
            `}
            aria-pressed={category === 'food'}
          >
            <div className="flex flex-col items-center gap-3">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center
                ${category === 'food' ? 'bg-purple-500' : 'bg-gray-200 dark:bg-gray-700'}
              `}>
                <Utensils size={24} className={category === 'food' ? 'text-white' : 'text-gray-600 dark:text-gray-400'} />
              </div>
              <span className={`
                font-medium text-sm
                ${category === 'food' ? 'text-purple-900 dark:text-purple-100' : 'text-gray-700 dark:text-gray-300'}
              `}>
                Food
              </span>
            </div>
            {category === 'food' && (
              <div className="absolute top-3 right-3 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>

          {/* Clothes Option */}
          <button
            type="button"
            onClick={() => handleCategoryChange('clothes')}
            className={`
              relative p-6 rounded-xl border-2 transition-all duration-200
              ${category === 'clothes'
                ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-950/20 ring-2 ring-purple-500/20'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-purple-400 dark:hover:border-purple-500'
              }
            `}
            aria-pressed={category === 'clothes'}
          >
            <div className="flex flex-col items-center gap-3">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center
                ${category === 'clothes' ? 'bg-purple-500' : 'bg-gray-200 dark:bg-gray-700'}
              `}>
                <Shirt size={24} className={category === 'clothes' ? 'text-white' : 'text-gray-600 dark:text-gray-400'} />
              </div>
              <span className={`
                font-medium text-sm
                ${category === 'clothes' ? 'text-purple-900 dark:text-purple-100' : 'text-gray-700 dark:text-gray-300'}
              `}>
                Clothes
              </span>
            </div>
            {category === 'clothes' && (
              <div className="absolute top-3 right-3 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        </div>
        {errors.category && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle size={14} />
            {errors.category}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          value={description || ''}
          onChange={handleDescriptionChange}
          placeholder="Provide details about your donation..."
          rows={4}
          maxLength={500}
          className={`
            w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 resize-none
            focus:outline-none focus:ring-2 focus:ring-purple-500/50
            ${errors.description 
              ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-950/20' 
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-500 dark:focus:border-purple-400'
            }
            text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
          `}
          aria-invalid={errors.description ? 'true' : 'false'}
          aria-describedby={errors.description ? 'description-error' : undefined}
        />
        <div className="flex items-center justify-between mt-1">
          {errors.description && (
            <p id="description-error" className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle size={14} />
              {errors.description}
            </p>
          )}
          <span className={`text-sm ${errors.description ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'} ml-auto`}>
            {(description || '').length} / 500
          </span>
        </div>
      </div>

      {/* Quantity and Unit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quantity */}
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Quantity <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              id="quantity"
              value={quantity || ''}
              onChange={handleQuantityChange}
              min="1"
              placeholder="Enter quantity"
              className={`
                w-full px-4 py-3 rounded-xl border-2 transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-purple-500/50
                ${errors.quantity 
                  ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-950/20' 
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-500 dark:focus:border-purple-400'
                }
                text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
              `}
              aria-invalid={errors.quantity ? 'true' : 'false'}
              aria-describedby={errors.quantity ? 'quantity-error' : undefined}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Package size={18} className="text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          {errors.quantity && (
            <p id="quantity-error" className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle size={14} />
              {errors.quantity}
            </p>
          )}
        </div>

        {/* Unit */}
        <div>
          <label htmlFor="quantityUnit" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Unit <span className="text-red-500">*</span>
          </label>
          <select
            id="quantityUnit"
            value={quantityUnit || ''}
            onChange={(e) => handleQuantityUnitChange(e.target.value)}
            className={`
              w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 appearance-none cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-purple-500/50
              ${errors.quantityUnit 
                ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-950/20' 
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-500 dark:focus:border-purple-400'
              }
              text-gray-900 dark:text-white
            `}
            aria-invalid={errors.quantityUnit ? 'true' : 'false'}
            aria-describedby={errors.quantityUnit ? 'quantityUnit-error' : undefined}
          >
            <option value="">Select unit</option>
            <option value="plate">Plate</option>
            <option value="box">Box</option>
            <option value="packet">Packet</option>
            <option value="piece">Piece</option>
            <option value="kg">Kilogram (kg)</option>
            <option value="gram">Gram</option>
            <option value="liter">Liter</option>
          </select>
          {errors.quantityUnit && (
            <p id="quantityUnit-error" className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle size={14} />
              {errors.quantityUnit}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
