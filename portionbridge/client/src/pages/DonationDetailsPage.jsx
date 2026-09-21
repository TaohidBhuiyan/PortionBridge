import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  MapPin,
  Calendar,
  Phone,
  Package,
  Utensils,
  Shirt,
  Loader2,
  Star,
  HandHeart,
  CalendarClock,
  Truck,
  PackageCheck,
  CheckCircle2,
  Users,
  UserCircle2,
  Clock,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Leaf,
  Thermometer,
  AlertTriangle,
  Info,
  Sparkles,
  Layers,
  FileText,
  Activity,
  MessageCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { donationApi } from '../services/donationApi';
import { teamApi } from '../services/teamApi';
import { AssignMemberModal } from '../components/team/AssignMemberModal';
import { StatusBadge } from '../components/donation/StatusBadge';
import { StatusTimeline } from '../components/donation/StatusTimeline';
import { ImageGallery } from '../components/donation/ImageGallery';
import { VolunteerCard } from '../components/donation/VolunteerCard';
import { ActivityTimeline } from '../components/donation/ActivityTimeline';
import { ErrorState } from '../components/dashboard/ErrorState';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { LoadingSkeleton } from '../components/dashboard/skeletons/LoadingSkeleton';
import { CancelConfirmationModal } from '../components/common/CancelConfirmationModal';
import { SchedulePickupModal } from '../components/donation/SchedulePickupModal';
import { TrackingPanel } from '../components/donation/TrackingPanel';
import { ChatWindow } from '../components/donation/ChatWindow';
import { RatingSubmission } from '../components/donation/RatingSubmission';
import { ReportIssueModal } from '../components/donation/ReportIssueModal';
import { useDonationTracking } from '../hooks/useDonationTracking';
import { useAuth } from '../context/AuthContext';

/**
 * DonationDetailsPage - Central tracking page for a donation
 */
export function DonationDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [volunteerLocation, setVolunteerLocation] = useState(null);
  const [existingRating, setExistingRating] = useState(null);
  const [activityHistory, setActivityHistory] = useState([]);
  const [, setHistoryLoading] = useState(true);

  const [copiedId, setCopiedId] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const [actionInProgress, setActionInProgress] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [myTeamMembers, setMyTeamMembers] = useState([]);

  const loadDonationDetails = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await donationApi.getDonationDetails(id);

      if (result.success) {
        setDonation(result.data);
        if (result.data.rating) {
          setExistingRating(result.data.rating);
        }
      } else {
        if (result.status === 403 && result.error?.includes('Set your base address')) {
          setError('Set your base address first — this is what donors near you and the nearby-donation radius are both based on.');
        } else {
          setError(result.error);
        }
      }
    } catch {
      setError('Failed to load donation details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadDonationHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const result = await donationApi.getDonationHistory(id);
      if (result.success) {
        setActivityHistory(result.data || []);
      }
    } catch {
      setActivityHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDonationDetails();
    loadDonationHistory();
  }, [id, loadDonationDetails, loadDonationHistory]);

  useEffect(() => {
    if (!donation || donation.assignment_mode !== 'team' || currentUser?.role !== 'volunteer') {
      return;
    }
    let cancelled = false;
    teamApi.getMyTeam().then((result) => {
      if (!cancelled && result.success && result.data?.team?.id === donation.team_id) {
        setMyTeamMembers(result.data.team.members || []);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [donation?.assignment_mode, donation?.team_id, currentUser?.role]);

  // Real-time tracking
  useDonationTracking(id, {
    onStatusUpdate: () => {
      loadDonationDetails();
    },
    onLocationUpdate: (data) => {
      setVolunteerLocation({
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: data.timestamp,
      });
    },
  });

  const handleCopy = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      toast.success('Donation ID copied!');
      setTimeout(() => setCopiedId(false), 2000);
    } else if (type === 'phone') {
      setCopiedPhone(true);
      toast.success('Phone number copied!');
      setTimeout(() => setCopiedPhone(false), 2000);
    } else if (type === 'address') {
      setCopiedAddress(true);
      toast.success('Address copied!');
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const handleCancel = async () => {
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    setShowCancelModal(false);
    setCancelling(true);

    try {
      const result = await donationApi.cancelDonation(id);

      if (result.success) {
        toast.success('Donation cancelled.');
        loadDonationDetails();
      } else {
        toast.error(result.error || 'Failed to cancel donation');
      }
    } catch {
      toast.error('Failed to cancel donation. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const handleEdit = () => {
    navigate(`/donation/create?edit=${id}`);
  };

  const handleAccept = async () => {
    if (actionInProgress) return;
    setActionInProgress(true);

    const result = await donationApi.acceptDonation(id);

    if (result.success) {
      toast.success('Donation accepted! This is now your active mission.');
      loadDonationDetails();
    } else if (result.status === 409) {
      toast.error('This donation is no longer available.');
      loadDonationDetails();
    } else if (result.status === 401) {
      toast.error('Your session has expired. Please log in again.');
    } else if (result.status === 403) {
      toast.error("You don't have permission to accept this donation.");
    } else {
      toast.error(result.error || 'Failed to accept donation. Please try again.');
    }

    setActionInProgress(false);
  };

  const handleScheduleConfirm = async (scheduledAtIso) => {
    if (actionInProgress) return;
    setActionInProgress(true);

    const result = await donationApi.schedulePickup(id, scheduledAtIso);

    if (result.success) {
      toast.success('Pickup scheduled.');
      setShowScheduleModal(false);
      loadDonationDetails();
    } else if (result.status === 409) {
      toast.error(result.error || 'This donation can no longer be scheduled.');
      setShowScheduleModal(false);
      loadDonationDetails();
    } else {
      toast.error(result.error || 'Failed to schedule pickup. Please try again.');
    }

    setActionInProgress(false);
  };

  const handleMarkOnTheWay = async () => {
    if (actionInProgress) return;
    setActionInProgress(true);

    const result = await donationApi.markOnTheWay(id);

    if (result.success) {
      toast.success('Marked as on the way.');
      loadDonationDetails();
    } else if (result.status === 409) {
      toast.error(result.error || 'This donation can no longer be updated.');
      loadDonationDetails();
    } else {
      toast.error(result.error || 'Failed to update status. Please try again.');
    }

    setActionInProgress(false);
  };

  const handleMarkPickedUp = async () => {
    if (actionInProgress) return;
    setActionInProgress(true);

    const result = await donationApi.markPickedUp(id);

    if (result.success) {
      toast.success('Marked as picked up.');
      loadDonationDetails();
    } else if (result.status === 409) {
      toast.error(result.error || 'This donation can no longer be updated.');
    } else {
      toast.error(result.error || 'Failed to update status. Please try again.');
    }

    setActionInProgress(false);
  };

  const handleMarkCompleted = async () => {
    if (actionInProgress) return;
    setActionInProgress(true);

    const result = await donationApi.completeDonation(id);

    if (result.success) {
      toast.success('Donation completed! Thank you for your generosity.');
      loadDonationDetails();
    } else {
      toast.error(result.error || 'Failed to complete donation. Please try again.');
    }

    setActionInProgress(false);
  };

  const handleRatingSubmitted = (rating) => {
    setExistingRating(rating);
    loadDonationDetails();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingSkeleton />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <ErrorState
          title="Failed to load donation"
          message={error}
          onRetry={loadDonationDetails}
        />
      </DashboardLayout>
    );
  }

  if (!donation) {
    return (
      <DashboardLayout>
        <ErrorState
          title="Donation not found"
          message="The donation you're looking for doesn't exist or you don't have permission to view it."
        />
      </DashboardLayout>
    );
  }

  const {
    title,
    id: donationId,
    status,
    category,
    created_at,
    description,
    quantity,
    quantity_unit,
    photo,
    images,
    pickup_address_details,
    pickup_date,
    pickup_time_slot,
    contact_phone,
    special_instructions,
    food_type,
    food_name,
    ingredients,
    allergens,
    storage_requirement,
    is_vegetarian,
    is_halal,
    expiry_date,
    clothing_category,
    gender,
    age_group,
    item_condition,
    brand,
    size,
    color,
    season,
    volunteer_id,
    volunteer_name,
    volunteer_photo,
    team_name,
    assignment_mode,
    team_id,
    assigned_member_id,
    assigned_member_name,
  } = donation;

  const volunteer = volunteer_name ? {
    name: volunteer_name,
    profile_photo: volunteer_photo,
    team_name,
  } : null;

  const isTeamMission = assignment_mode === 'team';
  const isVolunteerAssigned = Boolean(volunteer_id) && status !== 'pending';

  const isLeaderOfDonationTeam = isTeamMission && myTeamMembers.some(
    (m) => m.role === 'leader' && m.user_id === currentUser?.id
  );
  const ASSIGNABLE_MISSION_STATUSES = ['accepted', 'scheduled', 'on_the_way'];
  const canAssignMember = isLeaderOfDonationTeam && ASSIGNABLE_MISSION_STATUSES.includes(status);

  const handleAssignMember = async (memberId) => {
    setAssigning(true);
    const result = await donationApi.assignTeamMember(donationId, team_id, memberId);
    if (result.success) {
      toast.success('Pickup member assigned.');
      setShowAssignModal(false);
      loadDonationDetails();
    } else {
      toast.error(result.error || 'Failed to assign pickup member.');
    }
    setAssigning(false);
  };

  const activities = activityHistory;

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const canEdit = status === 'pending';
  const canCancel = status === 'pending';

  const isVolunteer = currentUser?.role === 'volunteer';
  const isAssignedVolunteer = isVolunteer && (
    isTeamMission
      ? assigned_member_id === currentUser?.id
      : volunteer_id === currentUser?.id
  );
  const isDonorOwner = currentUser?.role === 'donor' && (donation.donor_id === currentUser?.id || currentUser?.id);
  const canAccept = isVolunteer && status === 'pending';
  const canSchedule = isAssignedVolunteer && status === 'accepted';
  const canMarkOnTheWay = isAssignedVolunteer && status === 'scheduled';
  const canMarkPickedUp = isAssignedVolunteer && status === 'on_the_way';
  const canComplete = (isDonorOwner || currentUser?.role === 'donor') && status === 'picked_up';

  const fullAddress = pickup_address_details?.fullAddress || '';

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-dash-primary shadow-pb-subtle"
          >
            <ArrowLeft size={14} />
            <span>Back to Donations</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Clock size={13} />
            <span>Created {formatDate(created_at)}</span>
          </div>
        </div>

        {/* Hero Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-surface border border-border p-6 sm:p-7 shadow-pb-card">
          <div className="absolute top-0 right-0 w-96 h-96 bg-dash-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${
                category === 'food' 
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' 
                  : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
              }`}>
                {category === 'food' ? <Utensils size={26} /> : <Shirt size={26} />}
              </div>

              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight truncate">
                    {title}
                  </h1>
                  <StatusBadge status={status} size="medium" />
                </div>

                <div className="flex items-center gap-3 text-xs text-text-secondary flex-wrap">
                  <button
                    onClick={() => handleCopy(donationId, 'id')}
                    className="inline-flex items-center gap-1.5 font-mono px-2.5 py-1 rounded-lg bg-page border border-border hover:border-dash-primary text-text-primary transition-colors group"
                    title="Click to copy ID"
                  >
                    <span className="font-semibold text-text-muted">ID:</span>
                    <span>#{donationId}</span>
                    {copiedId ? <Check size={12} className="text-success" /> : <Copy size={12} className="text-text-muted group-hover:text-dash-primary" />}
                  </button>

                  <span className="text-border">•</span>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-page border border-border font-semibold text-text-primary capitalize">
                    {category}
                  </span>

                  <span className="text-border">•</span>

                  <span className="inline-flex items-center gap-1 text-text-primary font-medium">
                    <Package size={13} className="text-dash-primary" />
                    {quantity} {quantity_unit}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-2.5 flex-wrap self-start md:self-center">
              {canEdit && (
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-surface border border-border text-text-primary hover:bg-surface-hover transition-all focus:outline-none focus:ring-2 focus:ring-dash-primary shadow-pb-subtle"
                >
                  <Edit size={14} />
                  Edit Request
                </button>
              )}

              {canCancel && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-danger-soft text-danger hover:bg-danger/10 border border-danger/20 transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-danger shadow-pb-subtle"
                >
                  {cancelling ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Cancel Request
                </button>
              )}

              {/* Volunteer Mission Primary Actions */}
              {canAccept && (
                <button
                  onClick={handleAccept}
                  disabled={actionInProgress}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-dash-primary text-white hover:bg-dash-primary-hover shadow-pb-elevated transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-dash-primary"
                >
                  {actionInProgress ? <Loader2 size={14} className="animate-spin" /> : <HandHeart size={15} />}
                  {actionInProgress ? 'Accepting...' : 'Accept Mission'}
                </button>
              )}

              {canSchedule && (
                <button
                  onClick={() => setShowScheduleModal(true)}
                  disabled={actionInProgress}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-dash-primary text-white hover:bg-dash-primary-hover shadow-pb-elevated transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-dash-primary"
                >
                  <CalendarClock size={15} />
                  Schedule Pickup
                </button>
              )}

              {canMarkOnTheWay && (
                <button
                  onClick={handleMarkOnTheWay}
                  disabled={actionInProgress}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-dash-primary text-white hover:bg-dash-primary-hover shadow-pb-elevated transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-dash-primary"
                >
                  {actionInProgress ? <Loader2 size={14} className="animate-spin" /> : <Truck size={15} />}
                  {actionInProgress ? 'Updating...' : 'Mark On The Way'}
                </button>
              )}

              {canMarkPickedUp && (
                <button
                  onClick={handleMarkPickedUp}
                  disabled={actionInProgress}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-dash-primary text-white hover:bg-dash-primary-hover shadow-pb-elevated transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-dash-primary"
                >
                  {actionInProgress ? <Loader2 size={14} className="animate-spin" /> : <PackageCheck size={15} />}
                  {actionInProgress ? 'Updating...' : 'Mark Picked Up'}
                </button>
              )}

              {canComplete && (
                <button
                  onClick={handleMarkCompleted}
                  disabled={actionInProgress}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-pb-elevated transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {actionInProgress ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  {actionInProgress ? 'Completing...' : 'Confirm Pickup & Complete'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column — Core Details */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Donation Overview */}
            <SectionCard title="Donation Overview" icon={FileText}>
              <div className="space-y-5">
                {/* Description Callout */}
                <div className="p-4 rounded-xl bg-page/70 border border-border text-text-primary text-sm leading-relaxed">
                  <p className="font-normal">{description || 'No additional description provided.'}</p>
                </div>

                {/* Quantity Chip */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dash-primary-soft text-dash-primary text-xs font-bold">
                  <Package size={15} />
                  <span>Quantity: {quantity} {quantity_unit}</span>
                </div>

                {/* Food Category Specifications */}
                {category === 'food' && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                      <Sparkles size={12} className="text-amber-500" /> Food Attributes & Safety
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {food_type && (
                        <SpecChip label="Food Type" value={food_type} icon={Utensils} capitalize />
                      )}
                      {food_name && (
                        <SpecChip label="Item Name" value={food_name} icon={Package} />
                      )}
                      {storage_requirement && (
                        <SpecChip label="Storage Requirement" value={storage_requirement} icon={Thermometer} capitalize tone="info" />
                      )}
                      {expiry_date && (
                        <SpecChip label="Expiry Date" value={formatDate(expiry_date)} icon={Clock} tone="warning" />
                      )}
                    </div>

                    {/* Dietary Badges */}
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      {is_halal !== undefined && is_halal && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                          <ShieldCheck size={14} /> Halal Certified
                        </span>
                      )}
                      {is_vegetarian !== undefined && is_vegetarian && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 text-xs font-bold">
                          <Leaf size={14} /> Vegetarian
                        </span>
                      )}
                    </div>

                    {/* Ingredients & Allergens Callouts */}
                    {ingredients && (
                      <div className="p-3.5 rounded-xl bg-info-soft/40 border border-info/20 text-xs text-text-primary flex items-start gap-2.5">
                        <Info size={16} className="text-info shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-info block mb-0.5">Ingredients:</span>
                          <p>{ingredients}</p>
                        </div>
                      </div>
                    )}

                    {allergens && (
                      <div className="p-3.5 rounded-xl bg-warning-soft/50 border border-warning/30 text-xs text-text-primary flex items-start gap-2.5">
                        <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-warning block mb-0.5">Allergen Notice:</span>
                          <p>{allergens}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Clothes Category Specifications */}
                {category === 'clothes' && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                      <Sparkles size={12} className="text-indigo-500" /> Clothing Item Details
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {clothing_category && <SpecChip label="Category" value={clothing_category} icon={Shirt} capitalize />}
                      {gender && <SpecChip label="Gender" value={gender} capitalize />}
                      {age_group && <SpecChip label="Age Group" value={age_group} capitalize />}
                      {item_condition && <SpecChip label="Condition" value={item_condition} capitalize tone="success" />}
                      {brand && <SpecChip label="Brand" value={brand} />}
                      {size && <SpecChip label="Size" value={size} capitalize />}
                      {color && <SpecChip label="Color" value={color} />}
                      {season && <SpecChip label="Season" value={season} capitalize />}
                    </div>
                  </div>
                )}

                {/* Special Instructions */}
                {special_instructions && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Special Instructions</p>
                    <div className="p-3.5 rounded-xl bg-page border border-border text-xs text-text-primary leading-relaxed italic">
                      "{special_instructions}"
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Pickup Information */}
            <SectionCard title="Pickup & Contact Information" icon={MapPin}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Address Card */}
                <div className="p-4 rounded-xl bg-page/70 border border-border shadow-pb-subtle space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-dash-primary flex items-center gap-1">
                      <MapPin size={12} /> Address
                    </span>
                    {fullAddress && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopy(fullAddress, 'address')}
                          className="p-1 rounded text-text-muted hover:text-dash-primary transition-colors"
                          title="Copy address"
                        >
                          {copiedAddress ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                        </button>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded text-text-muted hover:text-dash-primary transition-colors"
                          title="Open in Google Maps"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-text-primary leading-snug">
                    {fullAddress || 'Address not specified'}
                  </p>

                  {pickup_address_details && (
                    <p className="text-[11px] text-text-muted pt-1">
                      {pickup_address_details.area}, {pickup_address_details.district}, {pickup_address_details.division}
                    </p>
                  )}
                </div>

                {/* Date & Time Slot */}
                <div className="p-4 rounded-xl bg-page/70 border border-border shadow-pb-subtle space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-dash-primary flex items-center gap-1">
                    <Calendar size={12} /> Schedule
                  </span>

                  <div>
                    <p className="text-xs font-semibold text-text-primary">
                      {pickup_date ? formatDate(pickup_date) : 'Date not specified'}
                    </p>
                    {pickup_time_slot && (
                      <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full bg-info-soft text-info text-[11px] font-semibold">
                        Time Slot: {pickup_time_slot}
                      </span>
                    )}
                  </div>
                </div>

                {/* Phone Contact */}
                {contact_phone && (
                  <div className="md:col-span-2 p-3.5 rounded-xl bg-page/70 border border-border shadow-pb-subtle flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                        <Phone size={15} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Contact Phone</p>
                        <p className="text-xs font-bold text-text-primary">{contact_phone}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(contact_phone, 'phone')}
                        className="px-2.5 py-1 rounded-lg bg-surface border border-border text-xs font-medium text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1"
                      >
                        {copiedPhone ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                        <span>Copy</span>
                      </button>
                      <a
                        href={`tel:${contact_phone}`}
                        className="px-3 py-1 rounded-lg bg-dash-primary text-white text-xs font-bold hover:bg-dash-primary-hover transition-colors"
                      >
                        Call Now
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Donation Images */}
            <SectionCard title="Donation Images" icon={Shirt}>
              <ImageGallery 
                coverImage={photo} 
                images={images || []} 
              />
            </SectionCard>

            {/* Chronological Activity Timeline */}
            <SectionCard title="Activity History" icon={Activity}>
              <ActivityTimeline activities={activities} />
            </SectionCard>
          </div>

          {/* Right Sidebar Column */}
          <div className="space-y-6">
            {/* Status Timeline */}
            <SectionCard title="Lifecycle Progression" icon={Layers}>
              <StatusTimeline currentStatus={status} donation={donation} />
            </SectionCard>

            {/* Live Tracking Panel */}
            {(status === 'scheduled' || status === 'on_the_way' || status === 'picked_up') && (
              <SectionCard title="Live Pickup Tracking" icon={Truck}>
                <TrackingPanel
                  donation={donation}
                  volunteer={volunteer}
                  volunteerLocation={volunteerLocation}
                />
              </SectionCard>
            )}

            {/* Volunteer Information */}
            <SectionCard title="Assigned Volunteer" icon={UserCircle2}>
              {isTeamMission && (
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold uppercase tracking-wide border border-indigo-500/20">
                    <Users size={11} /> Team Mission{team_name ? ` · ${team_name}` : ''}
                  </span>
                  <span
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      assigned_member_name
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    }`}
                  >
                    <UserCircle2 size={11} />
                    {assigned_member_name ? `Pickup: ${assigned_member_name}` : 'Pickup Member: Unassigned'}
                  </span>
                  {canAssignMember && (
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-dash-primary text-dash-primary text-[11px] font-bold hover:bg-dash-primary-soft transition-colors"
                    >
                      <UserCircle2 size={11} />
                      {assigned_member_name ? 'Reassign' : 'Assign Member'}
                    </button>
                  )}
                </div>
              )}
              <VolunteerCard volunteer={volunteer} />
            </SectionCard>

            {isLeaderOfDonationTeam && (
              <AssignMemberModal
                isOpen={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                onAssign={handleAssignMember}
                members={myTeamMembers}
                currentAssignedId={assigned_member_id}
                assigning={assigning}
              />
            )}

            {/* Chat Window */}
            {isVolunteerAssigned && (
              <SectionCard title="Live Chat with Volunteer" icon={MessageCircle}>
                <ChatWindow donation={donation} currentUser={currentUser} />
              </SectionCard>
            )}

            {/* Rating Submission */}
            {status === 'completed' && !existingRating && currentUser?.role === 'donor' && (
              <SectionCard title="Rate Experience" icon={Star}>
                <RatingSubmission 
                  donation={donation} 
                  onRatingSubmitted={handleRatingSubmitted}
                />
              </SectionCard>
            )}

            {/* Existing Rating Display */}
            {existingRating && (
              <SectionCard title="Your Rating" icon={Star}>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-warning-soft/30 border border-warning/20">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={18}
                        className={`${
                          star <= existingRating.stars
                            ? 'text-warning fill-warning'
                            : 'text-border'
                        }`}
                      />
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-primary">
                      {existingRating.stars} / 5 Stars
                    </p>
                    <p className="text-[10px] text-text-muted">
                      Rated on {formatDate(existingRating.created_at)}
                    </p>
                  </div>
                </div>
                {existingRating.comment && (
                  <p className="mt-3 text-xs text-text-primary italic p-3 rounded-lg bg-page border border-border">
                    "{existingRating.comment}"
                  </p>
                )}
              </SectionCard>
            )}

            {/* Report an Issue Link */}
            {status !== 'pending' && (currentUser?.role === 'donor' || isAssignedVolunteer) && (
              <div className="text-center pt-2">
                <button
                  onClick={() => setShowReportModal(true)}
                  className="text-xs text-text-muted hover:text-danger transition-colors underline underline-offset-4 font-medium"
                >
                  Report an issue with this donation
                </button>
              </div>
            )}
          </div>
        </div>

        {showReportModal && (
          <ReportIssueModal
            donationId={id}
            onClose={() => setShowReportModal(false)}
          />
        )}

        {/* Cancel Confirmation Modal */}
        <CancelConfirmationModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={confirmCancel}
          donationTitle={title}
          isLoading={cancelling}
        />

        {/* Schedule Pickup Modal */}
        <SchedulePickupModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          onConfirm={handleScheduleConfirm}
          donationTitle={title}
          isLoading={actionInProgress}
        />
      </div>
    </DashboardLayout>
  );
}

/**
 * SectionCard component with header icon and card styling
 */
function SectionCard({ title, icon: Icon, action, children }) {
  return (
    <div className="bg-surface rounded-2xl border border-border shadow-pb-card overflow-hidden transition-all duration-200 hover:shadow-pb-elevated">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-page/40">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="w-7 h-7 rounded-lg bg-dash-primary-soft text-dash-primary flex items-center justify-center shrink-0">
              <Icon size={15} />
            </div>
          )}
          <h2 className="text-sm font-bold text-text-primary tracking-tight">{title}</h2>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/**
 * SpecChip helper for rendering specification key-value pills
 */
function SpecChip({ label, value, icon: Icon, capitalize = false, tone = 'default' }) {
  const toneClasses = {
    default: 'bg-page/70 border-border text-text-primary',
    info: 'bg-info-soft/60 border-info/20 text-info',
    warning: 'bg-warning-soft/60 border-warning/20 text-warning',
    success: 'bg-success-soft/60 border-success/20 text-success',
  };

  const formattedValue = typeof value === 'string' ? value.replace(/_/g, ' ') : value;

  return (
    <div className={`p-2.5 rounded-xl border ${toneClasses[tone]} space-y-0.5`}>
      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1">
        {Icon && <Icon size={12} className="shrink-0 text-dash-primary" />}
        {label}
      </span>
      <p className={`text-xs font-semibold ${capitalize ? 'capitalize' : ''}`}>
        {formattedValue}
      </p>
    </div>
  );
}


