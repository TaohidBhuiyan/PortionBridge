import { useState, useEffect } from 'react';
import { AssignmentModeSelection, AutoAssignRecommendation, VolunteerSelection } from '../dashboard/donor';

/**
 * Step 6: Assignment Selection
 * Allows donor to choose assignment mode and select volunteer
 */
export function Step6Assignment({ onChange, onValidationChange, errors, pickupLocation }) {
  const [assignmentMode, setAssignmentMode] = useState('auto');
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);

  // Derived directly from the prop each render — no effect needed, since
  // these are never independently set beyond what pickupLocation provides.
  const latitude = pickupLocation?.latitude ?? null;
  const longitude = pickupLocation?.longitude ?? null;

  useEffect(() => {
    // Update form data when selection changes.
    // Note: onChange has signature (field, value) — call it once per field
    // rather than passing a merged object (which previously silently wrote
    // to a single "[object Object]" key and never actually stored these
    // values in form state).
    onChange('assignmentMode', assignmentMode);
    onChange('selectedVolunteer', selectedVolunteer);
    onChange('volunteerId', selectedVolunteer?.id || null);

    // Validate step - valid if coordinates exist and volunteer is selected
    const isValid = latitude && longitude && selectedVolunteer !== null;
    onValidationChange(isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentMode, selectedVolunteer, latitude, longitude]);

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
      <div className="bg-warning-soft border border-warning/30 rounded-lg p-4">
        <p className="text-warning text-sm">
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
        <p className="text-danger text-sm">{errors.assignment}</p>
      )}
    </div>
  );
}