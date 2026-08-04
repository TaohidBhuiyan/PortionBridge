import React from 'react';
import { MapPin, Phone, Calendar, Clock, Navigation, AlertCircle } from 'lucide-react';

/**
 * Step 3 - Pickup Information
 * Fields: Address (saved or one-time), Phone, Pickup Date, Time Slot, Instructions
 */
export function Step3PickupInfo({ formData, errors, onChange, onValidationChange }) {
  const { savedAddressId, pickupAddress, contactPhone, pickupDate, pickupTimeSlot, specialInstructions } = formData;

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

  const handleUseCurrentLocation = () => {
    // UI only - placeholder for future geolocation integration
    alert('Location services will be integrated in Phase 4.2');
  };

  const TIME_SLOTS = [
    { value: 'morning', label: 'Morning (6 AM - 12 PM)' },
    { value: 'afternoon', label: 'Afternoon (12 PM - 6 PM)' },
    { value: 'evening', label: 'Evening (6 PM - 10 PM)' },
  ];

  return (
    <div className="space-y-6">
      {/* Address Section */}
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
          Pickup Address <span className="text-red-500">*</span>
        </label>

        {/* Saved Address Dropdown */}
        <div className="mb-4">
          <select
            value={savedAddressId || ''}
            onChange={(e) => onChange('savedAddressId', e.target.value || null)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 appearance-none cursor-pointer text-gray-900 dark:text-white"
          >
            <option value="">Select a saved address or enter new address</option>
            <option value="1">Home - 123 Main Street, Dhaka</option>
            <option value="2">Office - 456 Business Ave, Dhaka</option>
          </select>
        </div>

        {/* One-time Address Form */}
        {!savedAddressId && (
          <div className="space-y-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700">
            {/* Use Current Location Button */}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all duration-200"
            >
              <Navigation size={18} />
              Use Current Location
            </button>

            {/* Full Address */}
            <div>
              <label htmlFor="fullAddress" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Full Address <span className="text-red-500">*</span>
              </label>
              <textarea
                id="fullAddress"
                value={pickupAddress?.fullAddress || ''}
                onChange={(e) => handleAddressChange('fullAddress', e.target.value)}
                placeholder="House/Flat No., Street, Area, City"
                rows={3}
                maxLength={500}
                className={`
                  w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 resize-none
                  focus:outline-none focus:ring-2 focus:ring-purple-500/50
                  ${errors.fullAddress 
                    ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-950/20' 
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-500 dark:focus:border-purple-400'
                  }
                  text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                `}
                aria-invalid={errors.fullAddress ? 'true' : 'false'}
              />
              {errors.fullAddress && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.fullAddress}
                </p>
              )}
            </div>

            {/* Address Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="division" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Division
                </label>
                <input
                  type="text"
                  id="division"
                  value={pickupAddress?.division || ''}
                  onChange={(e) => handleAddressChange('division', e.target.value)}
                  placeholder="e.g., Dhaka"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
              <div>
                <label htmlFor="district" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  District
                </label>
                <input
                  type="text"
                  id="district"
                  value={pickupAddress?.district || ''}
                  onChange={(e) => handleAddressChange('district', e.target.value)}
                  placeholder="e.g., Dhaka"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
              <div>
                <label htmlFor="area" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Area
                </label>
                <input
                  type="text"
                  id="area"
                  value={pickupAddress?.area || ''}
                  onChange={(e) => handleAddressChange('area', e.target.value)}
                  placeholder="e.g., Gulshan"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Postal Code
                </label>
                <input
                  type="text"
                  id="postalCode"
                  value={pickupAddress?.postalCode || ''}
                  onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                  placeholder="e.g., 1212"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </div>

            {/* Landmark */}
            <div>
              <label htmlFor="landmark" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Landmark (Optional)
              </label>
              <input
                type="text"
                id="landmark"
                value={pickupAddress?.landmark || ''}
                onChange={(e) => handleAddressChange('landmark', e.target.value)}
                placeholder="e.g., Near Blue Mosque"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Contact Phone */}
      <div>
        <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Contact Phone <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="tel"
            id="contactPhone"
            value={contactPhone || ''}
            onChange={(e) => onChange('contactPhone', e.target.value)}
            placeholder="+880 1XXX-XXXXXX"
            maxLength={20}
            className={`
              w-full px-4 py-3 rounded-xl border-2 transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-purple-500/50
              ${errors.contactPhone 
                ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-950/20' 
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-500 dark:focus:border-purple-400'
              }
              text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
            `}
            aria-invalid={errors.contactPhone ? 'true' : 'false'}
            aria-describedby={errors.contactPhone ? 'contactPhone-error' : undefined}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Phone size={18} className="text-gray-400 dark:text-gray-500" />
          </div>
        </div>
        {errors.contactPhone && (
          <p id="contactPhone-error" className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle size={14} />
            {errors.contactPhone}
          </p>
        )}
      </div>

      {/* Pickup Date and Time Slot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pickup Date */}
        <div>
          <label htmlFor="pickupDate" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Pickup Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              id="pickupDate"
              value={pickupDate || ''}
              onChange={(e) => onChange('pickupDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className={`
                w-full px-4 py-3 rounded-xl border-2 transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-purple-500/50
                ${errors.pickupDate 
                  ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-950/20' 
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-500 dark:focus:border-purple-400'
                }
                text-gray-900 dark:text-white
              `}
              aria-invalid={errors.pickupDate ? 'true' : 'false'}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Calendar size={18} className="text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          {errors.pickupDate && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle size={14} />
              {errors.pickupDate}
            </p>
          )}
        </div>

        {/* Time Slot */}
        <div>
          <label htmlFor="pickupTimeSlot" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Preferred Time Slot <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              id="pickupTimeSlot"
              value={pickupTimeSlot || ''}
              onChange={(e) => onChange('pickupTimeSlot', e.target.value)}
              className={`
                w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 appearance-none cursor-pointer
                focus:outline-none focus:ring-2 focus:ring-purple-500/50
                ${errors.pickupTimeSlot 
                  ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-950/20' 
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-500 dark:focus:border-purple-400'
                }
                text-gray-900 dark:text-white
              `}
              aria-invalid={errors.pickupTimeSlot ? 'true' : 'false'}
            >
              <option value="">Select time slot</option>
              {TIME_SLOTS.map(slot => (
                <option key={slot.value} value={slot.value}>{slot.label}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Clock size={18} className="text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          {errors.pickupTimeSlot && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle size={14} />
              {errors.pickupTimeSlot}
            </p>
          )}
        </div>
      </div>

      {/* Special Instructions */}
      <div>
        <label htmlFor="specialInstructions" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Special Instructions (Optional)
        </label>
        <textarea
          id="specialInstructions"
          value={specialInstructions || ''}
          onChange={(e) => onChange('specialInstructions', e.target.value)}
          placeholder="Any special instructions for the volunteer..."
          rows={3}
          maxLength={500}
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 resize-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>

      {/* Map Placeholder */}
      <div className="rounded-xl overflow-hidden border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800">
        <div className="aspect-video flex flex-col items-center justify-center text-center p-6">
          <MapPin size={48} className="text-gray-400 dark:text-gray-500 mb-3" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Map Preview
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Map integration coming in Phase 4.2
          </p>
        </div>
      </div>
    </div>
  );
}
