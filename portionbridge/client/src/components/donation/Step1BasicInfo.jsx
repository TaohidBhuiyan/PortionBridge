import React from 'react';
import { Utensils, Shirt, Package, AlertCircle, Check } from 'lucide-react';

const inputBase = 'w-full px-3.5 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-dash-primary/40 text-text-primary placeholder:text-text-secondary';
const inputOk = 'border-border bg-page focus:border-dash-primary';
const inputErr = 'border-danger bg-danger-soft';
const labelClass = 'block text-sm font-medium text-text-primary mb-1.5';
const errorClass = 'mt-1 text-xs text-danger flex items-center gap-1';

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

  const CATEGORY_OPTIONS = [
    { value: 'food', label: 'Food', icon: Utensils, description: 'Meals, groceries, or produce' },
    { value: 'clothes', label: 'Clothes', icon: Shirt, description: 'Clothing items in usable condition' },
  ];

  return (
    <div className="space-y-5">
      {/* Title */}
      <div>
        <label htmlFor="title" className={labelClass}>
          Donation Title <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={title || ''}
          onChange={handleTitleChange}
          placeholder="e.g., Fresh vegetables for community kitchen"
          maxLength={200}
          className={`${inputBase} ${errors.title ? inputErr : inputOk}`}
          aria-invalid={errors.title ? 'true' : 'false'}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        <div className="flex items-center justify-between mt-1">
          {errors.title && (
            <p id="title-error" className={errorClass}>
              <AlertCircle size={13} />
              {errors.title}
            </p>
          )}
          <span className={`text-xs ${errors.title ? 'text-danger' : 'text-text-secondary'} ml-auto`}>
            {(title || '').length} / 200
          </span>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Donation Category <span className="text-danger">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORY_OPTIONS.map((option) => {
            const Icon = option.icon;
            const selected = category === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleCategoryChange(option.value)}
                className={`relative p-4 rounded-lg border text-left transition-colors ${
                  selected
                    ? 'border-dash-primary bg-dash-primary-soft'
                    : 'border-border bg-page hover:border-dash-primary/50'
                }`}
                aria-pressed={selected}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    selected ? 'bg-dash-primary text-white' : 'bg-surface text-text-secondary'
                  }`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${selected ? 'text-dash-primary' : 'text-text-primary'}`}>
                      {option.label}
                    </p>
                    <p className="text-xs text-text-secondary truncate">{option.description}</p>
                  </div>
                </div>
                {selected && (
                  <div className="absolute top-2.5 right-2.5 w-4 h-4 bg-dash-primary rounded-full flex items-center justify-center">
                    <Check size={10} className="text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {errors.category && (
          <p className={errorClass}>
            <AlertCircle size={13} />
            {errors.category}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className={labelClass}>
          Description <span className="text-danger">*</span>
        </label>
        <textarea
          id="description"
          value={description || ''}
          onChange={handleDescriptionChange}
          placeholder="Provide details about your donation..."
          rows={4}
          maxLength={500}
          className={`${inputBase} resize-none ${errors.description ? inputErr : inputOk}`}
          aria-invalid={errors.description ? 'true' : 'false'}
          aria-describedby={errors.description ? 'description-error' : undefined}
        />
        <div className="flex items-center justify-between mt-1">
          {errors.description && (
            <p id="description-error" className={errorClass}>
              <AlertCircle size={13} />
              {errors.description}
            </p>
          )}
          <span className={`text-xs ${errors.description ? 'text-danger' : 'text-text-secondary'} ml-auto`}>
            {(description || '').length} / 500
          </span>
        </div>
      </div>

      {/* Quantity and Unit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quantity */}
        <div>
          <label htmlFor="quantity" className={labelClass}>
            Quantity <span className="text-danger">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              id="quantity"
              value={quantity || ''}
              onChange={handleQuantityChange}
              min="1"
              placeholder="Enter quantity"
              className={`${inputBase} pr-9 ${errors.quantity ? inputErr : inputOk}`}
              aria-invalid={errors.quantity ? 'true' : 'false'}
              aria-describedby={errors.quantity ? 'quantity-error' : undefined}
            />
            <Package size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          </div>
          {errors.quantity && (
            <p id="quantity-error" className={errorClass}>
              <AlertCircle size={13} />
              {errors.quantity}
            </p>
          )}
        </div>

        {/* Unit */}
        <div>
          <label htmlFor="quantityUnit" className={labelClass}>
            Unit <span className="text-danger">*</span>
          </label>
          <select
            id="quantityUnit"
            value={quantityUnit || ''}
            onChange={(e) => handleQuantityUnitChange(e.target.value)}
            className={`${inputBase} appearance-none cursor-pointer ${errors.quantityUnit ? inputErr : inputOk}`}
            aria-invalid={errors.quantityUnit ? 'true' : 'false'}
            aria-describedby={errors.quantityUnit ? 'quantityUnit-error' : undefined}
          >
            <option value="">Select unit</option>
            <option value="plate">Plate</option>
            <option value="box">Box</option>
            <option value="packet">Packet</option>
            <option value="piece">Piece</option>
            <option value="kg">Kilogram</option>
            <option value="gram">Gram</option>
            <option value="liter">Liter</option>
          </select>
          {errors.quantityUnit && (
            <p id="quantityUnit-error" className={errorClass}>
              <AlertCircle size={13} />
              {errors.quantityUnit}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}