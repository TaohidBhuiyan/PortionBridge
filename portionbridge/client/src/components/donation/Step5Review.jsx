import { 
  Utensils, 
  Shirt, 
  Package, 
  MapPin, 
  Edit2, 
  CheckCircle2, 
  Users, 
  Sparkles, 
  Leaf, 
  ShieldCheck
} from 'lucide-react';

function Row({ label, children }) {
  return (
    <div className="flex justify-between items-start gap-4 py-1 border-b border-border/40 last:border-0">
      <span className="text-xs font-medium text-text-secondary shrink-0">{label}</span>
      <span className="text-xs font-semibold text-text-primary text-right">{children}</span>
    </div>
  );
}

function SectionCard({ icon: Icon, title: sectionTitle, stepIndex, onEditStep, children }) {
  return (
    <div className="bg-surface rounded-2xl p-5 border border-border/80 shadow-xs">
      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-border">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-dash-primary-soft text-dash-primary flex items-center justify-center">
            <Icon size={15} />
          </div>
          {sectionTitle}
        </h3>
        <button
          type="button"
          onClick={() => onEditStep(stepIndex)}
          className="inline-flex items-center gap-1 text-xs font-bold text-dash-primary hover:text-dash-primary-hover px-2.5 py-1 rounded-lg hover:bg-dash-primary-soft transition-colors focus:outline-none"
        >
          <Edit2 size={12} />
          Edit
        </button>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

/**
 * Step 5 - Review & Submit
 * Shows comprehensive, elegant executive summary receipt of all form data
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
    savedAddressLabel,
    pickupAddress,
    contactPhone,
    pickupDate,
    pickupTimeSlot,
    specialInstructions,
    images = [],
    coverImage,
    assignmentMode,
    selectedVolunteer
  } = formData;

  const formatStorageRequirement = (value) => {
    const map = {
      'room_temperature': 'Room Temperature',
      'refrigerated': 'Refrigerated (2°C - 5°C)',
      'frozen': 'Frozen (-18°C)'
    };
    return map[value] || value;
  };

  const formatItemCondition = (value) => {
    const map = {
      'new': 'Brand New (Unworn)',
      'like_new': 'Like New (Barely used)',
      'good': 'Good Condition (Clean & intact)',
      'fair': 'Fair (Daily wear)'
    };
    return map[value] || value;
  };

  const formatTimeSlot = (value) => {
    const map = {
      'morning': 'Morning (6:00 AM – 12:00 PM)',
      'afternoon': 'Afternoon (12:00 PM – 6:00 PM)',
      'evening': 'Evening (6:00 PM – 10:00 PM)'
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
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const servingsCount = parseInt(numberOfServings, 10) || parseInt(quantity, 10) || 0;

  return (
    <div className="space-y-6">
      {/* Executive Overview Hero Card */}
      <div className={`p-6 rounded-3xl border shadow-sm relative overflow-hidden ${
        category === 'clothes'
          ? 'bg-gradient-to-br from-indigo-500/10 via-surface to-purple-500/10 border-indigo-500/25'
          : 'bg-gradient-to-br from-dash-primary/10 via-surface to-emerald-500/10 border-dash-primary/20'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full inline-flex items-center gap-1 ${
                category === 'clothes'
                  ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              }`}>
                <CheckCircle2 size={12} />
                Ready for Final Submission
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                {category === 'clothes' ? 'Clothing Donation Summary' : 'Food Donation Receipt'}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-text-primary">
              {title || 'Untitled Donation'}
            </h2>
            <p className="text-xs text-text-secondary line-clamp-2">
              {description || 'No description provided.'}
            </p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-border/60">
            <span className="text-xs text-text-muted">
              {category === 'clothes' ? 'Total Garments / Items' : 'Total Portions / Units'}
            </span>
            <span className="text-2xl font-black text-dash-primary">
              {quantity} <span className="text-sm font-bold uppercase">{quantityUnit}</span>
            </span>
          </div>
        </div>

        {/* Environmental & Community Impact Callout */}
        <div className="mt-4 pt-4 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2 text-text-secondary">
            <Sparkles size={16} className={category === 'clothes' ? 'text-indigo-500 shrink-0' : 'text-amber-500 shrink-0'} />
            <span>
              {category === 'clothes'
                ? `Direct Dignity Impact: Will provide clean, wearable outfits for ~${quantity} individuals in need`
                : `Hunger Relief Impact: Projected to satisfy approximately ~${servingsCount} hungry beneficiaries`}
            </span>
          </div>
          <div className={`flex items-center gap-2 font-medium ${
            category === 'clothes'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {category === 'clothes' ? (
              <>
                <Shirt size={16} className="shrink-0" />
                <span>Sanitized & dignity verified • Verified volunteer collection</span>
              </>
            ) : (
              <>
                <Leaf size={16} className="shrink-0" />
                <span>Zero-waste verified initiative • Instant volunteer alert</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Structured Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Basic Information */}
        <SectionCard icon={Package} title="Basic Information" stepIndex={0} onEditStep={onEditStep}>
          <Row label="Donation Title">{title || '-'}</Row>
          <Row label="Category">
            <span className="capitalize font-bold">{category || '-'}</span>
          </Row>
          <Row label="Quantity">
            {quantity} {quantityUnit || '-'}
          </Row>
          <Row label="Description">{description || '-'}</Row>
        </SectionCard>

        {/* Category Specifics */}
        <SectionCard 
          icon={category === 'food' ? Utensils : Shirt} 
          title={category === 'food' ? 'Food & Dietary Specs' : 'Clothing Specifications'} 
          stepIndex={1} 
          onEditStep={onEditStep}
        >
          {category === 'food' ? (
            <>
              <Row label="Food Type"><span className="capitalize">{foodType || '-'}</span></Row>
              <Row label="Food Name">{foodName || '-'}</Row>
              {numberOfServings && <Row label="Estimated Servings">{numberOfServings} people</Row>}
              <Row label="Storage Condition">{formatStorageRequirement(storageRequirement) || '-'}</Row>
              {isVegetarian && (
                <Row label="Vegetarian">
                  <span className={isVegetarian === 'vegetarian' ? 'text-emerald-600 font-bold' : ''}>
                    {isVegetarian === 'vegetarian' ? 'Yes (Vegetarian)' : 'Non-Vegetarian'}
                  </span>
                </Row>
              )}
              {isHalal && <Row label="Halal Status">{isHalal === 'yes' ? 'Halal Certified' : 'Not Halal'}</Row>}
              {expiryDate && <Row label="Best Before">{formatDateTime(expiryDate)}</Row>}
              {allergens && allergens.length > 0 && <Row label="Allergens">{allergens.join(', ')}</Row>}
              {ingredients && <Row label="Key Ingredients">{ingredients}</Row>}
            </>
          ) : (
            <>
              <Row label="Clothing Type"><span className="capitalize">{clothingCategory?.replace('_', ' ') || '-'}</span></Row>
              <Row label="Gender"><span className="capitalize">{gender || '-'}</span></Row>
              <Row label="Age Group"><span className="capitalize">{ageGroup || '-'}</span></Row>
              <Row label="Item Condition">{formatItemCondition(itemCondition) || '-'}</Row>
              {size && <Row label="Size"><span className="uppercase">{size}</span></Row>}
              {brand && <Row label="Brand">{brand}</Row>}
              {color && <Row label="Color">{color}</Row>}
              {season && <Row label="Season"><span className="capitalize">{season}</span></Row>}
            </>
          )}
        </SectionCard>

        {/* Pickup Details */}
        <SectionCard icon={MapPin} title="Pickup & Timing" stepIndex={2} onEditStep={onEditStep}>
          <Row label="Address">
            {savedAddressId ? (savedAddressLabel || 'Saved Address') : (pickupAddress?.fullAddress || '-')}
          </Row>
          {pickupAddress?.landmark && <Row label="Landmark">{pickupAddress.landmark}</Row>}
          <Row label="Contact Phone">{contactPhone || '-'}</Row>
          <Row label="Pickup Date">{formatDate(pickupDate)}</Row>
          <Row label="Time Slot">{formatTimeSlot(pickupTimeSlot)}</Row>
          {specialInstructions && <Row label="Special Notes">{specialInstructions}</Row>}
        </SectionCard>

        {/* Volunteer Assignment Mode */}
        <SectionCard icon={Users} title="Volunteer Assignment" stepIndex={4} onEditStep={onEditStep}>
          <Row label="Assignment Strategy">
            <span className="font-bold text-dash-primary">
              {assignmentMode === 'auto' ? 'Smart Auto-Assignment (Recommended)' : 'Manual Volunteer Selection'}
            </span>
          </Row>
          {selectedVolunteer ? (
            <Row label="Selected Volunteer">
              <span className="font-bold text-text-primary">
                {selectedVolunteer.name} {selectedVolunteer.team_name ? `(${selectedVolunteer.team_name})` : ''}
              </span>
            </Row>
          ) : (
            <Row label="Volunteer Matching">
              <span className="text-text-muted">Nearest available verified volunteer will be dispatched</span>
            </Row>
          )}
        </SectionCard>
      </div>

      {/* Verification Photos Preview */}
      <div className="p-5 rounded-2xl bg-surface border border-border/80 shadow-xs">
        <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-border">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-dash-primary-soft text-dash-primary flex items-center justify-center">
              <Package size={15} />
            </div>
            Attached Photos ({images.length})
          </h3>
          <button
            type="button"
            onClick={() => onEditStep(3)}
            className="inline-flex items-center gap-1 text-xs font-bold text-dash-primary hover:text-dash-primary-hover px-2.5 py-1 rounded-lg hover:bg-dash-primary-soft transition-colors"
          >
            <Edit2 size={12} />
            Edit Photos
          </button>
        </div>

        {images.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {images.map((img) => {
              const isCover = coverImage === img.id;
              return (
                <div
                  key={img.id}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 shadow-xs ${
                    isCover ? 'border-dash-primary ring-2 ring-dash-primary/20' : 'border-border'
                  }`}
                >
                  <img src={img.preview} alt="Attached preview" className="w-full h-full object-cover" />
                  {isCover && (
                    <span className="absolute top-1 left-1 bg-dash-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      Cover
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-text-muted text-center py-3">
            No photos uploaded. Photos can still be added in Step 4 if you wish.
          </p>
        )}
      </div>

      {/* Donor Safety & Quality Pledge */}
      <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
        category === 'clothes'
          ? 'bg-indigo-500/10 border-indigo-500/30'
          : 'bg-emerald-500/10 border-emerald-500/30'
      }`}>
        <ShieldCheck size={20} className={category === 'clothes' ? 'text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5' : 'text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5'} />
        <div className="text-xs text-text-secondary leading-relaxed">
          {category === 'clothes' ? (
            <>
              <span className="font-bold text-text-primary">PortionBridge Dignity & Quality Pledge: </span>
              By submitting, you affirm that the clothing items are washed, clean, intact, and ready to wear with dignity. Volunteers handle all items with maximum respect and care.
            </>
          ) : (
            <>
              <span className="font-bold text-text-primary">PortionBridge Food Safety Pledge: </span>
              By submitting, you affirm that the food items were prepared and packaged under strict hygiene conditions, safe for immediate human consumption, and properly stored until collection.
            </>
          )}
        </div>
      </div>
    </div>
  );
}