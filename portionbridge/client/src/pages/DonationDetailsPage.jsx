import { useState, useEffect } from 'react';
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
  Star
} from 'lucide-react';
import { donationApi } from '../services/donationApi';
import { StatusBadge } from '../components/donation/StatusBadge';
import { StatusTimeline } from '../components/donation/StatusTimeline';
import { ImageGallery } from '../components/donation/ImageGallery';
import { VolunteerCard } from '../components/donation/VolunteerCard';
import { ActivityTimeline } from '../components/donation/ActivityTimeline';
import { ErrorState } from '../components/dashboard/ErrorState';
import { LoadingSkeleton } from '../components/dashboard/skeletons/LoadingSkeleton';
import { CancelConfirmationModal } from '../components/common/CancelConfirmationModal';
import { TrackingPanel } from '../components/donation/TrackingPanel';
import { ChatWindow } from '../components/donation/ChatWindow';
import { RatingSubmission } from '../components/donation/RatingSubmission';
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

  const loadDonationDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await donationApi.getDonationDetails(id);

      if (result.success) {
        setDonation(result.data.donation);
        // Check if donation has existing rating
        if (result.data.donation.rating) {
          setExistingRating(result.data.donation.rating);
        }
      } else {
        setError(result.error);
      }
    } catch {
      setError('Failed to load donation details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // loadDonationDetails is also called from real-time update handlers and
    // post-action callbacks below, so it can't be inlined into this effect
    // alone — it has to stay a shared function. It's intentionally excluded
    // from the dependency array since it's stable in practice and including
    // it would risk a re-render loop given it's redefined each render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDonationDetails();
  }, [id]);

  // Real-time tracking
  useDonationTracking(id, {
    onStatusUpdate: () => {
      loadDonationDetails(); // Reload donation details on status change
    },
    onLocationUpdate: (data) => {
      setVolunteerLocation({
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: data.timestamp,
      });
    },
  });

  const handleCancel = async () => {
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    setShowCancelModal(false);
    setCancelling(true);

    try {
      const result = await donationApi.cancelDonation(id);

      if (result.success) {
        loadDonationDetails();
      } else {
        alert(result.error || 'Failed to cancel donation');
      }
    } catch {
      alert('Failed to cancel donation. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const handleEdit = () => {
    navigate(`/donation/create?edit=${id}`);
  };

  const handleRatingSubmitted = (rating) => {
    setExistingRating(rating);
    loadDonationDetails(); // Reload to get updated donation details
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load donation"
        message={error}
        onRetry={loadDonationDetails}
      />
    );
  }

  if (!donation) {
    return (
      <ErrorState
        title="Donation not found"
        message="The donation you're looking for doesn't exist or you don't have permission to view it."
      />
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
    // Food specific
    food_type,
    food_name,
    ingredients,
    allergens,
    storage_requirement,
    is_vegetarian,
    is_halal,
    expiry_date,
    // Clothes specific
    clothing_category,
    gender,
    age_group,
    item_condition,
    brand,
    size,
    color,
    season,
    // Volunteer
    volunteer_id,
    volunteer_name,
    volunteer_photo,
    team_name,
  } = donation;

  // Only real fields — no fabricated rating, completed-pickup count, or
  // status message. VolunteerCard renders gracefully without rating/
  // completed_pickups when they're not provided.
  const volunteer = volunteer_name ? {
    name: volunteer_name,
    profile_photo: volunteer_photo,
    team_name,
  } : null;

  const isVolunteerAssigned = Boolean(volunteer_id) && status !== 'pending';

  // A real, sparse timeline built only from timestamp columns the backend
  // actually stores (created_at, accepted_at, scheduled_at, completed_at).
  // Intermediate statuses (on_the_way, picked_up) have no dedicated
  // timestamp column, so no entry is fabricated for them — the status
  // timeline above already conveys current stage.
  const activities = generateRealTimeline(donation);

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
  // Matches the backend's assertEditable check exactly: cancellation (and
  // editing) is only allowed while a donation is still 'pending'. The
  // previous version also allowed 'accepted', which the backend would
  // always reject with a 409.
  const canCancel = status === 'pending';

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-3 focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2 rounded-lg px-2 py-1 text-sm"
        >
          <ArrowLeft size={16} />
          <span className="font-medium">Back</span>
        </button>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-semibold text-text-primary">
                {title}
              </h1>
              <StatusBadge status={status} />
            </div>
            <p className="text-sm text-text-secondary">
              ID: #{donationId} • Created {formatDate(created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-surface border border-border text-text-primary hover:bg-surface-hover transition-colors focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2"
              >
                <Edit size={15} />
                Edit
              </button>
            )}
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-danger-soft text-danger hover:opacity-80 transition-opacity disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2"
              >
                {cancelling ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                Cancel
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="xl:col-span-2 space-y-6">
          {/* Donation Overview */}
          <SectionCard title="Donation Overview">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                {category === 'food' ? <Utensils size={16} /> : <Shirt size={16} />}
                <span className="capitalize">{category}</span>
              </div>
              
              <p className="text-text-primary">{description}</p>
              
              <div className="flex items-center gap-2 text-sm">
                <Package size={16} className="text-text-secondary" />
                <span className="text-text-primary">
                  {quantity} {quantity_unit}
                </span>
              </div>

              {category === 'food' && (
                <div className="space-y-2 pt-4 border-t border-border">
                  {food_type && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-text-secondary w-24 shrink-0">Type:</span>
                      <span className="text-text-primary capitalize">{food_type}</span>
                    </div>
                  )}
                  {food_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-text-secondary w-24 shrink-0">Name:</span>
                      <span className="text-text-primary">{food_name}</span>
                    </div>
                  )}
                  {ingredients && (
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-text-secondary w-24 shrink-0">Ingredients:</span>
                      <span className="text-text-primary">{ingredients}</span>
                    </div>
                  )}
                  {allergens && (
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-text-secondary w-24 shrink-0">Allergens:</span>
                      <span className="text-text-primary">{allergens}</span>
                    </div>
                  )}
                  {storage_requirement && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-text-secondary w-24 shrink-0">Storage:</span>
                      <span className="text-text-primary capitalize">{storage_requirement}</span>
                    </div>
                  )}
                  {expiry_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-text-secondary w-24 shrink-0">Expiry:</span>
                      <span className="text-text-primary">{formatDate(expiry_date)}</span>
                    </div>
                  )}
                  {is_vegetarian !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-text-secondary w-24 shrink-0">Vegetarian:</span>
                      <span className="text-text-primary">{is_vegetarian ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                  {is_halal !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-text-secondary w-24 shrink-0">Halal:</span>
                      <span className="text-text-primary">{is_halal ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                </div>
              )}

              {category === 'clothes' && (
                <div className="space-y-2 pt-4 border-t border-border">
                  {clothing_category && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-text-secondary w-24 shrink-0">Category:</span>
                      <span className="text-text-primary capitalize">{clothing_category}</span>
                    </div>
                  )}
                  {gender && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-text-secondary w-24 shrink-0">Gender:</span>
                      <span className="text-text-primary capitalize">{gender}</span>
                    </div>
                  )}
                  {age_group && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-text-secondary w-24 shrink-0">Age Group:</span>
                      <span className="text-text-primary capitalize">{age_group}</span>
                    </div>
                  )}
                  {item_condition && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-text-secondary w-24 shrink-0">Condition:</span>
                      <span className="text-text-primary capitalize">{item_condition}</span>
                    </div>
                  )}
                  {brand && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-text-secondary w-24 shrink-0">Brand:</span>
                      <span className="text-text-primary">{brand}</span>
                    </div>
                  )}
                  {size && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-text-secondary w-24 shrink-0">Size:</span>
                      <span className="text-text-primary capitalize">{size}</span>
                    </div>
                  )}
                  {color && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-text-secondary w-24 shrink-0">Color:</span>
                      <span className="text-text-primary">{color}</span>
                    </div>
                  )}
                  {season && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-text-secondary w-24 shrink-0">Season:</span>
                      <span className="text-text-primary capitalize">{season}</span>
                    </div>
                  )}
                </div>
              )}

              {special_instructions && (
                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-text-secondary mb-1">Special Instructions:</p>
                  <p className="text-text-primary">{special_instructions}</p>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Pickup Information */}
          <SectionCard title="Pickup Information">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-text-secondary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-text-primary">
                    {pickup_address_details?.fullAddress || 'Address not specified'}
                  </p>
                  {pickup_address_details && (
                    <p className="text-sm text-text-secondary mt-1">
                      {pickup_address_details.area}, {pickup_address_details.district}, {pickup_address_details.division}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-text-secondary flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-text-primary">
                    {pickup_date ? formatDate(pickup_date) : 'Date not specified'}
                  </p>
                  {pickup_time_slot && (
                    <p className="text-sm text-text-secondary">
                      Time slot: {pickup_time_slot}
                    </p>
                  )}
                </div>
              </div>

              {contact_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-text-secondary flex-shrink-0" />
                  <p className="text-text-primary">{contact_phone}</p>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Images */}
          <SectionCard title="Donation Images">
            <ImageGallery 
              coverImage={photo} 
              images={images || []} 
            />
          </SectionCard>

          {/* Timeline — built only from real timestamp columns */}
          <SectionCard title="Timeline">
            <ActivityTimeline activities={activities} />
          </SectionCard>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Status Timeline — always visible, shows the real lifecycle stage */}
          <SectionCard title="Status Timeline">
            <StatusTimeline currentStatus={status} />
          </SectionCard>

          {/* Live Tracking Panel - real socket-driven data, honest fallbacks */}
          {(status === 'scheduled' || status === 'on_the_way' || status === 'picked_up') && (
            <SectionCard title="Live Tracking">
              <TrackingPanel
                donation={donation}
                volunteer={volunteer}
                volunteerLocation={volunteerLocation}
              />
            </SectionCard>
          )}

          {/* Volunteer Information */}
          <SectionCard title="Volunteer">
            <VolunteerCard volunteer={volunteer} />
          </SectionCard>

          {/* Chat Window - Only show when volunteer is assigned */}
          {isVolunteerAssigned && (
            <SectionCard title="Chat with Volunteer">
              <ChatWindow donation={donation} currentUser={currentUser} />
            </SectionCard>
          )}

          {/* Rating Submission - Only show when donation is completed and user hasn't rated */}
          {status === 'completed' && !existingRating && currentUser?.role === 'donor' && (
            <SectionCard title="Rate Your Experience">
              <RatingSubmission 
                donation={donation} 
                onRatingSubmitted={handleRatingSubmitted}
              />
            </SectionCard>
          )}

          {/* Existing Rating Display - Show if user has already rated */}
          {existingRating && (
            <SectionCard title="Your Rating">
              <div className="flex items-center gap-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={20}
                      className={`${
                        star <= existingRating.stars
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-border'
                      }`}
                    />
                  ))}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {existingRating.stars} / 5
                  </p>
                  <p className="text-xs text-text-secondary">
                    Rated on {formatDate(existingRating.created_at)}
                  </p>
                </div>
              </div>
              {existingRating.comment && (
                <p className="mt-3 text-text-primary text-sm italic">
                  "{existingRating.comment}"
                </p>
              )}
            </SectionCard>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <CancelConfirmationModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={confirmCancel}
        donationTitle={title}
        isLoading={cancelling}
      />
    </div>
  );
}

/**
 * SectionCard component for consistent section styling
 */
function SectionCard({ title, children }) {
  return (
    <div className="bg-surface rounded-xl border border-border p-5">
      <h2 className="text-sm font-semibold text-text-primary mb-3">{title}</h2>
      {children}
    </div>
  );
}

/**
 * Builds a small, real activity timeline from the only timestamp columns
 * the backend actually stores on a donation: created_at, accepted_at,
 * scheduled_at, completed_at. No entry is invented for statuses that don't
 * have a dedicated timestamp column (on_the_way, picked_up) — the status
 * timeline elsewhere on the page already conveys the current stage.
 */
function generateRealTimeline(donation) {
  const activities = [
    {
      type: 'created',
      title: 'Donation Created',
      description: 'You created this donation request',
      timestamp: donation.created_at,
    },
  ];

  if (donation.accepted_at) {
    activities.push({
      type: 'assigned',
      title: 'Volunteer Accepted',
      description: donation.volunteer_name
        ? `${donation.volunteer_name} accepted this donation`
        : 'A volunteer accepted this donation',
      timestamp: donation.accepted_at,
    });
  }

  if (donation.scheduled_at) {
    activities.push({
      type: 'scheduled',
      title: 'Pickup Scheduled',
      description: 'Pickup was scheduled for this donation',
      timestamp: donation.scheduled_at,
    });
  }

  if (donation.completed_at) {
    activities.push({
      type: 'status_change',
      title: 'Donation Completed',
      description: 'Donation has been successfully delivered',
      timestamp: donation.completed_at,
    });
  }

  return activities.reverse();
}
