import React from 'react';
import { Utensils, Shirt, Package, AlertCircle, Check, Sparkles, Minus, Plus } from 'lucide-react';

const inputBase = 'w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-dash-primary/30 text-text-primary placeholder:text-text-muted text-sm shadow-xs';
const inputOk = 'border-border bg-input hover:border-border-strong focus:border-dash-primary';
const inputErr = 'border-danger bg-danger-soft/40 focus:border-danger';
const labelClass = 'block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2';
const errorClass = 'mt-1.5 text-xs text-danger flex items-center gap-1.5 font-medium';

const SUGGESTIONS = {
  food: [
    'Fresh Cooked Meals',
    'Event / Catering Surplus',
    'Bakery & Fresh Breads',
    'Dry Groceries & Rations',
    'Fruits & Fresh Produce'
  ],
  clothes: [
    'Winter Jackets & Sweaters',
    'Assorted Casual Clothes',
    'Children & Kids Wear Set',
    'Warm Blankets & Quilts',
    'Gently Used Shoes & Boots'
  ]
};

const QUANTITY_PRESETS = {
  food: [5, 10, 25, 50, 100],
  clothes: [2, 5, 10, 20, 50],
};

const DESCRIPTION_PROMPTS = {
  food: [
    'Prepared fresh today',
    'Packed in clean food containers',
    'Requires immediate distribution',
    'Keep upright during transport'
  ],
  clothes: [
    'Washed, cleaned, and neatly folded',
    'Packed in clean polybags or cartons',
    'No tears, stains, or damages',
    'Suitable for immediate wear'
  ]
};

/**
 * Step 1 - Basic Information
 * Fields: Title, Category, Description, Quantity, Unit
 * Ultra-premium design with interactive visual category cards,
 * 1-click title suggestions, quantity steppers and presets.
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
    onChange('title', e.target.value);
  };

  const handleCategoryChange = (value) => {
    onChange('category', value);

    if (value === 'clothes') {
      // Auto-set appropriate clothing unit if current unit is food-specific
      if (!quantityUnit || ['plate', 'kg', 'gram', 'liter'].includes(quantityUnit)) {
        onChange('quantityUnit', 'piece');
      }
      // Reset food-specific fields
      onChange('foodType', null);
      onChange('foodName', '');
      onChange('numberOfServings', null);
      onChange('ingredients', '');
      onChange('allergens', []);
      onChange('storageRequirement', null);
      onChange('isVegetarian', null);
      onChange('isHalal', null);
      onChange('expiryDate', '');
    } else if (value === 'food') {
      // Auto-set food unit if not set
      if (!quantityUnit) {
        onChange('quantityUnit', 'plate');
      }
      // Reset clothes-specific fields
      onChange('clothingCategory', null);
      onChange('gender', null);
      onChange('ageGroup', null);
      onChange('itemCondition', null);
      onChange('brand', '');
      onChange('size', null);
      onChange('color', '');
      onChange('season', null);
    }
  };

  const handleDescriptionChange = (e) => {
    onChange('description', e.target.value);
  };

  const handleQuantityChange = (e) => {
    const val = parseInt(e.target.value, 10);
    onChange('quantity', isNaN(val) ? '' : Math.max(0, val));
  };

  const handleQuantityStep = (delta) => {
    const current = parseInt(quantity, 10) || 0;
    const nextVal = Math.max(1, current + delta);
    onChange('quantity', nextVal);
  };

  const handleApplySuggestion = (text) => {
    onChange('title', text);
  };

  const handleAddPrompt = (promptText) => {
    const current = (description || '').trim();
    if (!current) {
      onChange('description', promptText);
    } else if (!current.includes(promptText)) {
      onChange('description', `${current}. ${promptText}`);
    }
  };

  const currentSuggestions = (category && SUGGESTIONS[category]) || [
    ...SUGGESTIONS.food.slice(0, 3),
    ...SUGGESTIONS.clothes.slice(0, 2)
  ];

  const activePresets = (category && QUANTITY_PRESETS[category]) || QUANTITY_PRESETS.food;
  const activePrompts = (category && DESCRIPTION_PROMPTS[category]) || [
    ...DESCRIPTION_PROMPTS.food.slice(0, 2),
    ...DESCRIPTION_PROMPTS.clothes.slice(0, 2)
  ];

  return (
    <div className="space-y-7">
      {/* Category Selection Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className={labelClass}>
            1. Select Donation Category <span className="text-danger">*</span>
          </label>
          <span className="text-xs text-text-muted">What are you sharing today?</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Food Card */}
          <button
            type="button"
            onClick={() => handleCategoryChange('food')}
            className={`relative p-5 rounded-2xl border text-left transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-dash-primary ${
              category === 'food'
                ? 'border-dash-primary bg-gradient-to-br from-dash-primary-soft to-amber-500/5 ring-2 ring-dash-primary/20 shadow-md'
                : 'border-border bg-surface hover:border-dash-primary/40 hover:bg-surface-hover/60'
            }`}
            aria-pressed={category === 'food'}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                  category === 'food'
                    ? 'bg-dash-primary text-white shadow-md shadow-dash-primary/20'
                    : 'bg-page border border-border text-amber-500'
                }`}
              >
                <Utensils size={22} />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-text-primary">Donate Food</h4>
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    Hunger Relief
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  Cooked meals, raw groceries, bakery goods, and pantry rations to feed hungry communities.
                </p>
              </div>
            </div>

            {category === 'food' && (
              <div className="absolute top-4 right-4 w-5 h-5 bg-dash-primary rounded-full flex items-center justify-center text-white shadow-sm">
                <Check size={12} className="stroke-[3]" />
              </div>
            )}
          </button>

          {/* Clothes Card */}
          <button
            type="button"
            onClick={() => handleCategoryChange('clothes')}
            className={`relative p-5 rounded-2xl border text-left transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-dash-primary ${
              category === 'clothes'
                ? 'border-dash-primary bg-gradient-to-br from-dash-primary-soft to-indigo-500/5 ring-2 ring-dash-primary/20 shadow-md'
                : 'border-border bg-surface hover:border-dash-primary/40 hover:bg-surface-hover/60'
            }`}
            aria-pressed={category === 'clothes'}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                  category === 'clothes'
                    ? 'bg-dash-primary text-white shadow-md shadow-dash-primary/20'
                    : 'bg-page border border-border text-indigo-500'
                }`}
              >
                <Shirt size={22} />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-text-primary">Donate Clothes</h4>
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    Warmth & Dignity
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  Wearable clothing, winter coats, jackets, blankets, and footwear in usable condition.
                </p>
              </div>
            </div>

            {category === 'clothes' && (
              <div className="absolute top-4 right-4 w-5 h-5 bg-dash-primary rounded-full flex items-center justify-center text-white shadow-sm">
                <Check size={12} className="stroke-[3]" />
              </div>
            )}
          </button>
        </div>

        {errors.category && (
          <p className={errorClass}>
            <AlertCircle size={14} />
            {errors.category}
          </p>
        )}
      </div>

      {/* Donation Title */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="title" className={labelClass}>
            2. Donation Title <span className="text-danger">*</span>
          </label>
          <span className={`text-xs ${errors.title ? 'text-danger font-medium' : 'text-text-muted'}`}>
            {(title || '').length} / 200
          </span>
        </div>

        <div className="relative">
          <input
            type="text"
            id="title"
            value={title || ''}
            onChange={handleTitleChange}
            placeholder={
              category === 'food'
                ? 'e.g., 30 Fresh Biryani packets from wedding banquet'
                : category === 'clothes'
                ? 'e.g., 5 Warm winter jackets for children & adults'
                : 'Give your donation a short, descriptive title...'
            }
            maxLength={200}
            className={`${inputBase} ${errors.title ? inputErr : inputOk}`}
            aria-invalid={errors.title ? 'true' : 'false'}
            aria-describedby={errors.title ? 'title-error' : undefined}
          />
        </div>

        {/* Quick Title Suggestion Chips */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-text-muted flex items-center gap-1 mr-1">
            <Sparkles size={12} className="text-dash-primary" />
            Quick Ideas:
          </span>
          {currentSuggestions.map((sugg) => (
            <button
              key={sugg}
              type="button"
              onClick={() => handleApplySuggestion(sugg)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-page border border-border/80 text-text-secondary hover:text-dash-primary hover:border-dash-primary/50 hover:bg-dash-primary-soft transition-colors"
            >
              + {sugg}
            </button>
          ))}
        </div>

        {errors.title && (
          <p id="title-error" className={errorClass}>
            <AlertCircle size={14} />
            {errors.title}
          </p>
        )}
      </div>

      {/* Quantity & Unit Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 rounded-2xl bg-surface border border-border/70 shadow-xs">
        {/* Quantity Stepper */}
        <div>
          <label htmlFor="quantity" className={labelClass}>
            3. Quantity <span className="text-danger">*</span>
          </label>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleQuantityStep(-1)}
              disabled={!quantity || quantity <= 1}
              className="w-11 h-11 rounded-xl border border-border bg-page flex items-center justify-center text-text-secondary hover:bg-surface-hover hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus size={16} />
            </button>

            <div className="relative flex-1">
              <input
                type="number"
                id="quantity"
                value={quantity || ''}
                onChange={handleQuantityChange}
                min="1"
                placeholder="Enter amount"
                className={`${inputBase} text-center font-bold text-base ${errors.quantity ? inputErr : inputOk}`}
                aria-invalid={errors.quantity ? 'true' : 'false'}
                aria-describedby={errors.quantity ? 'quantity-error' : undefined}
              />
            </div>

            <button
              type="button"
              onClick={() => handleQuantityStep(1)}
              className="w-11 h-11 rounded-xl border border-border bg-page flex items-center justify-center text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
              aria-label="Increase quantity"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Quantity Preset Chips */}
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="text-[11px] text-text-muted mr-1">Presets:</span>
            {activePresets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onChange('quantity', preset)}
                className={`px-2 py-0.5 text-xs rounded-lg border transition-all ${
                  quantity === preset
                    ? 'bg-dash-primary text-white border-dash-primary font-bold shadow-xs'
                    : 'bg-page border-border text-text-secondary hover:border-dash-primary/40'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {errors.quantity && (
            <p id="quantity-error" className={errorClass}>
              <AlertCircle size={14} />
              {errors.quantity}
            </p>
          )}
        </div>

        {/* Unit Selection */}
        <div>
          <label htmlFor="quantityUnit" className={labelClass}>
            Unit of Measurement <span className="text-danger">*</span>
          </label>
          <div className="relative">
            <select
              id="quantityUnit"
              value={quantityUnit || ''}
              onChange={(e) => onChange('quantityUnit', e.target.value)}
              className={`${inputBase} appearance-none cursor-pointer pr-10 font-medium ${errors.quantityUnit ? inputErr : inputOk}`}
              aria-invalid={errors.quantityUnit ? 'true' : 'false'}
              aria-describedby={errors.quantityUnit ? 'quantityUnit-error' : undefined}
            >
              {category === 'clothes' ? (
                <>
                  <option value="">Select clothing unit...</option>
                  <option value="piece">Piece (Individual garments)</option>
                  <option value="box">Box (Packed carton of clothes)</option>
                  <option value="packet">Packet / Bag (Packed bag of garments)</option>
                </>
              ) : (
                <>
                  <option value="">Select food measurement unit...</option>
                  <optgroup label="Meals & Prepared Portions">
                    <option value="plate">Plate (Individual meals)</option>
                    <option value="box">Box (Catering / Meal boxes)</option>
                    <option value="packet">Packet (Sealed food packs)</option>
                    <option value="piece">Piece (Fruits / bakery items)</option>
                  </optgroup>
                  <optgroup label="Bulk Groceries, Rations & Volume">
                    <option value="kg">Kilogram (Kg)</option>
                    <option value="gram">Gram (g)</option>
                    <option value="liter">Liter (L)</option>
                  </optgroup>
                </>
              )}
            </select>
            <Package size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>

          <p className="text-[11px] text-text-muted mt-2">
            {category === 'clothes' 
              ? 'Choose "Piece" for individual clothing items (e.g., 5 jackets), or "Box" / "Packet" for bundles'
              : 'Choose "Plate" or "Box" for prepared meals, or "Kg" / "Liter" for groceries'}
          </p>

          {errors.quantityUnit && (
            <p id="quantityUnit-error" className={errorClass}>
              <AlertCircle size={14} />
              {errors.quantityUnit}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="description" className={labelClass}>
            4. Description & Notes <span className="text-danger">*</span>
          </label>
          <span className={`text-xs ${errors.description ? 'text-danger font-medium' : 'text-text-muted'}`}>
            {(description || '').length} / 500
          </span>
        </div>

        <textarea
          id="description"
          value={description || ''}
          onChange={handleDescriptionChange}
          placeholder={
            category === 'clothes'
              ? 'Describe clothing types, sizes, condition, and if they are clean and folded...'
              : 'Describe the food items, preparation time, packaging, or handling instructions...'
          }
          rows={3}
          maxLength={500}
          className={`${inputBase} resize-none ${errors.description ? inputErr : inputOk}`}
          aria-invalid={errors.description ? 'true' : 'false'}
          aria-describedby={errors.description ? 'description-error' : undefined}
        />

        {/* Quick Description Starter Prompts */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-text-muted mr-1">Quick Add:</span>
          {activePrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleAddPrompt(prompt)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-page border border-border/70 text-text-secondary hover:text-text-primary hover:border-dash-primary/40 transition-colors"
            >
              + {prompt}
            </button>
          ))}
        </div>

        {errors.description && (
          <p id="description-error" className={errorClass}>
            <AlertCircle size={14} />
            {errors.description}
          </p>
        )}
      </div>

      {/* Category-Specific Impact Encouragement Note */}
      {category === 'clothes' ? (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300">
          <Shirt size={20} className="shrink-0 text-indigo-600 dark:text-indigo-400" />
          <p className="text-xs leading-relaxed">
            <strong className="font-semibold">Warmth & Dignity Initiative:</strong> Every wearable garment shared restores comfort, protection, and confidence to families and shelter residents in need.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
          <Utensils size={20} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
          <p className="text-xs leading-relaxed">
            <strong className="font-semibold">Zero Hunger Initiative:</strong> Every food portion shared rescues fresh surplus from waste and directly nourishes hungry individuals in your local community.
          </p>
        </div>
      )}
    </div>
  );
}