import React from 'react';
import { AlertCircle, ChefHat, Shirt, Snowflake, Leaf, Moon } from 'lucide-react';

const inputBase = 'w-full px-3.5 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-dash-primary/40 text-text-primary placeholder:text-text-secondary';
const inputOk = 'border-border bg-page focus:border-dash-primary';
const inputErr = 'border-danger bg-danger-soft';
const labelClass = 'block text-sm font-medium text-text-primary mb-1.5';
const errorClass = 'mt-1 text-xs text-danger flex items-center gap-1';

/**
 * Step 2 - Donation Details
 * Shows category-specific fields based on Food or Clothes selection
 */
export function Step2DonationDetails({ formData, errors, onChange, onValidationChange }) {
  const { category, foodType, foodName, numberOfServings, ingredients, allergens, storageRequirement, isVegetarian, isHalal, expiryDate, clothingCategory, gender, ageGroup, itemCondition, brand, size, color, season } = formData;

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

  // Reusable segmented-choice button (storage requirement, vegetarian, halal)
  const ChoiceButton = ({ selected, onClick, icon: Icon, label }) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-2.5 rounded-lg border transition-colors flex items-center justify-center gap-2 ${
        selected
          ? 'border-dash-primary bg-dash-primary-soft'
          : 'border-border bg-page hover:border-dash-primary/50'
      }`}
    >
      {Icon && <Icon size={16} className={selected ? 'text-dash-primary' : 'text-text-secondary'} />}
      <span className={`text-xs font-medium ${selected ? 'text-dash-primary' : 'text-text-secondary'}`}>
        {label}
      </span>
    </button>
  );

  // Food Donation Fields
  if (category === 'food') {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <ChefHat className="text-dash-primary" size={18} />
          <h3 className="text-base font-semibold text-text-primary">Food Donation Details</h3>
        </div>

        {/* Food Type */}
        <div>
          <label htmlFor="foodType" className={labelClass}>
            Food Type <span className="text-danger">*</span>
          </label>
          <select
            id="foodType"
            value={foodType || ''}
            onChange={(e) => onChange('foodType', e.target.value)}
            className={`${inputBase} appearance-none cursor-pointer ${errors.foodType ? inputErr : inputOk}`}
            aria-invalid={errors.foodType ? 'true' : 'false'}
          >
            <option value="">Select food type</option>
            <option value="cooked">Cooked</option>
            <option value="raw">Raw</option>
            <option value="packaged">Packaged</option>
          </select>
          {errors.foodType && (
            <p className={errorClass}>
              <AlertCircle size={13} />
              {errors.foodType}
            </p>
          )}
        </div>

        {/* Food Name */}
        <div>
          <label htmlFor="foodName" className={labelClass}>
            Food Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            id="foodName"
            value={foodName || ''}
            onChange={(e) => onChange('foodName', e.target.value)}
            placeholder="e.g., Biryani, Vegetables, Rice"
            maxLength={200}
            className={`${inputBase} ${errors.foodName ? inputErr : inputOk}`}
            aria-invalid={errors.foodName ? 'true' : 'false'}
          />
          {errors.foodName && (
            <p className={errorClass}>
              <AlertCircle size={13} />
              {errors.foodName}
            </p>
          )}
        </div>

        {/* Number of Servings */}
        <div>
          <label htmlFor="numberOfServings" className={labelClass}>
            Number of Servings (Optional)
          </label>
          <input
            type="number"
            id="numberOfServings"
            value={numberOfServings || ''}
            onChange={(e) => onChange('numberOfServings', parseInt(e.target.value) || null)}
            min="1"
            placeholder="e.g., 10"
            className={`${inputBase} ${inputOk}`}
          />
        </div>

        {/* Ingredients */}
        <div>
          <label htmlFor="ingredients" className={labelClass}>
            Ingredients (Optional)
          </label>
          <textarea
            id="ingredients"
            value={ingredients || ''}
            onChange={(e) => onChange('ingredients', e.target.value)}
            placeholder="List main ingredients..."
            rows={3}
            maxLength={500}
            className={`${inputBase} resize-none ${inputOk}`}
          />
        </div>

        {/* Allergens */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Allergens (Optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {ALLERGEN_OPTIONS.map((allergen) => (
              <button
                key={allergen}
                type="button"
                onClick={() => handleAllergenToggle(allergen)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  (allergens || []).includes(allergen)
                    ? 'bg-dash-primary text-white'
                    : 'bg-page border border-border text-text-secondary hover:border-dash-primary/50'
                }`}
              >
                {allergen}
              </button>
            ))}
          </div>
        </div>

        {/* Storage Requirement */}
        <div>
          <label className={labelClass}>
            Storage Requirement <span className="text-danger">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { value: 'room_temperature', label: 'Room Temp.', icon: null },
              { value: 'refrigerated', label: 'Refrigerated', icon: Snowflake },
              { value: 'frozen', label: 'Frozen', icon: Snowflake },
            ].map((option) => (
              <ChoiceButton
                key={option.value}
                selected={storageRequirement === option.value}
                onClick={() => onChange('storageRequirement', option.value)}
                icon={option.icon}
                label={option.label}
              />
            ))}
          </div>
          {errors.storageRequirement && (
            <p className={errorClass}>
              <AlertCircle size={13} />
              {errors.storageRequirement}
            </p>
          )}
        </div>

        {/* Vegetarian / Non-Vegetarian */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Vegetarian / Non-Vegetarian
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { value: 'vegetarian', label: 'Vegetarian', icon: Leaf },
              { value: 'non_vegetarian', label: 'Non-Vegetarian', icon: null },
            ].map((option) => (
              <ChoiceButton
                key={option.value}
                selected={isVegetarian === option.value}
                onClick={() => onChange('isVegetarian', option.value)}
                icon={option.icon}
                label={option.label}
              />
            ))}
          </div>
        </div>

        {/* Halal */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Halal
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { value: 'yes', label: 'Yes', icon: Moon },
              { value: 'no', label: 'No', icon: null },
            ].map((option) => (
              <ChoiceButton
                key={option.value}
                selected={isHalal === option.value}
                onClick={() => onChange('isHalal', option.value)}
                icon={option.icon}
                label={option.label}
              />
            ))}
          </div>
        </div>

        {/* Expiry Date */}
        <div>
          <label htmlFor="expiryDate" className={labelClass}>
            Expiry Date (Optional)
          </label>
          <input
            type="datetime-local"
            id="expiryDate"
            value={expiryDate || ''}
            onChange={(e) => onChange('expiryDate', e.target.value)}
            className={`${inputBase} ${inputOk}`}
          />
        </div>
      </div>
    );
  }

  // Clothes Donation Fields
  if (category === 'clothes') {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Shirt className="text-dash-primary" size={18} />
          <h3 className="text-base font-semibold text-text-primary">Clothes Donation Details</h3>
        </div>

        {/* Clothing Category */}
        <div>
          <label htmlFor="clothingCategory" className={labelClass}>
            Clothing Category <span className="text-danger">*</span>
          </label>
          <select
            id="clothingCategory"
            value={clothingCategory || ''}
            onChange={(e) => onChange('clothingCategory', e.target.value)}
            className={`${inputBase} appearance-none cursor-pointer ${errors.clothingCategory ? inputErr : inputOk}`}
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
            <p className={errorClass}>
              <AlertCircle size={13} />
              {errors.clothingCategory}
            </p>
          )}
        </div>

        {/* Gender */}
        <div>
          <label htmlFor="gender" className={labelClass}>
            Gender <span className="text-danger">*</span>
          </label>
          <select
            id="gender"
            value={gender || ''}
            onChange={(e) => onChange('gender', e.target.value)}
            className={`${inputBase} appearance-none cursor-pointer ${errors.gender ? inputErr : inputOk}`}
            aria-invalid={errors.gender ? 'true' : 'false'}
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="unisex">Unisex</option>
          </select>
          {errors.gender && (
            <p className={errorClass}>
              <AlertCircle size={13} />
              {errors.gender}
            </p>
          )}
        </div>

        {/* Age Group */}
        <div>
          <label htmlFor="ageGroup" className={labelClass}>
            Age Group <span className="text-danger">*</span>
          </label>
          <select
            id="ageGroup"
            value={ageGroup || ''}
            onChange={(e) => onChange('ageGroup', e.target.value)}
            className={`${inputBase} appearance-none cursor-pointer ${errors.ageGroup ? inputErr : inputOk}`}
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
            <p className={errorClass}>
              <AlertCircle size={13} />
              {errors.ageGroup}
            </p>
          )}
        </div>

        {/* Item Condition */}
        <div>
          <label htmlFor="itemCondition" className={labelClass}>
            Item Condition <span className="text-danger">*</span>
          </label>
          <select
            id="itemCondition"
            value={itemCondition || ''}
            onChange={(e) => onChange('itemCondition', e.target.value)}
            className={`${inputBase} appearance-none cursor-pointer ${errors.itemCondition ? inputErr : inputOk}`}
            aria-invalid={errors.itemCondition ? 'true' : 'false'}
          >
            <option value="">Select condition</option>
            <option value="new">New</option>
            <option value="like_new">Like New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
          </select>
          {errors.itemCondition && (
            <p className={errorClass}>
              <AlertCircle size={13} />
              {errors.itemCondition}
            </p>
          )}
        </div>

        {/* Brand */}
        <div>
          <label htmlFor="brand" className={labelClass}>
            Brand (Optional)
          </label>
          <input
            type="text"
            id="brand"
            value={brand || ''}
            onChange={(e) => onChange('brand', e.target.value)}
            placeholder="e.g., Nike, Zara"
            className={`${inputBase} ${inputOk}`}
          />
        </div>

        {/* Size */}
        <div>
          <label htmlFor="size" className={labelClass}>
            Size (Optional)
          </label>
          <select
            id="size"
            value={size || ''}
            onChange={(e) => onChange('size', e.target.value)}
            className={`${inputBase} appearance-none cursor-pointer ${inputOk}`}
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
          <label htmlFor="color" className={labelClass}>
            Color (Optional)
          </label>
          <input
            type="text"
            id="color"
            value={color || ''}
            onChange={(e) => onChange('color', e.target.value)}
            placeholder="e.g., Blue, Black"
            className={`${inputBase} ${inputOk}`}
          />
        </div>

        {/* Season */}
        <div>
          <label htmlFor="season" className={labelClass}>
            Season (Optional)
          </label>
          <select
            id="season"
            value={season || ''}
            onChange={(e) => onChange('season', e.target.value)}
            className={`${inputBase} appearance-none cursor-pointer ${inputOk}`}
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
    <div className="bg-warning-soft border border-warning/30 rounded-lg p-4">
      <p className="text-warning text-sm">
        Please select a donation category in Step 1 to continue.
      </p>
    </div>
  );
}
