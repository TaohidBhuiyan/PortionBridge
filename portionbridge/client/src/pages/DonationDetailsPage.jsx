import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Share2, 
  Printer,
  MapPin,
  Calendar,
  Phone,
  Package,
  Utensils,
  Shirt,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { donationApi } from '../services/donationApi';
import { StatusBadge } from '../components/donation/StatusBadge';
import { StatusTimeline } from '../components/donation/StatusTimeline';
import { ImageGallery } from '../components/donation/ImageGallery';
import { VolunteerCard } from '../components/donation/VolunteerCard';
import { ActivityTimeline } from '../components/donation/ActivityTimeline';
import { ErrorState } from '../components/dashboard/ErrorState';
import { CancelConfirmationModal } from '../components/common/CancelConfirmationModal';
import { TrackingPanel } from '../components/donation/TrackingPanel';
import { ChatWindow } from '../components/donation/ChatWindow';
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

  useEffect(() => {
    loadDonationDetails();
  }, [id]);

  // Real-time tracking
  useDonationTracking(id, {
    onStatusUpdate: (data) => {
      console.log('Status update received:', data);
      loadDonationDetails(); // Reload donation details on status change
    },
    onLocationUpdate: (data) => {
      console.log('Location update received:', data);
      setVolunteerLocation({
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: data.timestamp,
      });
    },
  });

  const loadDonationDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await donationApi.getDonationDetails(id);

      if (result.success) {
        setDonation(result.data.donation);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load donation details. Please try again.');
    } finally {
      setLoading(false);
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
        loadDonationDetails();
      } else {
        alert(result.error || 'Failed to cancel donation');
      }
    } catch (err) {
      alert('Failed to cancel donation. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const handleEdit = () => {
    navigate(`/donation/create?edit=${id}`);
  };

  const handleShare = () => {
    // Placeholder for share functionality
    alert('Share functionality coming soon');
  };

  const handlePrint = () => {
    // Placeholder for print functionality
    alert('Print functionality coming soon');
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
    updated_at,
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
    volunteer_name,
    volunteer_photo,
    team_name,
  } = donation;

  const volunteer = volunteer_name ? {
    name: volunteer_name,
    profile_photo: volunteer_photo,
    team_name,
    rating: 4.5,
    completed_pickups: 42,
    current_status: 'On the way to pickup',
  } : null;

  const isVolunteerAssigned = volunteer_id && status !== 'pending';

  const activities = generateMockActivities(donation);

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
  const canCancel = status === 'pending' || status === 'accepted';

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back</span>
        </button>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
              <StatusBadge status={status} />
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              ID: #{donationId} • Created {formatDate(created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Edit size={18} />
                Edit
              </button>
            )}
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-950/50 transition-colors disabled:opacity-50"
              >
                {cancelling ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                Cancel
              </button>
            )}
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Share2 size={18} />
              Share
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Printer size={18} />
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Donation Overview */}
          <SectionCard title="Donation Overview">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                {category === 'food' ? <Utensils size={16} /> : <Shirt size={16} />}
                <span className="capitalize">{category}</span>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300">{description}</p>
              
              <div className="flex items-center gap-2 text-sm">
                <Package size={16} className="text-gray-400 dark:text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  {quantity} {quantity_unit}
                </span>
              </div>

              {category === 'food' && (
                <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {food_type && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 dark:text-gray-400 w-24">Type:</span>
                      <span className="text-gray-700 dark:text-gray-300 capitalize">{food_type}</span>
                    </div>
                  )}
                  {food_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 dark:text-gray-400 w-24">Name:</span>
                      <span className="text-gray-700 dark:text-gray-300">{food_name}</span>
                    </div>
                  )}
                  {ingredients && (
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-gray-500 dark:text-gray-400 w-24">Ingredients:</span>
                      <span className="text-gray-700 dark:text-gray-300">{ingredients}</span>
                    </div>
                  )}
                  {allergens && (
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-gray-500 dark:text-gray-400 w-24">Allergens:</span>
                      <span className="text-gray-700 dark:text-gray-300">{allergens}</span>
                    </div>
                  )}
                  {storage_requirement && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 dark:text-gray-400 w-24">Storage:</span>
                      <span className="text-gray-700 dark:text-gray-300 capitalize">{storage_requirement}</span>
                    </div>
                  )}
                  {expiry_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 dark:text-gray-400 w-24">Expiry:</span>
                      <span className="text-gray-700 dark:text-gray-300">{formatDate(expiry_date)}</span>
                    </div>
                  )}
                  {is_vegetarian !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 dark:text-gray-400 w-24">Vegetarian:</span>
                      <span className="text-gray-700 dark:text-gray-300">{is_vegetarian ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                  {is_halal !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 dark:text-gray-400 w-24">Halal:</span>
                      <span className="text-gray-700 dark:text-gray-300">{is_halal ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                </div>
              )}

              {category === 'clothes' && (
                <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {clothing_category && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 dark:text-gray-400 w-24">Category:</span>
                      <span className="text-gray-700 dark:text-gray-300 capitalize">{clothing_category}</span>
                    </div>
                  )}
                  {gender && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 dark:text-gray-400 w-24">Gender:</span>
                      <span className="text-gray-700 dark:text-gray-300 capitalize">{gender}</span>
                    </div>
                  )}
                  {age_group && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 dark:text-gray-400 w-24">Age Group:</span>
                      <span className="text-gray-700 dark:text-gray-300 capitalize">{age_group}</span>
                    </div>
                  )}
                  {item_condition && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 dark:text-gray-400 w-24">Condition:</span>
                      <span className="text-gray-700 dark:text-gray-300 capitalize">{item_condition}</span>
                    </div>
                  )}
                  {brand && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 dark:text-gray-400 w-24">Brand:</span>
                      <span className="text-gray-700 dark:text-gray-300">{brand}</span>
                    </div>
                  )}
                  {size && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 dark:text-gray-400 w-24">Size:</span>
                      <span className="text-gray-700 dark:text-gray-300 capitalize">{size}</span>
                    </div>
                  )}
                  {color && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 dark:text-gray-400 w-24">Color:</span>
                      <span className="text-gray-700 dark:text-gray-300">{color}</span>
                    </div>
                  )}
                  {season && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 dark:text-gray-400 w-24">Season:</span>
                      <span className="text-gray-700 dark:text-gray-300 capitalize">{season}</span>
                    </div>
                  )}
                </div>
              )}

              {special_instructions && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Special Instructions:</p>
                  <p className="text-gray-700 dark:text-gray-300">{special_instructions}</p>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Pickup Information */}
          <SectionCard title="Pickup Information">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-gray-700 dark:text-gray-300">
                    {pickup_address_details?.fullAddress || 'Address not specified'}
                  </p>
                  {pickup_address_details && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {pickup_address_details.area}, {pickup_address_details.district}, {pickup_address_details.division}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-gray-700 dark:text-gray-300">
                    {pickup_date ? formatDate(pickup_date) : 'Date not specified'}
                  </p>
                  {pickup_time_slot && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Time slot: {pickup_time_slot}
                    </p>
                  )}
                </div>
              </div>

              {contact_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <p className="text-gray-700 dark:text-gray-300">{contact_phone}</p>
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

          {/* Activity History */}
          <SectionCard title="Activity History">
            <ActivityTimeline activities={activities} />
          </SectionCard>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Live Tracking Panel - Only show when volunteer is assigned */}
          {(status === 'scheduled' || status === 'on_the_way' || status === 'picked_up') && (
            <SectionCard title="Live Tracking">
              <TrackingPanel
                donation={donation}
                volunteer={volunteer}
                volunteerLocation={volunteerLocation}
              />
            </SectionCard>
          )}

          {/* Status Timeline */}
          <SectionCard title="Status Timeline">
            <StatusTimeline currentStatus={status} />
          </SectionCard>

          {/* Volunteer Information */}
          <SectionCard title="Volunteer Information">
            <VolunteerCard volunteer={volunteer} />
          </SectionCard>

          {/* Chat Window - Only show when volunteer is assigned */}
          {isVolunteerAssigned && (
            <SectionCard title="Chat with Volunteer">
              <ChatWindow donation={donation} currentUser={currentUser} />
            </SectionCard>
          )}

          {/* Related Information */}
          <SectionCard title="Related Information">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Category</span>
                <span className="text-gray-700 dark:text-gray-300 capitalize">{category}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Status</span>
                <span className="text-gray-700 dark:text-gray-300 capitalize">{status.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Created</span>
                <span className="text-gray-700 dark:text-gray-300">{formatDate(created_at)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Last Updated</span>
                <span className="text-gray-700 dark:text-gray-300">{formatDate(updated_at)}</span>
              </div>
            </div>
          </SectionCard>
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
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-2 border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h2>
      {children}
    </div>
  );
}

/**
 * ClockIcon component
 */
function ClockIcon({ size, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

/**
 * LoadingSkeleton component
 */
function LoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
        <div className="h-6 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Generate mock activities based on donation status
 */
function generateMockActivities(donation) {
  const activities = [
    {
      type: 'created',
      title: 'Donation Created',
      description: 'You created this donation request',
      timestamp: donation.created_at,
    },
  ];

  if (donation.status !== 'pending') {
    activities.push({
      type: 'assigned',
      title: 'Volunteer Assigned',
      description: donation.volunteer_name 
        ? `${donation.volunteer_name} accepted this donation`
        : 'A volunteer accepted this donation',
      timestamp: donation.updated_at,
    });
  }

  if (['scheduled', 'on_the_way', 'picked_up', 'completed'].includes(donation.status)) {
    activities.push({
      type: 'scheduled',
      title: 'Pickup Scheduled',
      description: `Pickup scheduled for ${donation.pickup_date}`,
      timestamp: donation.updated_at,
    });
  }

  if (['on_the_way', 'picked_up', 'completed'].includes(donation.status)) {
    activities.push({
      type: 'status_change',
      title: 'Volunteer On The Way',
      description: 'Volunteer is on the way to pickup location',
      timestamp: donation.updated_at,
    });
  }

  if (['picked_up', 'completed'].includes(donation.status)) {
    activities.push({
      type: 'status_change',
      title: 'Donation Picked Up',
      description: 'Volunteer has picked up the donation',
      timestamp: donation.updated_at,
    });
  }

  if (donation.status === 'completed') {
    activities.push({
      type: 'status_change',
      title: 'Donation Completed',
      description: 'Donation has been successfully delivered',
      timestamp: donation.updated_at,
    });
  }

  if (donation.status === 'cancelled') {
    activities.push({
      type: 'status_change',
      title: 'Donation Cancelled',
      description: 'This donation was cancelled',
      timestamp: donation.updated_at,
    });
  }

  return activities.reverse();
}
