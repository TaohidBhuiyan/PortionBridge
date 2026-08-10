import { Utensils, Shirt, Package, MapPin, Calendar, Clock, Edit2, CheckCircle } from 'lucide-react';

function Row({ label, children }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-xs text-text-secondary shrink-0">{label}</span>
      <span className="text-sm font-medium text-text-primary text-right">{children}</span>
    </div>
  );
}

function SectionCard({ icon: Icon, title: sectionTitle, stepIndex, onEditStep, children }) {
  return (
    <div className="bg-page rounded-lg p-4 border border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Icon size={16} className="text-dash-primary" />
          {sectionTitle}
        </h3>
        <button
          type="button"
          onClick={() => onEditStep(stepIndex)}
          className="text-dash-primary hover:text-dash-primary-hover flex items-center gap-1 text-xs font-medium transition-colors focus:outline-none focus-visible:underline"
        >
          <Edit2 size={13} />
          Edit
        </button>
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

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
    savedAddressLabel,
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
    <div className="space-y-4">
      {/* Basic Information */}
      <SectionCard icon={Package} title="Basic Information" stepIndex={0} onEditStep={onEditStep}>
        <Row label="Title">{title || '-'}</Row>
        <Row label="Category">
          <span className="inline-flex items-center gap-1.5">
            {category === 'food' ? <Utensils size={14} className="text-dash-primary" /> : category === 'clothes' ? <Shirt size={14} className="text-dash-primary" /> : null}
            {category === 'food' ? 'Food' : category === 'clothes' ? 'Clothes' : '-'}
          </span>
        </Row>
        <Row label="Description">{description || '-'}</Row>
        <Row label="Quantity">{quantity} {quantityUnit || '-'}</Row>
      </SectionCard>

      {/* Donation Details */}
      <SectionCard icon={category === 'food' ? Utensils : Shirt} title={category === 'food' ? 'Food Details' : 'Clothes Details'} stepIndex={1} onEditStep={onEditStep}>
        {category === 'food' ? (
          <>
            <Row label="Food Type"><span className="capitalize">{foodType || '-'}</span></Row>
            <Row label="Food Name">{foodName || '-'}</Row>
            {numberOfServings && <Row label="Servings">{numberOfServings}</Row>}
            {ingredients && <Row label="Ingredients">{ingredients}</Row>}
            {allergens && allergens.length > 0 && <Row label="Allergens">{allergens.join(', ')}</Row>}
            <Row label="Storage">{formatStorageRequirement(storageRequirement) || '-'}</Row>
            {isVegetarian && <Row label="Type">{isVegetarian === 'vegetarian' ? 'Vegetarian' : 'Non-Vegetarian'}</Row>}
            {isHalal && <Row label="Halal"><span className="capitalize">{isHalal}</span></Row>}
            {expiryDate && <Row label="Expiry Date">{formatDateTime(expiryDate)}</Row>}
          </>
        ) : category === 'clothes' ? (
          <>
            <Row label="Category"><span className="capitalize">{clothingCategory?.replace('_', ' ') || '-'}</span></Row>
            <Row label="Gender"><span className="capitalize">{gender || '-'}</span></Row>
            <Row label="Age Group"><span className="capitalize">{ageGroup || '-'}</span></Row>
            <Row label="Condition">{formatItemCondition(itemCondition) || '-'}</Row>
            {brand && <Row label="Brand">{brand}</Row>}
            {size && <Row label="Size"><span className="uppercase">{size}</span></Row>}
            {color && <Row label="Color">{color}</Row>}
            {season && <Row label="Season"><span className="capitalize">{season}</span></Row>}
          </>
        ) : (
          <p className="text-sm text-text-secondary text-center py-3">No category selected</p>
        )}
      </SectionCard>

      {/* Pickup Information */}
      <SectionCard icon={MapPin} title="Pickup Information" stepIndex={2} onEditStep={onEditStep}>
        <Row label="Address">
          {savedAddressId ? (savedAddressLabel || 'Saved address') : (pickupAddress?.fullAddress || '-')}
        </Row>
        <Row label="Contact Phone">{contactPhone || '-'}</Row>
        <Row label="Pickup Date">
          <span className="inline-flex items-center gap-1"><Calendar size={13} />{formatDate(pickupDate)}</span>
        </Row>
        <Row label="Time Slot">
          <span className="inline-flex items-center gap-1"><Clock size={13} />{formatTimeSlot(pickupTimeSlot)}</span>
        </Row>
        {specialInstructions && <Row label="Special Instructions">{specialInstructions}</Row>}
      </SectionCard>

      {/* Images */}
      <div className="bg-page rounded-lg p-4 border border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Package size={16} className="text-dash-primary" />
            Images ({images?.length || 0})
          </h3>
          <button
            type="button"
            onClick={() => onEditStep(3)}
            className="text-dash-primary hover:text-dash-primary-hover flex items-center gap-1 text-xs font-medium transition-colors focus:outline-none focus-visible:underline"
          >
            <Edit2 size={13} />
            Edit
          </button>
        </div>

        {images && images.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {images.map((image, index) => (
              <div
                key={image.id}
                className={`relative aspect-square rounded-lg overflow-hidden border ${
                  coverImage === image.id ? 'border-dash-primary' : 'border-border'
                }`}
              >
                <img
                  src={image.preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {coverImage === image.id && (
                  <div className="absolute top-1 left-1 bg-dash-primary text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <CheckCircle size={10} />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-secondary text-center py-4">No images uploaded</p>
        )}
      </div>
    </div>
  );
}