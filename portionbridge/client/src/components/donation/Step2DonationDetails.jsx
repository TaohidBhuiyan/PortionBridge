import React from 'react';
import { 
  AlertCircle, 
  ChefHat, 
  Shirt, 
  Snowflake, 
  Leaf, 
  Moon, 
  Flame, 
  Apple, 
  Package, 
  Sparkles, 
  Star,
  Sun,
  Check
} from 'lucide-react';

const inputBase = 'w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-dash-primary/30 text-text-primary placeholder:text-text-muted text-sm shadow-xs';
const inputOk = 'border-border bg-input hover:border-border-strong focus:border-dash-primary';
const inputErr = 'border-danger bg-danger-soft/40 focus:border-danger';
const labelClass = 'block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2';
const errorClass = 'mt-1.5 text-xs text-danger flex items-center gap-1.5 font-medium';

const ALLERGEN_OPTIONS = [
  'Peanuts', 'Tree Nuts', 'Dairy', 'Eggs', 'Fish', 'Shellfish',
  'Soy', 'Wheat', 'Gluten', 'Sesame', 'Mustard', 'Sulfites'
];

/**
 * Step 2 - Donation Details
 * Shows category-specific fields based on Food or Clothes selection
 * Elevated with tactile cards, impact metrics, and rapid time presets.
 */
export function Step2DonationDetails({ formData, errors, onChange, onValidationChange }) {
  const { 
    category, 
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
    season 
  } = formData;

  // Validation
  React.useEffect(() => {
    let isValid = true;

    if (category === 'food') {
      isValid = Boolean(foodType && foodName?.trim() && storageRequirement);
    } else if (category === 'clothes') {
      isValid = Boolean(clothingCategory && gender && ageGroup && itemCondition);
    }

    onValidationChange?.(isValid);
  }, [category, foodType, foodName, storageRequirement, clothingCategory, gender, ageGroup, itemCondition, onValidationChange]);

  const handleAllergenToggle = (allergen) => {
    if (allergen === 'None') {
      onChange('allergens', []);
      return;
    }
    const currentAllergens = allergens || [];
    const newAllergens = currentAllergens.includes(allergen)
      ? currentAllergens.filter(a => a !== allergen)
      : [...currentAllergens, allergen];
    onChange('allergens', newAllergens);
  };

  const handleSetExpiryPreset = (hoursFromNow, targetHour) => {
    const d = new Date();
    if (targetHour !== undefined) {
      d.setHours(targetHour, 0, 0, 0);
      if (d <= new Date()) d.setDate(d.getDate() + 1);
    } else {
      d.setTime(d.getTime() + hoursFromNow * 60 * 60 * 1000);
    }
    // Format to YYYY-MM-DDTHH:MM (local time string)
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    onChange('expiryDate', `${year}-${month}-${day}T${hours}:${minutes}`);
  };

  // ==========================================
  // FOOD DONATION SECTION
  // ==========================================
  if (category === 'food') {
    const servingsCount = parseInt(numberOfServings, 10) || parseInt(formData.quantity, 10) || 0;

    return (
      <div className="space-y-7">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ChefHat size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Food Donation Specifications</h3>
              <p className="text-xs text-text-muted">Ensure safe handling and dietary clarity for recipients</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-dash-primary-soft text-dash-primary">
            Step 2 of 6
          </span>
        </div>

        {/* 1. Food Type Selection Cards */}
        <div>
          <label className={labelClass}>
            1. Food Type <span className="text-danger">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                value: 'cooked',
                title: 'Cooked Meals',
                desc: 'Warm dishes, banquet food, freshly prepared lunch/dinner',
                icon: Flame,
                color: 'text-rose-500 bg-rose-500/10'
              },
              {
                value: 'raw',
                title: 'Raw Produce',
                desc: 'Fresh vegetables, fruits, uncooked rice, lentils, raw meat',
                icon: Apple,
                color: 'text-emerald-500 bg-emerald-500/10'
              },
              {
                value: 'packaged',
                title: 'Packaged / Dry',
                desc: 'Sealed pantry items, biscuits, canned food, long-shelf goods',
                icon: Package,
                color: 'text-blue-500 bg-blue-500/10'
              }
            ].map((option) => {
              const Icon = option.icon;
              const isSelected = foodType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChange('foodType', option.value)}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-dash-primary flex flex-col justify-between ${
                    isSelected
                      ? 'border-dash-primary bg-dash-primary-soft ring-2 ring-dash-primary/20 shadow-sm'
                      : 'border-border bg-surface hover:border-dash-primary/40 hover:bg-surface-hover/60'
                  }`}
                  aria-pressed={isSelected}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${option.color}`}>
                      <Icon size={18} />
                    </div>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-dash-primary" />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${isSelected ? 'text-dash-primary' : 'text-text-primary'}`}>
                      {option.title}
                    </p>
                    <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                      {option.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          {errors.foodType && (
            <p className={errorClass}>
              <AlertCircle size={14} />
              {errors.foodType}
            </p>
          )}
        </div>

        {/* 2. Food Name & Estimated Servings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Food Name */}
          <div>
            <label htmlFor="foodName" className={labelClass}>
              2. Specific Food Item Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              id="foodName"
              value={foodName || ''}
              onChange={(e) => onChange('foodName', e.target.value)}
              placeholder="e.g., Chicken Biryani with Boiled Eggs"
              maxLength={200}
              className={`${inputBase} ${errors.foodName ? inputErr : inputOk}`}
              aria-invalid={errors.foodName ? 'true' : 'false'}
            />
            {errors.foodName && (
              <p className={errorClass}>
                <AlertCircle size={14} />
                {errors.foodName}
              </p>
            )}
          </div>

          {/* Number of Servings */}
          <div>
            <label htmlFor="numberOfServings" className={labelClass}>
              Estimated Servings / People Count
            </label>
            <input
              type="number"
              id="numberOfServings"
              value={numberOfServings || ''}
              onChange={(e) => onChange('numberOfServings', parseInt(e.target.value, 10) || null)}
              min="1"
              placeholder="e.g., 25"
              className={`${inputBase} ${inputOk}`}
            />
            <p className="text-[11px] text-text-muted mt-1">
              How many individual meals can this provide?
            </p>
          </div>
        </div>

        {/* Dynamic Impact Calculator Note */}
        {servingsCount > 0 && (
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-dash-primary-soft border border-amber-500/20">
            <Sparkles size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-xs font-semibold text-text-primary">
              🌟 Direct Community Impact: This donation is projected to feed approximately <span className="text-dash-primary font-bold text-sm">~{servingsCount} people</span>!
            </p>
          </div>
        )}

        {/* 3. Storage Requirement */}
        <div>
          <label className={labelClass}>
            3. Storage & Temperature Requirement <span className="text-danger">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { value: 'room_temperature', label: 'Room Temperature', sub: 'Dry pantry / Ambient', icon: Sun },
              { value: 'refrigerated', label: 'Refrigerated (2°C - 5°C)', sub: 'Perishable / Chilled', icon: Snowflake },
              { value: 'frozen', label: 'Frozen (-18°C)', sub: 'Deep freeze / Ice', icon: Snowflake },
            ].map((option) => {
              const Icon = option.icon;
              const isSelected = storageRequirement === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChange('storageRequirement', option.value)}
                  className={`p-3.5 rounded-xl border text-left transition-all duration-200 flex items-center gap-3 ${
                    isSelected
                      ? 'border-dash-primary bg-dash-primary-soft text-dash-primary ring-1 ring-dash-primary'
                      : 'border-border bg-surface hover:border-dash-primary/40 text-text-secondary'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-dash-primary text-white' : 'bg-page text-text-muted'
                  }`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${isSelected ? 'text-dash-primary' : 'text-text-primary'}`}>
                      {option.label}
                    </p>
                    <p className="text-[10px] text-text-muted">{option.sub}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {errors.storageRequirement && (
            <p className={errorClass}>
              <AlertCircle size={14} />
              {errors.storageRequirement}
            </p>
          )}
        </div>

        {/* 4. Dietary Badges (Vegetarian & Halal) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Vegetarian */}
          <div className="p-4 rounded-2xl bg-surface border border-border/80">
            <label className={labelClass}>Dietary Category</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {[
                { value: 'vegetarian', label: 'Vegetarian', icon: Leaf, color: 'text-emerald-500' },
                { value: 'non_vegetarian', label: 'Non-Veg', icon: null, color: 'text-rose-500' },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = isVegetarian === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange('isVegetarian', opt.value)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      isSelected
                        ? 'border-dash-primary bg-dash-primary-soft text-dash-primary'
                        : 'border-border bg-page text-text-secondary hover:bg-surface-hover'
                    }`}
                  >
                    {Icon && <Icon size={14} className={opt.color} />}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Halal */}
          <div className="p-4 rounded-2xl bg-surface border border-border/80">
            <label className={labelClass}>Halal Certified / Prepared</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {[
                { value: 'yes', label: 'Halal Certified', icon: Moon },
                { value: 'no', label: 'Not Halal', icon: null },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = isHalal === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange('isHalal', opt.value)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      isSelected
                        ? 'border-dash-primary bg-dash-primary-soft text-dash-primary'
                        : 'border-border bg-page text-text-secondary hover:bg-surface-hover'
                    }`}
                  >
                    {Icon && <Icon size={14} className="text-amber-500" />}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 5. Expiry Date & Rapid Presets */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="expiryDate" className={labelClass}>
              5. Best Before / Expiry Time
            </label>
            <span className="text-xs text-text-muted">Crucial for food freshness & volunteer routing</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-start">
            <div className="relative flex-1 w-full">
              <input
                type="datetime-local"
                id="expiryDate"
                value={expiryDate || ''}
                onChange={(e) => onChange('expiryDate', e.target.value)}
                className={`${inputBase} ${inputOk}`}
              />
            </div>

            {/* Rapid Expiry Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleSetExpiryPreset(4)}
                className="px-3 py-2 text-xs font-medium rounded-xl border border-border bg-page text-text-secondary hover:text-dash-primary hover:border-dash-primary/40 transition-colors"
              >
                In 4 Hours
              </button>
              <button
                type="button"
                onClick={() => handleSetExpiryPreset(undefined, 21)}
                className="px-3 py-2 text-xs font-medium rounded-xl border border-border bg-page text-text-secondary hover:text-dash-primary hover:border-dash-primary/40 transition-colors"
              >
                Tonight (9 PM)
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  d.setHours(12, 0, 0, 0);
                  const year = d.getFullYear();
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const day = String(d.getDate()).padStart(2, '0');
                  onChange('expiryDate', `${year}-${month}-${day}T12:00`);
                }}
                className="px-3 py-2 text-xs font-medium rounded-xl border border-border bg-page text-text-secondary hover:text-dash-primary hover:border-dash-primary/40 transition-colors"
              >
                Tomorrow Noon
              </button>
            </div>
          </div>
        </div>

        {/* 6. Allergens */}
        <div>
          <label className={labelClass}>
            6. Allergen Information (Optional)
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleAllergenToggle('None')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                (!allergens || allergens.length === 0)
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-page border border-border text-text-secondary hover:border-emerald-500/50'
              }`}
            >
              ✓ Allergen-Free / None
            </button>
            {ALLERGEN_OPTIONS.map((allergen) => {
              const isSelected = (allergens || []).includes(allergen);
              return (
                <button
                  key={allergen}
                  type="button"
                  onClick={() => handleAllergenToggle(allergen)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-dash-primary text-white shadow-xs'
                      : 'bg-page border border-border text-text-secondary hover:border-dash-primary/40'
                  }`}
                >
                  {allergen}
                </button>
              );
            })}
          </div>
        </div>

        {/* 7. Ingredients */}
        <div>
          <label htmlFor="ingredients" className={labelClass}>
            Key Ingredients (Optional)
          </label>
          <textarea
            id="ingredients"
            value={ingredients || ''}
            onChange={(e) => onChange('ingredients', e.target.value)}
            placeholder="e.g., Basmati rice, chicken, ghee, onions, spices, saffron..."
            rows={2}
            maxLength={500}
            className={`${inputBase} resize-none ${inputOk}`}
          />
        </div>
      </div>
    );
  }

  // ==========================================
  // CLOTHES DONATION SECTION
  // ==========================================
  if (category === 'clothes') {
    const CLOTHING_CATEGORIES = [
      { value: 'shirt', label: 'Shirt / Tops' },
      { value: 't_shirt', label: 'T-Shirt / Polos' },
      { value: 'pants', label: 'Pants / Trousers' },
      { value: 'jeans', label: 'Jeans' },
      { value: 'jacket', label: 'Winter Jacket / Coat' },
      { value: 'sweater', label: 'Sweater / Cardigan' },
      { value: 'saree', label: 'Saree' },
      { value: 'salwar_kameez', label: 'Salwar Kameez' },
      { value: 'hijab', label: 'Hijab / Scarf' },
      { value: 'shoes', label: 'Footwear / Shoes' },
      { value: 'blanket', label: 'Blanket / Quilt' },
      { value: 'others', label: 'Other Clothing' },
    ];

    const CONDITIONS = [
      { value: 'new', label: 'Brand New', sub: 'Unworn, tags on or spotless', stars: 4 },
      { value: 'like_new', label: 'Like New', sub: 'Worn 1-2 times, excellent', stars: 3 },
      { value: 'good', label: 'Good Condition', sub: 'Clean, intact, gently used', stars: 2 },
      { value: 'fair', label: 'Fair / Daily Wear', sub: 'Minor wear, clean & wearable', stars: 1 },
    ];

    return (
      <div className="space-y-7">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Shirt size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Clothing Specifications</h3>
              <p className="text-xs text-text-muted">Help volunteers distribute wearable garments to the right beneficiaries</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-dash-primary-soft text-dash-primary">
            Step 2 of 6
          </span>
        </div>

        {/* 1. Category Dropdown */}
        <div>
          <label htmlFor="clothingCategory" className={labelClass}>
            1. Garment Category <span className="text-danger">*</span>
          </label>
          <div className="relative">
            <select
              id="clothingCategory"
              value={clothingCategory || ''}
              onChange={(e) => onChange('clothingCategory', e.target.value)}
              className={`${inputBase} appearance-none cursor-pointer pr-10 font-medium ${errors.clothingCategory ? inputErr : inputOk}`}
              aria-invalid={errors.clothingCategory ? 'true' : 'false'}
            >
              <option value="">Select garment type...</option>
              {CLOTHING_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <Shirt size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>
          {errors.clothingCategory && (
            <p className={errorClass}>
              <AlertCircle size={14} />
              {errors.clothingCategory}
            </p>
          )}
        </div>

        {/* 2. Target Demographics (Gender & Age) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 rounded-2xl bg-surface border border-border/70">
          {/* Gender */}
          <div>
            <label className={labelClass}>
              2. Target Gender <span className="text-danger">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'unisex', label: 'Unisex' },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onChange('gender', item.value)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                    gender === item.value
                      ? 'border-dash-primary bg-dash-primary-soft text-dash-primary shadow-xs'
                      : 'border-border bg-page text-text-secondary hover:bg-surface-hover'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {errors.gender && (
              <p className={errorClass}>
                <AlertCircle size={14} />
                {errors.gender}
              </p>
            )}
          </div>

          {/* Age Group */}
          <div>
            <label className={labelClass}>
              3. Age Group <span className="text-danger">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {[
                { value: 'baby', label: 'Baby (0-2y)' },
                { value: 'child', label: 'Child (3-12y)' },
                { value: 'teen', label: 'Teen (13-19y)' },
                { value: 'adult', label: 'Adult' },
                { value: 'senior', label: 'Senior' },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onChange('ageGroup', item.value)}
                  className={`py-2 px-1 rounded-xl border text-[11px] font-bold text-center transition-all ${
                    ageGroup === item.value
                      ? 'border-dash-primary bg-dash-primary-soft text-dash-primary shadow-xs'
                      : 'border-border bg-page text-text-secondary hover:bg-surface-hover'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {errors.ageGroup && (
              <p className={errorClass}>
                <AlertCircle size={14} />
                {errors.ageGroup}
              </p>
            )}
          </div>
        </div>

        {/* 3. Item Condition Tier Cards */}
        <div>
          <label className={labelClass}>
            4. Item Condition <span className="text-danger">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {CONDITIONS.map((cond) => {
              const isSelected = itemCondition === cond.value;
              return (
                <button
                  key={cond.value}
                  type="button"
                  onClick={() => onChange('itemCondition', cond.value)}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'border-dash-primary bg-dash-primary-soft ring-2 ring-dash-primary/20 shadow-sm'
                      : 'border-border bg-surface hover:border-dash-primary/40 hover:bg-surface-hover/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-bold ${isSelected ? 'text-dash-primary' : 'text-text-primary'}`}>
                        {cond.label}
                      </span>
                      <div className="flex items-center text-amber-500">
                        {Array.from({ length: cond.stars }).map((_, i) => (
                          <Star key={i} size={11} className="fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-text-muted leading-relaxed">{cond.sub}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {errors.itemCondition && (
            <p className={errorClass}>
              <AlertCircle size={14} />
              {errors.itemCondition}
            </p>
          )}
        </div>

        {/* 4. Sizes, Brand, Color, Season */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Size */}
          <div>
            <label htmlFor="size" className={labelClass}>Size</label>
            <select
              id="size"
              value={size || ''}
              onChange={(e) => onChange('size', e.target.value)}
              className={`${inputBase} appearance-none cursor-pointer ${inputOk}`}
            >
              <option value="">Any / Standard</option>
              <option value="xs">XS</option>
              <option value="s">S</option>
              <option value="m">M</option>
              <option value="l">L</option>
              <option value="xl">XL</option>
              <option value="xxl">XXL</option>
              <option value="free_size">Free Size</option>
            </select>
          </div>

          {/* Season */}
          <div>
            <label htmlFor="season" className={labelClass}>Season</label>
            <select
              id="season"
              value={season || ''}
              onChange={(e) => onChange('season', e.target.value)}
              className={`${inputBase} appearance-none cursor-pointer ${inputOk}`}
            >
              <option value="all_season">All Season</option>
              <option value="winter">Winter / Warm</option>
              <option value="summer">Summer / Light</option>
              <option value="rainy">Monsoon / Rainy</option>
            </select>
          </div>

          {/* Brand */}
          <div>
            <label htmlFor="brand" className={labelClass}>Brand (Optional)</label>
            <input
              type="text"
              id="brand"
              value={brand || ''}
              onChange={(e) => onChange('brand', e.target.value)}
              placeholder="e.g., Aarong, Zara, Local"
              className={`${inputBase} ${inputOk}`}
            />
          </div>

          {/* Color */}
          <div>
            <label htmlFor="color" className={labelClass}>Color (Optional)</label>
            <input
              type="text"
              id="color"
              value={color || ''}
              onChange={(e) => onChange('color', e.target.value)}
              placeholder="e.g., Navy Blue, Maroon"
              className={`${inputBase} ${inputOk}`}
            />
          </div>
        </div>

        {/* Dynamic Clothing Impact Banner */}
        {parseInt(formData.quantity, 10) > 0 && (
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-dash-primary-soft to-purple-500/10 border border-indigo-500/20">
            <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <p className="text-xs font-semibold text-text-primary">
              ✨ Direct Dignity Impact: This donation is projected to clothe and bring warmth to approximately <span className="text-dash-primary font-bold text-sm">~{formData.quantity} individuals/families</span>!
            </p>
          </div>
        )}

        {/* Clothing Dignity & Cleanliness Check */}
        <div className="p-4 rounded-2xl bg-surface border border-border/80 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
            <Check size={16} className="stroke-[3]" />
          </div>
          <div className="space-y-1 text-xs">
            <p className="font-bold text-text-primary">Cleanliness & Dignity Check</p>
            <p className="text-text-muted leading-relaxed">
              Please ensure all items are washed, intact (no missing buttons or large tears), and packed in clean bags or boxes for respectful handover.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Fallback if no category selected
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 text-center">
      <p className="text-amber-700 dark:text-amber-400 font-semibold text-sm">
        Please return to Step 1 and choose either Food or Clothes to continue.
      </p>
    </div>
  );
}

