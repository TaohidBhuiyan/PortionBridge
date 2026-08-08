import React from 'react';
import { Utensils, Shirt, Package, AlertCircle } from 'lucide-react';

/**
 * Step 1 - Basic Information
 * Fields: Title, Category, Description, Quantity, Unit
 * Redesigned for compact, professional appearance
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
    <div className="space-y-5">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-1.5">
          Donation Title <span className="text-danger-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={title || ''}
          onChange={handleTitleChange}
          placeholder="e.g., Fresh vegetables for community kitchen"
          maxLength={200}
          className={`
            w-full px-3 py-2 rounded-lg border transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-primary-500/50
            ${errors.title 
              ? 'border-danger-500 dark:border-danger-400 bg-danger-50 dark:bg-danger-950/20' 
              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-primary-500 dark:focus:border-primary-400'
            }
            text-slate-900 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500 text-sm
          `}
          aria-invalid={errors.title ? 'true' : 'false'}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        <div className="flex items-center justify-between mt-1">
          {errors.title && (
            <p id="title-error" className="text-xs text-danger-600 dark:text-danger-400 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.title}
            </p>
          )}
          <span className={`text-xs ${errors.title ? 'text-danger-600 dark:text-danger-400' : 'text-slate-500 dark:text-slate-400'} ml-auto`}>
            {(title || '').length} / 200
          </span>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
          Donation Category <span className="text-danger-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {/* Food Option */}
          <button
            type="button"
            onClick={() => handleCategoryChange('food')}
            className={`
              relative p-4 rounded-lg border-2 transition-all duration-200
              ${category === 'food'
                ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-950/20'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary-400 dark:hover:border-primary-500'
              }
            `}
            aria-pressed={category === 'food'}
          >
            <div className="flex flex-col items-center gap-2">
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center
                ${category === 'food' ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-700'}
              `}>
                <Utensils size={20} className={category === 'food' ? 'text-white' : 'text-slate-600 dark:text-slate-400'} />
              </div>
              <span className={`
                font-medium text-sm
                ${category === 'food' ? 'text-primary-900 dark:text-primary-100' : 'text-slate-700 dark:text-slate-300'}
              `}>
                Food
              </span>
            </div>
            {category === 'food' && (
              <div className="absolute top-2 right-2 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              relative p-4 rounded-lg border-2 transition-all duration-200
              ${category === 'clothes'
                ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-950/20'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary-400 dark:hover:border-primary-500'
              }
            `}
            aria-pressed={category === 'clothes'}
          >
            <div className="flex flex-col items-center gap-2">
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center
                ${category === 'clothes' ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-700'}
              `}>
                <Shirt size={20} className={category === 'clothes' ? 'text-white' : 'text-slate-600 dark:text-slate-400'} />
              </div>
              <span className={`
                font-medium text-sm
                ${category === 'clothes' ? 'text-primary-900 dark:text-primary-100' : 'text-slate-700 dark:text-slate-300'}
              `}>
                Clothes
              </span>
            </div>
            {category === 'clothes' && (
              <div className="absolute top-2 right-2 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        </div>
        {errors.category && (
          <p className="mt-1.5 text-xs text-danger-600 dark:text-danger-400 flex items-center gap-1">
            <AlertCircle size={12} />
            {errors.category}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-1.5">
          Description <span className="text-danger-500">*</span>
        </label>
        <textarea
          id="description"
          value={description || ''}
          onChange={handleDescriptionChange}
          placeholder="Provide details about your donation..."
          rows={3}
          maxLength={500}
          className={`
            w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 resize-none
            focus:outline-none focus:ring-2 focus:ring-primary-500/50
            ${errors.description 
              ? 'border-danger-500 dark:border-danger-400 bg-danger-50 dark:bg-danger-950/20' 
              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-primary-500 dark:focus:border-primary-400'
            }
            text-slate-900 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500 text-sm
          `}
          aria-invalid={errors.description ? 'true' : 'false'}
          aria-describedby={errors.description ? 'description-error' : undefined}
        />
        <div className="flex items-center justify-between mt-1">
          {errors.description && (
            <p id="description-error" className="text-xs text-danger-600 dark:text-danger-400 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.description}
            </p>
          )}
          <span className={`text-xs ${errors.description ? 'text-danger-600 dark:text-danger-400' : 'text-slate-500 dark:text-slate-400'} ml-auto`}>
            {(description || '').length} / 500
          </span>
        </div>
      </div>

      {/* Quantity and Unit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Quantity */}
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-1.5">
            Quantity <span className="text-danger-500">*</span>
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
                w-full px-3 py-2 rounded-lg border-2 transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-primary-500/50
                ${errors.quantity 
                  ? 'border-danger-500 dark:border-danger-400 bg-danger-50 dark:bg-danger-950/20' 
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-primary-500 dark:focus:border-primary-400'
                }
                text-slate-900 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500 text-sm
              `}
              aria-invalid={errors.quantity ? 'true' : 'false'}
              aria-describedby={errors.quantity ? 'quantity-error' : undefined}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Package size={16} className="text-slate-400 dark:text-slate-500" />
            </div>
          </div>
          {errors.quantity && (
            <p id="quantity-error" className="mt-1 text-xs text-danger-600 dark:text-danger-400 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.quantity}
            </p>
          )}
        </div>

        {/* Unit */}
        <div>
          <label htmlFor="quantityUnit" className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-1.5">
            Unit <span className="text-danger-500">*</span>
          </label>
          <select
            id="quantityUnit"
            value={quantityUnit || ''}
            onChange={(e) => handleQuantityUnitChange(e.target.value)}
            className={`
              w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 appearance-none cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-primary-500/50
              ${errors.quantityUnit 
                ? 'border-danger-500 dark:border-danger-400 bg-danger-50 dark:bg-danger-950/20' 
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-primary-500 dark:focus:border-primary-400'
              }
              text-slate-900 dark:text-slate-50 text-sm
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
            <p id="quantityUnit-error" className="mt-1 text-xs text-danger-600 dark:text-danger-400 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.quantityUnit}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
