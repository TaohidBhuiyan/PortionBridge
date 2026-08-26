import React, { useState, useEffect } from 'react';
import { Phone, Calendar, Clock, Navigation, AlertCircle } from 'lucide-react';
import { donationApi } from '../../services/donationApi';

const inputBase = 'w-full px-3.5 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-dash-primary/40 text-text-primary placeholder:text-text-secondary';
const inputOk = 'border-border bg-page focus:border-dash-primary';
const inputErr = 'border-danger bg-danger-soft';
const labelClass = 'block text-sm font-medium text-text-primary mb-1.5';
const errorClass = 'mt-1 text-xs text-danger flex items-center gap-1';

// A saved address may come back with camelCase or snake_case keys depending
// on the endpoint version — read both so the label renders either way.
function addressLabel(addr) {
  const full = addr.fullAddress || addr.full_address || '';
  const label = addr.customLabel || addr.custom_label || addr.label || 'Address';
  const shortLabel = label.charAt(0).toUpperCase() + label.slice(1);
  return full ? `${shortLabel} — ${full}` : shortLabel;
}

/**
 * Step 3 - Pickup Information
 * Fields: Address (saved or one-time), Phone, Pickup Date, Time Slot, Instructions
 */
export function Step3PickupInfo({ formData, errors, onChange, onValidationChange }) {
  const { savedAddressId, pickupAddress, contactPhone, pickupDate, pickupTimeSlot, specialInstructions } = formData;
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const result = await donationApi.getSavedAddresses();
        if (result.success) {
          setSavedAddresses(result.data.addresses || []);
        }
      } finally {
        setLoadingAddresses(false);
      }
    };
    fetchAddresses();
  }, []);

  // Validation
  React.useEffect(() => {
    const isValid = 
      contactPhone?.trim().length >= 7 &&
      contactPhone?.trim().length <= 20 &&
      pickupDate &&
      pickupTimeSlot &&
      (savedAddressId || (pickupAddress?.fullAddress?.trim().length > 0));

    onValidationChange?.(isValid);
  }, [savedAddressId, pickupAddress, contactPhone, pickupDate, pickupTimeSlot, onValidationChange]);

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
      if (selected) onChange('savedAddressLabel', addressLabel(selected));
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      onChange('pickupAddress', {
        ...pickupAddress,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    });
  };

  const TIME_SLOTS = [
    { value: 'morning', label: 'Morning (6 AM - 12 PM)' },
    { value: 'afternoon', label: 'Afternoon (12 PM - 6 PM)' },
    { value: 'evening', label: 'Evening (6 PM - 10 PM)' },
  ];

  return (
    <div className="space-y-5">
      {/* Address Section */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Pickup Address <span className="text-danger">*</span>
        </label>

        {/* Saved Address Dropdown — only shown once we know whether the donor has any */}
        {!loadingAddresses && savedAddresses.length > 0 && (
          <div className="mb-3">
            <select
              value={savedAddressId || ''}
              onChange={(e) => handleSavedAddressChange(e.target.value)}
              className={`${inputBase} appearance-none cursor-pointer ${inputOk}`}
            >
              <option value="">Enter a new address below</option>
              {savedAddresses.map((addr) => (
                <option key={addr.id} value={addr.id}>{addressLabel(addr)}</option>
              ))}
            </select>
          </div>
        )}

        {/* One-time Address Form */}
        {!savedAddressId && (
          <div className="space-y-4 p-4 rounded-lg bg-page border border-border">
            {/* Use Current Location Button */}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-dash-primary/40 text-dash-primary hover:bg-dash-primary-soft transition-colors text-sm"
            >
              <Navigation size={16} />
              Use Current Location
            </button>

            {/* Full Address */}
            <div>
              <label htmlFor="fullAddress" className={labelClass}>
                Full Address <span className="text-danger">*</span>
              </label>
              <textarea
                id="fullAddress"
                value={pickupAddress?.fullAddress || ''}
                onChange={(e) => handleAddressChange('fullAddress', e.target.value)}
                placeholder="House/Flat No., Street, Area, City"
                rows={3}
                maxLength={500}
                className={`${inputBase} resize-none ${errors.fullAddress ? inputErr : inputOk}`}
                aria-invalid={errors.fullAddress ? 'true' : 'false'}
              />
              {errors.fullAddress && (
                <p className={errorClass}>
                  <AlertCircle size={13} />
                  {errors.fullAddress}
                </p>
              )}
            </div>

            {/* Address Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                <label htmlFor="district" className={labelClass}>District</label>
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
                <label htmlFor="area" className={labelClass}>Area</label>
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
              <label htmlFor="landmark" className={labelClass}>Landmark (Optional)</label>
              <input
                type="text"
                id="landmark"
                value={pickupAddress?.landmark || ''}
                onChange={(e) => handleAddressChange('landmark', e.target.value)}
                placeholder="e.g., Near Blue Mosque"
                className={`${inputBase} ${inputOk}`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Contact Phone */}
      <div>
        <label htmlFor="contactPhone" className={labelClass}>
          Contact Phone <span className="text-danger">*</span>
        </label>
        <div className="relative">
          <input
            type="tel"
            id="contactPhone"
            value={contactPhone || ''}
            onChange={(e) => onChange('contactPhone', e.target.value)}
            placeholder="e.g., +880 1234 567890"
            maxLength={20}
            className={`${inputBase} pl-9 ${errors.contactPhone ? inputErr : inputOk}`}
            aria-invalid={errors.contactPhone ? 'true' : 'false'}
            aria-describedby={errors.contactPhone ? 'contactPhone-error' : undefined}
          />
          <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
        </div>
        {errors.contactPhone && (
          <p id="contactPhone-error" className={errorClass}>
            <AlertCircle size={13} />
            {errors.contactPhone}
          </p>
        )}
      </div>

      {/* Pickup Date */}
      <div>
        <label htmlFor="pickupDate" className={labelClass}>
          Pickup Date <span className="text-danger">*</span>
        </label>
        <div className="relative">
          <input
            type="date"
            id="pickupDate"
            value={pickupDate || ''}
            onChange={(e) => onChange('pickupDate', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className={`${inputBase} pl-9 ${errors.pickupDate ? inputErr : inputOk}`}
            aria-invalid={errors.pickupDate ? 'true' : 'false'}
            aria-describedby={errors.pickupDate ? 'pickupDate-error' : undefined}
          />
          <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
        </div>
        {errors.pickupDate && (
          <p id="pickupDate-error" className={errorClass}>
            <AlertCircle size={13} />
            {errors.pickupDate}
          </p>
        )}
      </div>

      {/* Time Slot */}
      <div>
        <label className={labelClass}>
          Preferred Time Slot <span className="text-danger">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {TIME_SLOTS.map((slot) => (
            <button
              key={slot.value}
              type="button"
              onClick={() => onChange('pickupTimeSlot', slot.value)}
              className={`p-2.5 rounded-lg border transition-colors text-sm ${
                pickupTimeSlot === slot.value
                  ? 'border-dash-primary bg-dash-primary-soft text-dash-primary'
                  : 'border-border bg-page hover:border-dash-primary/50 text-text-secondary'
              }`}
            >
              <Clock size={14} className="inline-block mr-1.5" />
              {slot.label}
            </button>
          ))}
        </div>
        {errors.pickupTimeSlot && (
          <p className={errorClass}>
            <AlertCircle size={13} />
            {errors.pickupTimeSlot}
          </p>
        )}
      </div>

      {/* Special Instructions */}
      <div>
        <label htmlFor="specialInstructions" className={labelClass}>
          Special Instructions (Optional)
        </label>
        <textarea
          id="specialInstructions"
          value={specialInstructions || ''}
          onChange={(e) => onChange('specialInstructions', e.target.value)}
          placeholder="Any special instructions for the volunteer..."
          rows={3}
          maxLength={300}
          className={`${inputBase} resize-none ${inputOk}`}
        />
      </div>
    </div>
  );
}
