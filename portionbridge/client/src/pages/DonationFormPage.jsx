import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Stepper } from '../components/donation/Stepper';
import { Step1BasicInfo } from '../components/donation/Step1BasicInfo';
import { Step2DonationDetails } from '../components/donation/Step2DonationDetails';
import { Step3PickupInfo } from '../components/donation/Step3PickupInfo';
import { Step4Images } from '../components/donation/Step4Images';
import { Step5Review } from '../components/donation/Step5Review';
import { Step6Assignment } from '../components/donation/Step6Assignment';
import { donationApi, transformFormDataToApi } from '../services/donationApi';

/**
 * DonationFormPage - Multi-step donation form
 * Supports Food and Clothes donations with validation and auto-save
 * Supports both create and edit modes
 */
export function DonationFormPage() {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditMode = !!editId;

  const STEPS = [
    { id: 'basic', title: 'Basic Information' },
    { id: 'details', title: 'Donation Details' },
    { id: 'pickup', title: 'Pickup Information' },
    { id: 'images', title: 'Images' },
    { id: 'assignment', title: 'Assignment' },
    { id: 'review', title: isEditMode ? 'Review & Update' : 'Review & Submit' },
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [stepValidation, setStepValidation] = useState([false, false, false, false, false, true]);
  const [errors, setErrors] = useState({});
  const [, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [submissionResult, setSubmissionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Load donation data if in edit mode
  useEffect(() => {
    if (isEditMode && editId) {
      loadDonationForEdit();
    } else {
      // Load saved form data from localStorage on mount (only for create mode)
      const savedData = localStorage.getItem('donationFormDraft');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setFormData(parsed);
          setHasUnsavedChanges(true);
        } catch {
          // Failed to load saved form data
        }
      }
    }
  }, [isEditMode, editId]);

  const loadDonationForEdit = async () => {
    setLoading(true);
    try {
      const result = await donationApi.getDonationDetails(editId);
      if (result.success) {
        const donation = result.data.donation;
        // Transform API data to form format
        const formInitialData = {
          title: donation.title,
          category: donation.category,
          description: donation.description,
          quantity: donation.quantity,
          quantityUnit: donation.quantity_unit,
          numberOfServings: donation.number_of_servings,
          pickupDate: donation.pickup_date,
          pickupTimeSlot: donation.pickup_time_slot,
          expiryDate: donation.expiry_date,
          contactPhone: donation.contact_phone,
          specialInstructions: donation.special_instructions,
          // Food specific
          foodType: donation.food_type,
          foodName: donation.food_name,
          ingredients: donation.ingredients,
          allergens: donation.allergens,
          storageRequirement: donation.storage_requirement,
          isVegetarian: donation.is_vegetarian,
          isHalal: donation.is_halal,
          // Clothes specific
          clothingCategory: donation.clothing_category,
          gender: donation.gender,
          ageGroup: donation.age_group,
          itemCondition: donation.item_condition,
          brand: donation.brand,
          size: donation.size,
          color: donation.color,
          season: donation.season,
          additionalNotes: donation.additional_notes,
          // Address
          pickupAddress: donation.pickup_address_details,
          // Images
          images: donation.images || [],
        };
        setFormData(formInitialData);
        setStepValidation([true, true, true, true, true]);
      } else {
        alert(result.error || 'Failed to load donation');
        navigate('/donor/my-donations');
      }
    } catch {
      alert('Failed to load donation. Please try again.');
      navigate('/donor/my-donations');
    } finally {
      setLoading(false);
    }
  };

  // Auto-save form data to localStorage (only for create mode)
  useEffect(() => {
    if (hasUnsavedChanges && !isEditMode) {
      const saveTimer = setTimeout(() => {
        localStorage.setItem('donationFormDraft', JSON.stringify(formData));
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 500);
      }, 1000);

      return () => clearTimeout(saveTimer);
    }
  }, [formData, hasUnsavedChanges, isEditMode]);

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Validate current step
  const validateStep = useCallback((stepIndex) => {
    const newErrors = {};
    const data = formData;

    // Step 1 validation
    if (stepIndex === 0) {
      if (!data.title?.trim()) {
        newErrors.title = 'Title is required';
      } else if (data.title.trim().length > 200) {
        newErrors.title = 'Title must be 200 characters or less';
      }

      if (!data.category) {
        newErrors.category = 'Category is required';
      }

      if (!data.description?.trim()) {
        newErrors.description = 'Description is required';
      } else if (data.description.trim().length > 500) {
        newErrors.description = 'Description must be 500 characters or less';
      }

      if (!data.quantity || data.quantity <= 0) {
        newErrors.quantity = 'Quantity must be greater than 0';
      }

      if (!data.quantityUnit) {
        newErrors.quantityUnit = 'Unit is required';
      }
    }

    // Step 2 validation
    if (stepIndex === 1) {
      if (data.category === 'food') {
        if (!data.foodType) {
          newErrors.foodType = 'Food type is required';
        }
        if (!data.foodName?.trim()) {
          newErrors.foodName = 'Food name is required';
        }
        if (!data.storageRequirement) {
          newErrors.storageRequirement = 'Storage requirement is required';
        }
      } else if (data.category === 'clothes') {
        if (!data.clothingCategory) {
          newErrors.clothingCategory = 'Clothing category is required';
        }
        if (!data.gender) {
          newErrors.gender = 'Gender is required';
        }
        if (!data.ageGroup) {
          newErrors.ageGroup = 'Age group is required';
        }
        if (!data.itemCondition) {
          newErrors.itemCondition = 'Item condition is required';
        }
      }
    }

    // Step 3 validation
    if (stepIndex === 2) {
      if (!data.savedAddressId && !data.pickupAddress?.fullAddress?.trim()) {
        newErrors.fullAddress = 'Address is required';
      }

      if (!data.contactPhone?.trim()) {
        newErrors.contactPhone = 'Contact phone is required';
      } else if (data.contactPhone.trim().length < 7 || data.contactPhone.trim().length > 20) {
        newErrors.contactPhone = 'Phone number must be between 7 and 20 characters';
      }

      if (!data.pickupDate) {
        newErrors.pickupDate = 'Pickup date is required';
      } else {
        const pickupDate = new Date(data.pickupDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (pickupDate < today) {
          newErrors.pickupDate = 'Pickup date must be in the future';
        }
      }

      if (!data.pickupTimeSlot) {
        newErrors.pickupTimeSlot = 'Time slot is required';
      }
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    
    setStepValidation(prev => {
      const updated = [...prev];
      updated[stepIndex] = isValid;
      return updated;
    });

    return isValid;
  }, [formData]);

  // Handle form field change
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  // Handle step validation change from child components
  const handleStepValidation = (isValid) => {
    setStepValidation(prev => {
      const updated = [...prev];
      updated[currentStep] = isValid;
      return updated;
    });
  };

  // Handle step navigation
  const handleNext = () => {
    const isValid = validateStep(currentStep);
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleStepClick = (stepIndex) => {
    if (stepIndex <= currentStep || stepValidation[stepIndex]) {
      setCurrentStep(stepIndex);
    }
  };

  const handleEditStep = (stepIndex) => {
    setCurrentStep(stepIndex);
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate all steps before submission
    const allValid = stepValidation.every(Boolean);
    if (!allValid) {
      // Go to first invalid step
      const firstInvalidStep = stepValidation.findIndex(v => !v);
      setCurrentStep(firstInvalidStep);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Transform form data to API format
      const apiData = transformFormDataToApi(formData);

      if (isEditMode) {
        // Update existing donation
        const updateResult = await donationApi.updateDonation(editId, apiData);

        if (!updateResult.success) {
          // Handle validation errors from backend
          if (updateResult.errors) {
            const backendErrors = {};
            Object.keys(updateResult.errors).forEach(field => {
              backendErrors[field] = updateResult.errors[field].join(', ');
            });
            setErrors(backendErrors);
          } else {
            setErrors({ submit: updateResult.error });
          }
          setIsSubmitting(false);
          return;
        }

        // Show success result
        setSubmissionResult({
          success: true,
          donationId: editId,
          donation: updateResult.data.donation,
          isUpdate: true,
        });
      } else {
        // Create new donation
        const createResult = await donationApi.createDonation(apiData);

        if (!createResult.success) {
          // Handle validation errors from backend
          if (createResult.errors) {
            const backendErrors = {};
            Object.keys(createResult.errors).forEach(field => {
              backendErrors[field] = createResult.errors[field].join(', ');
            });
            setErrors(backendErrors);
          } else {
            setErrors({ submit: createResult.error });
          }
          setIsSubmitting(false);
          return;
        }

        const donationId = createResult.data.donation.id;

        // Upload images if any
        if (formData.images && formData.images.length > 0) {
          const uploadPromises = formData.images.map(async (image) => {
            const progressKey = image.id;
            setUploadProgress(prev => ({ ...prev, [progressKey]: 0 }));

            const uploadResult = await donationApi.uploadDonationImage(
              donationId,
              image.file,
              (percent) => {
                setUploadProgress(prev => ({ ...prev, [progressKey]: percent }));
              }
            );

            setUploadProgress(prev => ({ ...prev, [progressKey]: 100 }));
            return uploadResult;
          });

          await Promise.all(uploadPromises);
        }

        // Clear draft on successful submission
        localStorage.removeItem('donationFormDraft');
        setHasUnsavedChanges(false);

        // Show success result
        setSubmissionResult({
          success: true,
          donationId,
          donation: createResult.data.donation,
          isUpdate: false,
        });
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred. Please try again.' });
      setSubmissionResult({ success: false, error: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear draft
  const handleClearDraft = () => {
    if (window.confirm('Are you sure you want to clear the saved draft?')) {
      localStorage.removeItem('donationFormDraft');
      setFormData({});
      setHasUnsavedChanges(false);
      setCurrentStep(0);
      setStepValidation([false, false, false, false, false, true]);
      setErrors({});
    }
  };

  const canGoNext = stepValidation[currentStep];
  const canSubmit = stepValidation.every(Boolean) && !isSubmitting;

  // Handle success actions
  const handleViewDonation = () => {
    if (submissionResult?.donationId) {
      navigate(`/donations/${submissionResult.donationId}`);
    }
  };

  const handleCreateAnother = () => {
    setFormData({});
    setCurrentStep(0);
    setStepValidation([false, false, false, false, false, true]);
    setErrors({});
    setSubmissionResult(null);
    setUploadProgress({});
  };

  const handleReturnDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-8 w-32 bg-border rounded-lg animate-pulse mb-4" />
          <div className="space-y-2">
            <div className="h-10 w-48 bg-border rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-border rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Stepper Skeleton */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex-1 h-2 bg-border rounded-lg animate-pulse" />
          ))}
        </div>

        {/* Form Card Skeleton */}
        <div className="bg-surface rounded-2xl border border-border p-6 md:p-8 animate-pulse">
          <div className="min-h-[400px] space-y-4">
            <div className="h-6 w-48 bg-border rounded-lg animate-pulse" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-border rounded-lg animate-pulse" />
                <div className="h-12 w-full bg-border rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-3 focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2 rounded-lg px-2 py-1"
        >
          <ArrowLeft size={18} />
          <span className="font-medium text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-semibold text-text-primary mb-1">
          {isEditMode ? 'Edit Donation' : 'Create Donation'}
        </h1>
        <p className="text-sm text-text-secondary">
          {isEditMode 
            ? 'Update the details of your donation request' 
            : 'Fill in the details to create a new donation request'
          }
        </p>
      </div>

      {/* Stepper */}
      <nav aria-label="Donation form progress">
        <Stepper
          steps={STEPS}
          currentStep={currentStep}
          onStepClick={handleStepClick}
        />
      </nav>

      {/* Form Card */}
      <div className="bg-surface rounded-lg border border-border p-5 md:p-6 shadow-sm">
        {/* Step Content */}
        <div className="min-h-[350px]" role="region" aria-label={`Donation form step ${currentStep + 1} of ${STEPS.length}: ${STEPS[currentStep]}`} aria-live="polite">
          {currentStep === 0 && (
            <Step1BasicInfo
              formData={formData}
              errors={errors}
              onChange={handleFieldChange}
              onValidationChange={handleStepValidation}
            />
          )}
          {currentStep === 1 && (
            <Step2DonationDetails
              formData={formData}
              errors={errors}
              onChange={handleFieldChange}
              onValidationChange={handleStepValidation}
            />
          )}
          {currentStep === 2 && (
            <Step3PickupInfo
              formData={formData}
              errors={errors}
              onChange={handleFieldChange}
              onValidationChange={handleStepValidation}
            />
          )}
          {currentStep === 3 && (
            <Step4Images
              formData={formData}
              errors={errors}
              onChange={handleFieldChange}
              onValidationChange={handleStepValidation}
            />
          )}
          {currentStep === 4 && (
            <Step6Assignment
              formData={formData}
              errors={errors}
              onChange={handleFieldChange}
              pickupLocation={formData.pickupAddress}
            />
          )}
          {currentStep === 5 && (
            <Step5Review
              formData={formData}
              onEditStep={handleEditStep}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          {/* Previous Button */}
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm
              ${currentStep === 0
                ? 'bg-page text-text-secondary cursor-not-allowed'
                : 'bg-surface border border-border text-text-primary hover:bg-surface-hover'
              }
            `}
          >
            <ArrowLeft size={16} />
            Previous
          </button>

          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <button
                type="button"
                onClick={handleClearDraft}
                className="px-3 py-2 rounded-lg text-text-secondary hover:bg-surface-hover transition-all focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2 text-sm"
              >
                Clear Draft
              </button>
            )}

            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={!canGoNext}
                className="flex items-center gap-2 px-4 py-2 bg-dash-primary hover:bg-dash-primary-hover text-white rounded-lg font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2 text-sm"
              >
                Next
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex items-center gap-2 px-4 py-2 bg-dash-primary hover:bg-dash-primary-hover text-white rounded-lg font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2 text-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Submit Donation
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Clear Draft Button */}
        {!isEditMode && hasUnsavedChanges && (
          <button
            type="button"
            onClick={handleClearDraft}
            className="w-full mt-3 text-xs text-danger hover:text-danger/80 transition-colors"
          >
            Clear Saved Draft
          </button>
        )}
      </div>

      {/* Submission Result Modal */}
      {submissionResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl max-w-md w-full p-6 md:p-8 shadow-2xl animate-[modalIn_0.25s_ease]">
            {submissionResult.success ? (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success-soft flex items-center justify-center">
                  <CheckCircle size={32} className="text-success" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">
                  {submissionResult.isUpdate ? 'Donation Updated Successfully!' : 'Donation Created Successfully!'}
                </h3>
                <p className="text-text-secondary mb-6">
                  {submissionResult.isUpdate 
                    ? 'Your donation request has been updated successfully.'
                    : 'Your donation request has been submitted and is now visible to volunteers.'
                  }
                </p>
                <div className="space-y-3">
                  <button
                    onClick={handleViewDonation}
                    className="w-full px-4 py-3 bg-dash-primary hover:bg-dash-primary-hover text-white font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    View Donation
                  </button>
                  {!submissionResult.isUpdate && (
                    <button
                      onClick={handleCreateAnother}
                      className="w-full px-4 py-3 bg-surface border-2 border-border text-text-primary font-medium rounded-xl hover:bg-surface-hover transition-all duration-200"
                    >
                      Create Another Donation
                    </button>
                  )}
                  <button
                    onClick={handleReturnDashboard}
                    className="w-full px-4 py-3 text-text-secondary font-medium hover:text-text-primary transition-colors"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-danger-soft flex items-center justify-center">
                  <XCircle size={32} className="text-danger" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">
                  Submission Failed
                </h3>
                <p className="text-text-secondary mb-6">
                  {submissionResult.error || 'An error occurred while submitting your donation.'}
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => setSubmissionResult(null)}
                    className="w-full px-4 py-3 bg-dash-primary hover:bg-dash-primary-hover text-white font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleReturnDashboard}
                    className="w-full px-4 py-3 text-text-secondary font-medium hover:text-text-primary transition-colors"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Progress Indicator */}
      {isSubmitting && Object.keys(uploadProgress).length > 0 && (
        <div className="fixed bottom-4 right-4 bg-surface rounded-xl shadow-lg p-4 border border-border max-w-xs">
          <p className="text-sm font-medium text-text-primary mb-2">
            Uploading images...
          </p>
          <div className="space-y-2">
            {Object.entries(uploadProgress).map(([id, progress]) => (
              <div key={id} className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-dash-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-text-secondary w-10 text-right">
                  {progress}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
