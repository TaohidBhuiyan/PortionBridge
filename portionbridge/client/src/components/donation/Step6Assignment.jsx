import { useState, useEffect } from 'react';
import { AssignmentModeSelection, AutoAssignRecommendation, VolunteerSelection } from '../dashboard/donor';

/**
 * Step 6: Assignment Selection
 * Allows donor to choose assignment mode and select volunteer
 */
export function Step6Assignment({ formData, onChange, onValidationChange, errors, pickupLocation }) {
  const [assignmentMode, setAssignmentMode] = useState('auto');
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  useEffect(() => {
    // Get coordinates from pickup address
    if (pickupLocation?.latitude && pickupLocation?.longitude) {
      setLatitude(pickupLocation.latitude);
      setLongitude(pickupLocation.longitude);
    }
  }, [pickupLocation]);

  useEffect(() => {
    // Update form data when selection changes
    onChange({
      assignmentMode,
      selectedVolunteer,
      volunteerId: selectedVolunteer?.id || null,
    });

    // Validate step - valid if coordinates exist and volunteer is selected
    const isValid = latitude && longitude && selectedVolunteer !== null;
    onValidationChange(isValid);
  }, [assignmentMode, selectedVolunteer, latitude, longitude, onChange, onValidationChange]);

  const handleModeChange = (mode) => {
    setAssignmentMode(mode);
    setSelectedVolunteer(null); // Reset selection when mode changes
  };

  const handleVolunteerSelect = (volunteer) => {
    setSelectedVolunteer(volunteer);
  };

  const handleConfirmAssignment = (volunteer) => {
    setSelectedVolunteer(volunteer);
  };

  if (!latitude || !longitude) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-yellow-800 dark:text-yellow-200 text-sm">
          Please provide pickup location coordinates to enable volunteer assignment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AssignmentModeSelection
        selectedMode={assignmentMode}
        onModeChange={handleModeChange}
      />

      {assignmentMode === 'auto' ? (
        <AutoAssignRecommendation
          latitude={latitude}
          longitude={longitude}
          onConfirm={handleConfirmAssignment}
          onAlternativeSelect={() => setAssignmentMode('manual')}
        />
      ) : (
        <VolunteerSelection
          latitude={latitude}
          longitude={longitude}
          onSelect={handleVolunteerSelect}
          selectedVolunteer={selectedVolunteer}
        />
      )}

      {errors?.assignment && (
        <p className="text-red-600 dark:text-red-400 text-sm">{errors.assignment}</p>
      )}
    </div>
  );
}
