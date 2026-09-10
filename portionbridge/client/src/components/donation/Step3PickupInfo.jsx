import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  Calendar, 
  Navigation, 
  AlertCircle, 
  MapPin, 
  Check, 
  Home, 
  Building, 
  Loader2,
  CheckCircle2,
  Sunrise,
  Sun,
  Moon
} from 'lucide-react';
import { donationApi } from '../../services/donationApi';

const inputBase = 'w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-dash-primary/30 text-text-primary placeholder:text-text-muted text-sm shadow-xs';
const inputOk = 'border-border bg-input hover:border-border-strong focus:border-dash-primary';
const inputErr = 'border-danger bg-danger-soft/40 focus:border-danger';
const labelClass = 'block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2';
const errorClass = 'mt-1.5 text-xs text-danger flex items-center gap-1.5 font-medium';

function addressLabel(addr) {
  const full = addr.fullAddress || addr.full_address || '';
  const label = addr.customLabel || addr.custom_label || addr.label || 'Address';
  const shortLabel = label.charAt(0).toUpperCase() + label.slice(1);
  return full ? `${shortLabel} — ${full}` : shortLabel;
}

const INSTRUCTION_TAGS_MAP = {
  food: [
    'Perishable - please collect promptly',
    'Keep food containers upright and level',
    'Call before arrival',
    'Leave at building reception / security guard',
    'Elevator available on premises'
  ],
  clothes: [
    'Packed in bags / boxes ready for pickup',
    'Can leave at building security / reception',
    'Heavy bundle - cart recommended',
    'Call before arrival',
    'Ring apartment doorbell'
  ]
};

/**
 * Step 3 - Pickup Information
 * Fields: Address (saved or one-time), Phone, Pickup Date, Time Slot, Instructions
 * Luxury UI with tabbed address switcher, interactive saved address cards,
 * GPS locator with animated radar, and visual daylight/evening time cards.
 */
export function Step3PickupInfo({ formData, errors, onChange, onValidationChange }) {
  const { savedAddressId, pickupAddress, contactPhone, pickupDate, pickupTimeSlot, specialInstructions } = formData;
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addressTab, setAddressTab] = useState(() => (savedAddressId ? 'saved' : 'new'));
  const [isLocating, setIsLocating] = useState(false);
  const [locationAcquired, setLocationAcquired] = useState(Boolean(pickupAddress?.latitude && pickupAddress?.longitude));

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const result = await donationApi.getSavedAddresses();
        if (result.success) {
          const list = result.data.addresses || [];
          setSavedAddresses(list);
          if (list.length > 0 && !savedAddressId && !pickupAddress?.fullAddress) {
            setAddressTab('saved');
          }
        }
      } finally {
        setLoadingAddresses(false);
      }
    };
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Validation
  const pickupFullAddress = pickupAddress?.fullAddress;
  React.useEffect(() => {
    const isValid = 
      contactPhone?.trim().length >= 7 &&
      contactPhone?.trim().length <= 20 &&
      pickupDate &&
      pickupTimeSlot &&
      Boolean(savedAddressId || (pickupFullAddress?.trim().length > 0));

    onValidationChange?.(isValid);
  }, [savedAddressId, pickupFullAddress, contactPhone, pickupDate, pickupTimeSlot, onValidationChange]);

  const handleAddressChange = (field, value) => {
    onChange('pickupAddress', {
      ...pickupAddress,
      [field]: value
    });
  };

  const handleSavedAddressChange = (id) => {
    onChange('savedAddressId', id || null);
    if (id) {
      const selected = savedAddresses.find((a) => String(a.id) === String(id));
      if (selected) {
        onChange('savedAddressLabel', addressLabel(selected));
        // Keep coordinates in sync for Step 6 volunteer matching
        const lat = selected.latitude || selected.lat || 23.8103;
        const lng = selected.longitude || selected.lng || 90.4125;
        onChange('pickupAddress', {
          ...pickupAddress,
          latitude: lat,
          longitude: lng,
          fullAddress: selected.fullAddress || selected.full_address || '',
          area: selected.area || '',
          district: selected.district || 'Dhaka',
        });
        setLocationAcquired(true);
      }
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setIsLocating(false);
        setLocationAcquired(true);
        onChange('pickupAddress', {
          ...pickupAddress,
          latitude: coords.latitude,
          longitude: coords.longitude,
          landmark: pickupAddress?.landmark || 'GPS Location Detected'
        });
      },
      () => {
        setIsLocating(false);
        alert('Could not retrieve your location. Please enter your address manually.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleDatePreset = (daysOffset) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    const dateStr = d.toISOString().split('T')[0];
    onChange('pickupDate', dateStr);
  };

  const handleAddInstructionTag = (tag) => {
    const current = (specialInstructions || '').trim();
    if (!current) {
      onChange('specialInstructions', tag);
    } else if (!current.includes(tag)) {
      onChange('specialInstructions', `${current}. ${tag}`);
    }
  };

  const isClothes = formData.category === 'clothes';
  const activeInstructionTags = (formData.category && INSTRUCTION_TAGS_MAP[formData.category]) || INSTRUCTION_TAGS_MAP.food;

  const TIME_SLOTS = [
    {
      value: 'morning',
      title: 'Morning Slot',
      time: '06:00 AM – 12:00 PM',
      icon: Sunrise,
      badge: isClothes ? 'Convenient Morning Pickup' : 'Best for Breakfast / Early Logistics',
      color: 'text-amber-500 bg-amber-500/10'
    },
    {
      value: 'afternoon',
      title: 'Afternoon Slot',
      time: '12:00 PM – 06:00 PM',
      icon: Sun,
      badge: isClothes ? 'Standard Daytime Pickup' : 'Ideal for Lunch & Courier Routing',
      color: 'text-orange-500 bg-orange-500/10'
    },
    {
      value: 'evening',
      title: 'Evening Slot',
      time: '06:00 PM – 10:00 PM',
      icon: Moon,
      badge: isClothes ? 'After-Work Collection' : 'Dinner & Evening Banquet Rescue',
      color: 'text-indigo-500 bg-indigo-500/10'
    },
  ];

  return (
    <div className="space-y-7">
      {/* Ribbon Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-dash-primary-soft text-dash-primary flex items-center justify-center">
            <MapPin size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">Pickup & Handover Logistics</h3>
            <p className="text-xs text-text-muted">
              {isClothes
                ? 'Choose a convenient schedule for volunteers to collect your packed clothing'
                : 'Coordinate timely handover to ensure freshness and rapid volunteer delivery'}
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-dash-primary-soft text-dash-primary">
          Step 3 of 6
        </span>
      </div>

      {/* 1. Address Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className={labelClass}>
            1. Pickup Location <span className="text-danger">*</span>
          </label>

          {/* Tab Switcher if user has saved addresses */}
          {!loadingAddresses && savedAddresses.length > 0 && (
            <div className="flex items-center p-1 rounded-xl bg-page border border-border text-xs">
              <button
                type="button"
                onClick={() => {
                  setAddressTab('saved');
                  if (!savedAddressId && savedAddresses[0]) {
                    handleSavedAddressChange(savedAddresses[0].id);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  addressTab === 'saved'
                    ? 'bg-surface text-dash-primary shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Saved Addresses ({savedAddresses.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddressTab('new');
                  onChange('savedAddressId', null);
                  onChange('savedAddressLabel', null);
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  addressTab === 'new'
                    ? 'bg-surface text-dash-primary shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                + New Address
              </button>
            </div>
          )}
        </div>

        {/* Saved Addresses Cards View */}
        {addressTab === 'saved' && savedAddresses.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {savedAddresses.map((addr) => {
              const isSelected = String(savedAddressId) === String(addr.id);
              const label = (addr.customLabel || addr.label || 'Home').toUpperCase();
              const isHome = label.includes('HOME');
              const AddrIcon = isHome ? Home : Building;

              return (
                <button
                  key={addr.id}
                  type="button"
                  onClick={() => handleSavedAddressChange(addr.id)}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 relative focus:outline-none focus:ring-2 focus:ring-dash-primary ${
                    isSelected
                      ? 'border-dash-primary bg-dash-primary-soft ring-2 ring-dash-primary/20 shadow-sm'
                      : 'border-border bg-surface hover:border-dash-primary/40 hover:bg-surface-hover/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-dash-primary text-white' : 'bg-page text-text-muted'
                    }`}>
                      <AddrIcon size={16} />
                    </div>
                    <div className="min-w-0 flex-1 pr-5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text-primary">{label}</span>
                        {addr.isDefault && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-emerald-500/10 text-emerald-600">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                        {addr.fullAddress || addr.full_address}
                      </p>
                      {addr.contactPhone && (
                        <p className="text-[11px] text-text-muted mt-1 flex items-center gap-1">
                          <Phone size={10} /> {addr.contactPhone}
                        </p>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="absolute top-3.5 right-3.5 w-4 h-4 bg-dash-primary text-white rounded-full flex items-center justify-center">
                      <Check size={10} className="stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* One-Time / New Address Form */}
        {(addressTab === 'new' || savedAddresses.length === 0) && (
          <div className="p-5 rounded-2xl bg-surface border border-border/80 space-y-4 shadow-xs">
            {/* GPS Detection Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-page border border-border/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-dash-primary-soft text-dash-primary flex items-center justify-center shrink-0">
                  <Navigation size={16} className={isLocating ? 'animate-pulse' : ''} />
                </div>
                <div>
                  <p className="text-xs font-bold text-text-primary">GPS Location Matching</p>
                  <p className="text-[11px] text-text-muted">Enables instant volunteer radius matching</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-dash-primary hover:bg-dash-primary-hover text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
              >
                {isLocating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Detecting GPS...
                  </>
                ) : locationAcquired ? (
                  <>
                    <CheckCircle2 size={14} />
                    GPS Coordinates Saved
                  </>
                ) : (
                  <>
                    <Navigation size={14} />
                    Detect My Location
                  </>
                )}
              </button>
            </div>

            {/* Coordinates badge if available */}
            {pickupAddress?.latitude && pickupAddress?.longitude && (
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg w-fit">
                <Check size={12} />
                Lat: {Number(pickupAddress.latitude).toFixed(4)}, Lng: {Number(pickupAddress.longitude).toFixed(4)}
              </div>
            )}

            {/* Full Street Address */}
            <div>
              <label htmlFor="fullAddress" className={labelClass}>
                Full Street Address <span className="text-danger">*</span>
              </label>
              <textarea
                id="fullAddress"
                value={pickupAddress?.fullAddress || ''}
                onChange={(e) => handleAddressChange('fullAddress', e.target.value)}
                placeholder="House / Flat No., Road / Street, Sector / Block, Area name..."
                rows={2}
                maxLength={500}
                className={`${inputBase} resize-none ${errors.fullAddress ? inputErr : inputOk}`}
                aria-invalid={errors.fullAddress ? 'true' : 'false'}
              />
              {errors.fullAddress && (
                <p className={errorClass}>
                  <AlertCircle size={14} />
                  {errors.fullAddress}
                </p>
              )}
            </div>

            {/* Address Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label htmlFor="area" className={labelClass}>Area / Thana</label>
                <input
                  type="text"
                  id="area"
                  value={pickupAddress?.area || ''}
                  onChange={(e) => handleAddressChange('area', e.target.value)}
                  placeholder="e.g., Gulshan"
                  className={`${inputBase} ${inputOk}`}
                />
              </div>

              <div>
                <label htmlFor="district" className={labelClass}>District / City</label>
                <input
                  type="text"
                  id="district"
                  value={pickupAddress?.district || ''}
                  onChange={(e) => handleAddressChange('district', e.target.value)}
                  placeholder="e.g., Dhaka"
                  className={`${inputBase} ${inputOk}`}
                />
              </div>

              <div>
                <label htmlFor="division" className={labelClass}>Division</label>
                <input
                  type="text"
                  id="division"
                  value={pickupAddress?.division || ''}
                  onChange={(e) => handleAddressChange('division', e.target.value)}
                  placeholder="e.g., Dhaka"
                  className={`${inputBase} ${inputOk}`}
                />
              </div>

              <div>
                <label htmlFor="postalCode" className={labelClass}>Postal Code</label>
                <input
                  type="text"
                  id="postalCode"
                  value={pickupAddress?.postalCode || ''}
                  onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                  placeholder="e.g., 1212"
                  className={`${inputBase} ${inputOk}`}
                />
              </div>
            </div>

            {/* Landmark */}
            <div>
              <label htmlFor="landmark" className={labelClass}>Nearby Landmark (Optional)</label>
              <input
                type="text"
                id="landmark"
                value={pickupAddress?.landmark || ''}
                onChange={(e) => handleAddressChange('landmark', e.target.value)}
                placeholder="e.g., Near Police Plaza, Opposite to Green School"
                className={`${inputBase} ${inputOk}`}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Contact Phone */}
      <div>
        <label htmlFor="contactPhone" className={labelClass}>
          2. Contact Phone Number <span className="text-danger">*</span>
        </label>
        <div className="relative">
          <input
            type="tel"
            id="contactPhone"
            value={contactPhone || ''}
            onChange={(e) => onChange('contactPhone', e.target.value)}
            placeholder="e.g., +880 1712 345678"
            maxLength={20}
            className={`${inputBase} pl-10 ${errors.contactPhone ? inputErr : inputOk}`}
            aria-invalid={errors.contactPhone ? 'true' : 'false'}
            aria-describedby={errors.contactPhone ? 'contactPhone-error' : undefined}
          />
          <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        </div>
        <p className="text-[11px] text-text-muted mt-1">
          Volunteers will call this number for pickup coordination and arrival confirmation.
        </p>
        {errors.contactPhone && (
          <p id="contactPhone-error" className={errorClass}>
            <AlertCircle size={14} />
            {errors.contactPhone}
          </p>
        )}
      </div>

      {/* 3. Pickup Date & Time Slot */}
      <div className="space-y-4 p-5 rounded-2xl bg-surface border border-border/80 shadow-xs">
        {/* Date Row */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="pickupDate" className={labelClass}>
              3. Preferred Pickup Date <span className="text-danger">*</span>
            </label>
            
            {/* Quick Date Presets */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleDatePreset(0)}
                className="px-2.5 py-1 text-xs rounded-lg border border-border bg-page text-text-secondary hover:text-dash-primary hover:border-dash-primary/40 transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleDatePreset(1)}
                className="px-2.5 py-1 text-xs rounded-lg border border-border bg-page text-text-secondary hover:text-dash-primary hover:border-dash-primary/40 transition-colors"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => handleDatePreset(2)}
                className="px-2.5 py-1 text-xs rounded-lg border border-border bg-page text-text-secondary hover:text-dash-primary hover:border-dash-primary/40 transition-colors"
              >
                In 2 Days
              </button>
            </div>
          </div>

          <div className="relative">
            <input
              type="date"
              id="pickupDate"
              value={pickupDate || ''}
              onChange={(e) => onChange('pickupDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className={`${inputBase} pl-10 ${errors.pickupDate ? inputErr : inputOk}`}
              aria-invalid={errors.pickupDate ? 'true' : 'false'}
              aria-describedby={errors.pickupDate ? 'pickupDate-error' : undefined}
            />
            <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>
          {errors.pickupDate && (
            <p id="pickupDate-error" className={errorClass}>
              <AlertCircle size={14} />
              {errors.pickupDate}
            </p>
          )}
        </div>

        {/* Time Slot Visual Cards */}
        <div>
          <label className={labelClass}>
            4. Preferred Time Slot <span className="text-danger">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TIME_SLOTS.map((slot) => {
              const Icon = slot.icon;
              const isSelected = pickupTimeSlot === slot.value;
              return (
                <button
                  key={slot.value}
                  type="button"
                  onClick={() => onChange('pickupTimeSlot', slot.value)}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'border-dash-primary bg-dash-primary-soft ring-2 ring-dash-primary/20 shadow-sm'
                      : 'border-border bg-page hover:border-dash-primary/40 hover:bg-surface-hover/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${slot.color}`}>
                      <Icon size={16} />
                    </div>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-dash-primary" />
                    )}
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${isSelected ? 'text-dash-primary' : 'text-text-primary'}`}>
                      {slot.title}
                    </p>
                    <p className="text-[11px] font-mono font-medium text-text-secondary mt-0.5">
                      {slot.time}
                    </p>
                    <p className="text-[10px] text-text-muted mt-1 leading-tight">
                      {slot.badge}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          {errors.pickupTimeSlot && (
            <p className={errorClass}>
              <AlertCircle size={14} />
              {errors.pickupTimeSlot}
            </p>
          )}
        </div>
      </div>

      {/* 4. Special Instructions */}
      <div>
        <label htmlFor="specialInstructions" className={labelClass}>
          5. Handover Instructions (Optional)
        </label>
        <textarea
          id="specialInstructions"
          value={specialInstructions || ''}
          onChange={(e) => onChange('specialInstructions', e.target.value)}
          placeholder="Any gates, intercom numbers, elevator codes, or parking directions for the volunteer..."
          rows={2}
          maxLength={300}
          className={`${inputBase} resize-none ${inputOk}`}
        />

        {/* Quick Instructions Chips */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-text-muted mr-1">Quick Notes:</span>
          {activeInstructionTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleAddInstructionTag(tag)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-page border border-border/70 text-text-secondary hover:text-text-primary hover:border-dash-primary/40 transition-colors"
            >
              + {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

