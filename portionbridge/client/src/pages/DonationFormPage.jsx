import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Copy, 
  Check, 
  Utensils, 
  Shirt, 
  ChevronRight
} from 'lucide-react';
import { DashboardLayout } from '../components/dashboard';
import { Stepper } from '../components/donation/Stepper';
import { Step1BasicInfo } from '../components/donation/Step1BasicInfo';
import { Step2DonationDetails } from '../components/donation/Step2DonationDetails';
import { Step3PickupInfo } from '../components/donation/Step3PickupInfo';
import { Step4Images } from '../components/donation/Step4Images';
import { Step5Review } from '../components/donation/Step5Review';
import { Step6Assignment } from '../components/donation/Step6Assignment';
import { donationApi, transformFormDataToApi } from '../services/donationApi';

const stepVariants = {
  enter: (dir) => ({
    x: dir > 0 ? 25 : -25,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.26, ease: 'easeOut' },
  },
  exit: (dir) => ({
    x: dir > 0 ? -25 : 25,
    opacity: 0,
    transition: { duration: 0.18, ease: 'easeIn' },
  }),
};

/**
 * DonationFormPage - Multi-step donation creation & edit flow
 * Ultra-premium design integrated with DashboardLayout, animated transitions,
 * real-time auto-save indicator, and celebratory verification feedback.
 */
export function DonationFormPage() {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditMode = Boolean(editId);

  const STEPS = [
    { id: 'basic', title: 'Basic Info' },
    { id: 'details', title: 'Details' },
    { id: 'pickup', title: 'Pickup' },
    { id: 'images', title: 'Photos' },
    { id: 'assignment', title: 'Assignment' },
    { id: 'review', title: isEditMode ? 'Review & Update' : 'Review & Submit' },
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const [formData, setFormData] = useState(() => {
    const initialCategory = searchParams.get('category');
    return initialCategory === 'food' || initialCategory === 'clothes'
      ? { category: initialCategory }
      : {};
  });

  const [stepValidation, setStepValidation] = useState([false, false, false, false, false, true]);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [submissionResult, setSubmissionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const navigate = useNavigate();

  const categoryParam = searchParams.get('category');

  // React to URL category param changes (e.g. from sidebar clicks or deep links)
  useEffect(() => {
    if (categoryParam === 'food' || categoryParam === 'clothes') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData((prev) => {
        if (prev.category === categoryParam) return prev;

        const updated = { ...prev, category: categoryParam };
        if (categoryParam === 'clothes') {
          if (!prev.quantityUnit || ['plate', 'kg', 'gram', 'liter'].includes(prev.quantityUnit)) {
            updated.quantityUnit = 'piece';
          }
          delete updated.foodType;
          delete updated.foodName;
          delete updated.numberOfServings;
          delete updated.ingredients;
          delete updated.allergens;
          delete updated.storageRequirement;
          delete updated.isVegetarian;
          delete updated.isHalal;
          delete updated.expiryDate;
        } else {
          if (!prev.quantityUnit || ['piece'].includes(prev.quantityUnit)) {
            updated.quantityUnit = 'plate';
          }
          delete updated.clothingCategory;
          delete updated.gender;
          delete updated.ageGroup;
          delete updated.itemCondition;
          delete updated.brand;
          delete updated.size;
          delete updated.color;
          delete updated.season;
        }
        return updated;
      });
      setCurrentStep(0);
      setStepValidation([false, false, false, false, false, true]);
      setErrors({});
    }
  }, [categoryParam]);

  const loadDonationForEdit = useCallback(async () => {
    setLoading(true);
    try {
      const result = await donationApi.getDonationDetails(editId);
      if (result.success) {
        const donation = result.data.donation;
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
        setStepValidation([true, true, true, true, true, true]);
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
  }, [editId, navigate]);

  // Load donation data if in edit mode, else load draft
  useEffect(() => {
    if (isEditMode && editId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadDonationForEdit();
    } else {
      const savedData = localStorage.getItem('donationFormDraft');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (categoryParam && (categoryParam === 'food' || categoryParam === 'clothes') && parsed.category !== categoryParam) {
            parsed.category = categoryParam;
            if (categoryParam === 'clothes') {
              parsed.quantityUnit = 'piece';
              delete parsed.foodType;
              delete parsed.foodName;
              delete parsed.numberOfServings;
              delete parsed.ingredients;
              delete parsed.allergens;
              delete parsed.storageRequirement;
              delete parsed.isVegetarian;
              delete parsed.isHalal;
              delete parsed.expiryDate;
            } else {
              parsed.quantityUnit = 'plate';
              delete parsed.clothingCategory;
              delete parsed.gender;
              delete parsed.ageGroup;
              delete parsed.itemCondition;
              delete parsed.brand;
              delete parsed.size;
              delete parsed.color;
              delete parsed.season;
            }
          }
          setFormData(parsed);
          setHasUnsavedChanges(true);
          setLastSavedTime(new Date());
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [isEditMode, editId, loadDonationForEdit, categoryParam]);

  // Auto-save form data to localStorage (only for create mode)
  useEffect(() => {
    if (hasUnsavedChanges && !isEditMode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSaving(true);
      const saveTimer = setTimeout(() => {
        localStorage.setItem('donationFormDraft', JSON.stringify(formData));
        setIsSaving(false);
        setLastSavedTime(new Date());
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

  // Validate step
  const validateStep = useCallback((stepIndex) => {
    const newErrors = {};
    const data = formData;

    // Step 1: Basic Info
    if (stepIndex === 0) {
      if (!data.title?.trim()) {
        newErrors.title = 'Title is required';
      } else if (data.title.trim().length > 200) {
        newErrors.title = 'Title must be 200 characters or less';
      }

      if (!data.category) {
        newErrors.category = 'Donation category is required';
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
      } else if (data.category === 'clothes' && !['piece', 'box', 'packet'].includes(data.quantityUnit)) {
        newErrors.quantityUnit = 'Please select a clothing unit (Piece, Box, or Packet)';
      }
    }

    // Step 2: Details
    if (stepIndex === 1) {
      if (data.category === 'food') {
        if (!data.foodType) newErrors.foodType = 'Food type is required';
        if (!data.foodName?.trim()) newErrors.foodName = 'Food name is required';
        if (!data.storageRequirement) newErrors.storageRequirement = 'Storage requirement is required';
      } else if (data.category === 'clothes') {
        if (!data.clothingCategory) newErrors.clothingCategory = 'Garment category is required';
        if (!data.gender) newErrors.gender = 'Target gender is required';
        if (!data.ageGroup) newErrors.ageGroup = 'Age group is required';
        if (!data.itemCondition) newErrors.itemCondition = 'Item condition is required';
      } else {
        newErrors.category = 'Please select either Food or Clothes in Step 1';
      }
    }

    // Step 3: Pickup Info
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

    setStepValidation((prev) => {
      const updated = [...prev];
      updated[stepIndex] = isValid;
      return updated;
    });

    return isValid;
  }, [formData]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasUnsavedChanges(true);

    if (field === 'category' && (value === 'food' || value === 'clothes')) {
      navigate(`/donation/create?category=${value}`, { replace: true });
    }

    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleStepValidation = useCallback((isValid) => {
    setStepValidation((prev) => {
      if (prev[currentStep] === isValid) return prev;
      const updated = [...prev];
      updated[currentStep] = isValid;
      return updated;
    });
  }, [currentStep]);

  const handleNext = () => {
    const isValid = validateStep(currentStep);
    if (isValid) {
      setDirection(1);
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    setDirection(-1);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStepClick = (stepIndex) => {
    if (stepIndex <= currentStep || stepValidation[stepIndex]) {
      setDirection(stepIndex > currentStep ? 1 : -1);
      setCurrentStep(stepIndex);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleEditStep = (stepIndex) => {
    setDirection(stepIndex > currentStep ? 1 : -1);
    setCurrentStep(stepIndex);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearDraft = () => {
    if (window.confirm('Are you sure you want to clear your saved draft? All unsaved inputs will be reset.')) {
      localStorage.removeItem('donationFormDraft');
      setFormData({});
      setHasUnsavedChanges(false);
      setLastSavedTime(null);
      setCurrentStep(0);
      setStepValidation([false, false, false, false, false, true]);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    const allValid = stepValidation.every(Boolean);
    if (!allValid) {
      const firstInvalidStep = stepValidation.findIndex((v) => !v);
      setDirection(firstInvalidStep > currentStep ? 1 : -1);
      setCurrentStep(firstInvalidStep);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const apiData = transformFormDataToApi(formData);

      if (isEditMode) {
        const updateResult = await donationApi.updateDonation(editId, apiData);
        if (!updateResult.success) {
          if (updateResult.errors) {
            const backendErrors = {};
            Object.keys(updateResult.errors).forEach((field) => {
              backendErrors[field] = updateResult.errors[field].join(', ');
            });
            setErrors(backendErrors);
          } else {
            setErrors({ submit: updateResult.error });
          }
          setIsSubmitting(false);
          return;
        }

        setSubmissionResult({
          success: true,
          donationId: editId,
          donation: updateResult.data.donation,
          isUpdate: true,
        });
      } else {
        const createResult = await donationApi.createDonation(apiData);
        if (!createResult.success) {
          if (createResult.errors) {
            const backendErrors = {};
            Object.keys(createResult.errors).forEach((field) => {
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

        // Upload images if attached
        if (formData.images && formData.images.length > 0) {
          const uploadPromises = formData.images.map(async (image) => {
            const progressKey = image.id;
            setUploadProgress((prev) => ({ ...prev, [progressKey]: 0 }));

            const uploadResult = await donationApi.uploadDonationImage(
              donationId,
              image.file,
              (percent) => {
                setUploadProgress((prev) => ({ ...prev, [progressKey]: percent }));
              }
            );

            setUploadProgress((prev) => ({ ...prev, [progressKey]: 100 }));
            return uploadResult;
          });

          await Promise.all(uploadPromises);
        }

        localStorage.removeItem('donationFormDraft');
        setHasUnsavedChanges(false);

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

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(String(id));
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

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
    navigate('/donor/dashboard');
  };

  const canGoNext = stepValidation[currentStep];
  const canSubmit = stepValidation.every(Boolean) && !isSubmitting;

  // Skeleton Loader for Edit Fetch
  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-8 w-32 bg-border rounded-xl animate-pulse" />
          <div className="h-12 w-64 bg-border rounded-xl animate-pulse" />
          <div className="h-16 w-full bg-border rounded-2xl animate-pulse" />
          <div className="h-96 w-full bg-surface border border-border rounded-3xl animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto pb-16">
        {/* Top Breadcrumb & Auto-Save Pill Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Link to="/donor/dashboard" className="hover:text-text-primary transition-colors">
              Dashboard
            </Link>
            <ChevronRight size={12} />
            <Link to="/donor/my-donations" className="hover:text-text-primary transition-colors">
              Donations
            </Link>
            <ChevronRight size={12} />
            <span className="text-text-primary font-bold">
              {isEditMode ? 'Edit Donation' : 'Create Donation'}
            </span>
          </div>

          {/* Auto-Save Status Pill */}
          {!isEditMode && (
            <div className="flex items-center gap-2 text-xs self-start sm:self-auto">
              {isSaving ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold shadow-2xs">
                  <Loader2 size={12} className="animate-spin" />
                  Saving draft...
                </span>
              ) : lastSavedTime ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold shadow-2xs">
                  <Check size={12} className="stroke-[3]" />
                  Draft auto-saved
                </span>
              ) : null}

              {hasUnsavedChanges && (
                <button
                  type="button"
                  onClick={handleClearDraft}
                  className="text-text-muted hover:text-danger text-xs font-semibold px-2 py-1 rounded-lg transition-colors"
                >
                  Clear Draft
                </button>
              )}
            </div>
          )}
        </div>

        {/* Hero Title & Motivation Banner */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
                  {isEditMode ? 'Edit Donation Request' : 'Share a Portion, Empower a Community'}
                </h1>
                {formData.category && (
                  <span className={`px-3 py-1 text-xs font-bold rounded-full inline-flex items-center gap-1.5 shadow-2xs ${
                    formData.category === 'food'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                  }`}>
                    {formData.category === 'food' ? <Utensils size={13} /> : <Shirt size={13} />}
                    {formData.category === 'food' ? 'Food Initiative' : 'Clothing Initiative'}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                {isEditMode 
                  ? 'Update the details and logistics of your donation request' 
                  : 'Fill in the details to connect with verified volunteers who ensure prompt, dignified collection and handover.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Stepper Component */}
        <nav aria-label="Donation form progress">
          <Stepper
            steps={STEPS}
            currentStep={currentStep}
            onStepClick={handleStepClick}
            category={formData.category}
          />
        </nav>

        {/* Main Step Card */}
        <div className="bg-surface rounded-3xl border border-border/90 p-6 sm:p-8 shadow-pb-card relative overflow-hidden">
          {/* Animated Step Container */}
          <div 
            className="min-h-[380px]" 
            role="region" 
            aria-label={`Donation form step ${currentStep + 1} of ${STEPS.length}: ${STEPS[currentStep].title}`} 
            aria-live="polite"
          >
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
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
                    onValidationChange={handleStepValidation}
                    pickupLocation={formData.pickupAddress}
                  />
                )}
                {currentStep === 5 && (
                  <Step5Review
                    formData={formData}
                    onEditStep={handleEditStep}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Submission Error Alert */}
          {errors.submit && (
            <div className="mt-6 p-4 rounded-2xl bg-danger-soft/50 border border-danger/30 flex items-center gap-2.5 text-danger text-xs font-semibold">
              <XCircle size={16} className="shrink-0" />
              <span>{errors.submit}</span>
            </div>
          )}

          {/* Navigation Controls Dock */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-border">
            {/* Previous Button */}
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`
                flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold transition-all duration-200 text-xs sm:text-sm
                ${currentStep === 0
                  ? 'bg-page text-text-muted cursor-not-allowed opacity-40'
                  : 'bg-page border border-border text-text-primary hover:bg-surface-hover hover:border-dash-primary/40 shadow-2xs'
                }
              `}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            {/* Right Action Cluster */}
            <div className="flex items-center gap-3">
              {currentStep < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canGoNext}
                  className="flex items-center gap-2 px-5 sm:px-6 py-2.5 bg-dash-primary hover:bg-dash-primary-hover text-white rounded-xl font-bold transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2"
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="flex items-center gap-2 px-6 sm:px-8 py-2.5 bg-gradient-to-r from-dash-primary to-emerald-600 hover:from-dash-primary-hover hover:to-emerald-500 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Transmitting Request...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      <span>{isEditMode ? 'Update Donation' : 'Confirm & Submit Donation'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Celebratory Submission Result Modal */}
        {submissionResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]">
            <div className="bg-surface rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-border animate-[modalIn_0.25s_ease]">
              {submissionResult.success ? (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-500/10">
                    <CheckCircle size={32} className="stroke-[2.5]" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 inline-block mb-2">
                    Submission Confirmed
                  </span>
                  <h3 className="text-2xl font-black text-text-primary mb-2 tracking-tight">
                    {submissionResult.isUpdate ? 'Donation Updated!' : 'Thank You for Giving!'}
                  </h3>
                  <p className="text-xs sm:text-sm text-text-secondary mb-5 leading-relaxed">
                    {submissionResult.isUpdate 
                      ? 'Your donation updates have been applied successfully and synchronized with the volunteer dispatch.'
                      : 'Your donation request is live! Nearby verified volunteers have been alerted for pickup coordination.'
                    }
                  </p>

                  {/* Reference ID copy chip */}
                  <div className="p-3.5 rounded-2xl bg-page border border-border flex items-center justify-between gap-3 mb-6">
                    <div className="text-left">
                      <p className="text-[10px] uppercase font-bold text-text-muted">Tracking Reference</p>
                      <p className="text-sm font-mono font-bold text-text-primary">
                        #DON-{submissionResult.donationId}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyId(submissionResult.donationId)}
                      className="px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-semibold hover:border-dash-primary text-text-secondary hover:text-dash-primary transition-all flex items-center gap-1.5 shadow-2xs"
                    >
                      {copiedId ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                      {copiedId ? 'Copied!' : 'Copy ID'}
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={handleViewDonation}
                      className="w-full px-4 py-3 bg-dash-primary hover:bg-dash-primary-hover text-white font-bold rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm"
                    >
                      <span>Track Donation Status</span>
                      <ArrowRight size={16} />
                    </button>
                    {!submissionResult.isUpdate && (
                      <button
                        type="button"
                        onClick={handleCreateAnother}
                        className="w-full px-4 py-2.5 bg-surface border border-border text-text-primary font-bold rounded-xl hover:bg-surface-hover transition-all text-xs"
                      >
                        Create Another Donation
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleReturnDashboard}
                      className="w-full px-4 py-2 text-text-muted hover:text-text-primary text-xs font-semibold transition-colors"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-danger-soft text-danger flex items-center justify-center shadow-lg shadow-danger/20 ring-4 ring-danger/10">
                    <XCircle size={32} />
                  </div>
                  <h3 className="text-xl font-black text-text-primary mb-2">
                    Submission Encountered an Issue
                  </h3>
                  <p className="text-xs text-text-secondary mb-6 leading-relaxed">
                    {submissionResult.error || 'An unexpected error occurred while transmitting your donation.'}
                  </p>
                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => setSubmissionResult(null)}
                      className="w-full px-4 py-3 bg-dash-primary hover:bg-dash-primary-hover text-white font-bold rounded-xl transition-all shadow-sm text-sm"
                    >
                      Try Again
                    </button>
                    <button
                      type="button"
                      onClick={handleReturnDashboard}
                      className="w-full px-4 py-2 text-text-muted hover:text-text-primary text-xs font-semibold transition-colors"
                    >
                      Return to Dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload Progress Overlay */}
        {isSubmitting && Object.keys(uploadProgress).length > 0 && (
          <div className="fixed bottom-6 right-6 bg-surface rounded-2xl shadow-xl p-4 border border-border max-w-xs z-50">
            <p className="text-xs font-bold text-text-primary mb-2 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-dash-primary" />
              Uploading Photos...
            </p>
            <div className="space-y-2">
              {Object.entries(uploadProgress).map(([id, progress]) => (
                <div key={id} className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-dash-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-text-secondary w-8 text-right">
                    {progress}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

