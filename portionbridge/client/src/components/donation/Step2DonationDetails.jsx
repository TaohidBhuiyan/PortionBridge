import React from 'react';
import { AlertCircle, ChefHat, Shirt, Snowflake, Leaf, Moon, Calendar } from 'lucide-react';

/**
 * Step 2 - Donation Details
 * Shows category-specific fields based on Food or Clothes selection
 */
export function Step2DonationDetails({ formData, errors, onChange, onValidationChange }) {
  const { category, foodType, foodName, numberOfServings, ingredients, allergens, storageRequirement, isVegetarian, isHalal, refrigerationRequired, expiryDate, clothingCategory, gender, ageGroup, itemCondition, brand, size, color, season } = formData;

  // Validation
  React.useEffect(() => {
    let isValid = true;

    if (category === 'food') {
      isValid = isValid && foodType && foodName?.trim().length > 0;
    } else if (category === 'clothes') {
      isValid = isValid && clothingCategory && gender && ageGroup && itemCondition;
    }

    onValidationChange?.(isValid);
  }, [category, foodType, foodName, clothingCategory, gender, ageGroup, itemCondition, onValidationChange]);

  const handleAllergenToggle = (allergen) => {
    const currentAllergens = allergens || [];
    const newAllergens = currentAllergens.includes(allergen)
      ? currentAllergens.filter(a => a !== allergen)
      : [...currentAllergens, allergen];
    onChange('allergens', newAllergens);
  };

  const ALLERGEN_OPTIONS = [
    'Peanuts', 'Tree Nuts', 'Dairy', 'Eggs', 'Fish', 'Shellfish',
    'Soy', 'Wheat', 'Gluten', 'Sesame', 'Mustard', 'Sulfites'
  ];

  // Food Donation Fields
  if (category === 'food') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <ChefHat className="text-purple-500" size={20} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Food Donation Details</h3>
        </div>

        {/* Food Type */}
        <div>
          <label htmlFor="foodType" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Food Type <span className="text-red-500">*</span>
          </label>
          <select
            id="foodType"
            value={foodType || ''}
            onChange={(e) => onChange('foodType', e.target.value)}
            className={`
              w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 appearance-none cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-purple-500/50
              ${errors.foodType 
                ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-950/20' 
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-500 dark:focus:border-purple-400'
              }
              text-gray-900 dark:text-white
            `}
            aria-invalid={errors.foodType ? 'true' : 'false'}
          >
            <option value="">Select food type</option>
            <option value="cooked">Cooked</option>
            <option value="raw">Raw</option>
            <option value="packaged">Packaged</option>
          </select>
          {errors.foodType && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle size={14} />
              {errors.foodType}
            </p>
          )}
        </div>

        {/* Food Name */}
        <div>
          <label htmlFor="foodName" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Food Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="foodName"
            value={foodName || ''}
            onChange={(e) => onChange('foodName', e.target.value)}
            placeholder="e.g., Biryani, Vegetables, Rice"
            maxLength={200}
            className={`
              w-full px-4 py-3 rounded-xl border-2 transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-purple-500/50
              ${errors.foodName 
                ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-950/20' 
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-500 dark:focus:border-purple-400'
              }
              text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
            `}
            aria-invalid={errors.foodName ? 'true' : 'false'}
          />
          {errors.foodName && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle size={14} />
              {errors.foodName}
            </p>
          )}
        </div>

        {/* Number of Servings */}
        <div>
          <label htmlFor="numberOfServings" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Number of Servings (Optional)
          </label>
          <input
            type="number"
            id="numberOfServings"
            value={numberOfServings || ''}
            onChange={(e) => onChange('numberOfServings', parseInt(e.target.value) || null)}
            min="1"
            placeholder="e.g., 10"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        {/* Ingredients */}
        <div>
          <label htmlFor="ingredients" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Ingredients (Optional)
          </label>
          <textarea
            id="ingredients"
            value={ingredients || ''}
            onChange={(e) => onChange('ingredients', e.target.value)}
            placeholder="List main ingredients..."
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 resize-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        {/* Allergens */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
            Allergens (Optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {ALLERGEN_OPTIONS.map((allergen) => (
              <button
                key={allergen}
                type="button"
                onClick={() => handleAllergenToggle(allergen)}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                  ${(allergens || []).includes(allergen)
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }
                `}
              >
                {allergen}
              </button>
            ))}
          </div>
        </div>

        {/* Storage Requirement */}
        <div>
          <label htmlFor="storageRequirement" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Storage Requirement <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'room_temperature', label: 'Room Temperature', icon: null },
              { value: 'refrigerated', label: 'Refrigerated', icon: Snowflake },
              { value: 'frozen', label: 'Frozen', icon: Snowflake },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange('storageRequirement', option.value)}
                className={`
                  p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2
                  ${storageRequirement === option.value
                    ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-950/20'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-purple-400 dark:hover:border-purple-500'
                  }
                `}
              >
                {option.icon && <option.icon size={20} className={storageRequirement === option.value ? 'text-purple-500' : 'text-gray-500'} />}
                <span className={`text-xs font-medium ${storageRequirement === option.value ? 'text-purple-900 dark:text-purple-100' : 'text-gray-700 dark:text-gray-300'}`}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
          {errors.storageRequirement && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle size={14} />
              {errors.storageRequirement}
            </p>
          )}
        </div>

        {/* Vegetarian / Non-Vegetarian */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
            Vegetarian / Non-Vegetarian
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'vegetarian', label: 'Vegetarian', icon: Leaf },
              { value: 'non_vegetarian', label: 'Non-Vegetarian', icon: null },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange('isVegetarian', option.value)}
                className={`
                  p-3 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2
                  ${isVegetarian === option.value
                    ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-950/20'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-purple-400 dark:hover:border-purple-500'
                  }
                `}
              >
                {option.icon && <option.icon size={18} className={isVegetarian === option.value ? 'text-purple-500' : 'text-gray-500'} />}
                <span className={`text-sm font-medium ${isVegetarian === option.value ? 'text-purple-900 dark:text-purple-100' : 'text-gray-700 dark:text-gray-300'}`}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Halal */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
            Halal
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'yes', label: 'Yes', icon: Moon },
              { value: 'no', label: 'No', icon: null },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange('isHalal', option.value)}
                className={`
                  p-3 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2
                  ${isHalal === option.value
                    ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-950/20'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-purple-400 dark:hover:border-purple-500'
                  }
                `}
              >
                {option.icon && <option.icon size={18} className={isHalal === option.value ? 'text-purple-500' : 'text-gray-500'} />}
                <span className={`text-sm font-medium ${isHalal === option.value ? 'text-purple-900 dark:text-purple-100' : 'text-gray-700 dark:text-gray-300'}`}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Expiry Date */}
        <div>
          <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Expiry Date (Optional)
          </label>
          <div className="relative">
            <input
              type="datetime-local"
              id="expiryDate"
              value={expiryDate || ''}
              onChange={(e) => onChange('expiryDate', e.target.value)}
              className={`
                w-full px-4 py-3 rounded-xl border-2 transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-purple-500/50
                ${errors.expiryDate 
                  ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-950/20' 
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-500 dark:focus:border-purple-400'
                }
                text-gray-900 dark:text-white
              `}
              aria-invalid={errors.expiryDate ? 'true' : 'false'}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Calendar size={18} className="text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          {errors.expiryDate && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle size={14} />
              {errors.expiryDate}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Clothes Donation Fields
  if (category === 'clothes') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Shirt className="text-purple-500" size={20} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Clothes Donation Details</h3>
        </div>

        {/* Clothing Category */}
        <div>
          <label htmlFor="clothingCategory" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="clothingCategory"
            value={clothingCategory || ''}
            onChange={(e) => onChange('clothingCategory', e.target.value)}
            className={`
              w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 appearance-none cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-purple-500/50
              ${errors.clothingCategory 
                ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-950/20' 
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-500 dark:focus:border-purple-400'
              }
              text-gray-900 dark:text-white
            `}
            aria-invalid={errors.clothingCategory ? 'true' : 'false'}
          >
            <option value="">Select category</option>
            <option value="shirt">Shirt</option>
            <option value="t_shirt">T-Shirt</option>
            <option value="pants">Pants</option>
            <option value="jeans">Jeans</option>
            <option value="jacket">Jacket</option>
            <option value="sweater">Sweater</option>
            <option value="saree">Saree</option>
            <option value="salwar_kameez">Salwar Kameez</option>
            <option value="hijab">Hijab</option>
            <option value="shoes">Shoes</option>
            <option value="blanket">Blanket</option>
            <option value="others">Others</option>
          </select>
          {errors.clothingCategory && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle size={14} />
              {errors.clothingCategory}
            </p>
          )}
        </div>

        {/* Gender */}
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Gender <span className="text-red-500">*</span>
          </label>
          <select
            id="gender"
            value={gender || ''}
            onChange={(e) => onChange('gender', e.target.value)}
            className={`
              w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 appearance-none cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-purple-500/50
              ${errors.gender 
                ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-950/20' 
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-500 dark:focus:border-purple-400'
              }
              text-gray-900 dark:text-white
            `}
            aria-invalid={errors.gender ? 'true' : 'false'}
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="unisex">Unisex</option>
          </select>
          {errors.gender && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle size={14} />
              {errors.gender}
            </p>
          )}
        </div>

        {/* Age Group */}
        <div>
          <label htmlFor="ageGroup" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Age Group <span className="text-red-500">*</span>
          </label>
          <select
            id="ageGroup"
            value={ageGroup || ''}
            onChange={(e) => onChange('ageGroup', e.target.value)}
            className={`
              w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 appearance-none cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-purple-500/50
              ${errors.ageGroup 
                ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-950/20' 
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-500 dark:focus:border-purple-400'
              }
              text-gray-900 dark:text-white
            `}
            aria-invalid={errors.ageGroup ? 'true' : 'false'}
          >
            <option value="">Select age group</option>
            <option value="baby">Baby</option>
            <option value="child">Child</option>
            <option value="teen">Teen</option>
            <option value="adult">Adult</option>
            <option value="senior">Senior</option>
          </select>
          {errors.ageGroup && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle size={14} />
              {errors.ageGroup}
            </p>
          )}
        </div>

        {/* Item Condition */}
        <div>
          <label htmlFor="itemCondition" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Condition <span className="text-red-500">*</span>
          </label>
          <select
            id="itemCondition"
            value={itemCondition || ''}
            onChange={(e) => onChange('itemCondition', e.target.value)}
            className={`
              w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 appearance-none cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-purple-500/50
              ${errors.itemCondition 
                ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-950/20' 
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-500 dark:focus:border-purple-400'
              }
              text-gray-900 dark:text-white
            `}
            aria-invalid={errors.itemCondition ? 'true' : 'false'}
          >
            <option value="">Select condition</option>
            <option value="new">New</option>
            <option value="like_new">Like New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
          </select>
          {errors.itemCondition && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle size={14} />
              {errors.itemCondition}
            </p>
          )}
        </div>

        {/* Brand */}
        <div>
          <label htmlFor="brand" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Brand (Optional)
          </label>
          <input
            type="text"
            id="brand"
            value={brand || ''}
            onChange={(e) => onChange('brand', e.target.value)}
            placeholder="e.g., Nike, Zara"
            maxLength={100}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        {/* Size */}
        <div>
          <label htmlFor="size" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Size (Optional)
          </label>
          <select
            id="size"
            value={size || ''}
            onChange={(e) => onChange('size', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 appearance-none cursor-pointer text-gray-900 dark:text-white"
          >
            <option value="">Select size</option>
            <option value="xs">XS</option>
            <option value="s">S</option>
            <option value="m">M</option>
            <option value="l">L</option>
            <option value="xl">XL</option>
            <option value="xxl">XXL</option>
            <option value="free_size">Free Size</option>
          </select>
        </div>

        {/* Color */}
        <div>
          <label htmlFor="color" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Color (Optional)
          </label>
          <input
            type="text"
            id="color"
            value={color || ''}
            onChange={(e) => onChange('color', e.target.value)}
            placeholder="e.g., Blue, Black, Red"
            maxLength={50}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        {/* Season */}
        <div>
          <label htmlFor="season" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Season (Optional)
          </label>
          <select
            id="season"
            value={season || ''}
            onChange={(e) => onChange('season', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 appearance-none cursor-pointer text-gray-900 dark:text-white"
          >
            <option value="">Select season</option>
            <option value="summer">Summer</option>
            <option value="winter">Winter</option>
            <option value="rainy">Rainy</option>
            <option value="all_season">All Season</option>
          </select>
        </div>
      </div>
    );
  }

  // No category selected
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <AlertCircle size={32} className="text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Select a Category First
      </h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md">
        Please go back to Step 1 and select a donation category (Food or Clothes) to continue.
      </p>
    </div>
  );
}
