import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, UserCheck } from 'lucide-react';
import VolunteerProfileHeader from '../components/dashboard/donor/VolunteerProfileHeader';
import VolunteerProfileInfo from '../components/dashboard/donor/VolunteerProfileInfo';
import VolunteerStatistics from '../components/dashboard/donor/VolunteerStatistics';
import VolunteerReviews from '../components/dashboard/donor/VolunteerReviews';
import VolunteerGallery from '../components/dashboard/donor/VolunteerGallery';
import VolunteerTeamInfo from '../components/dashboard/donor/VolunteerTeamInfo';
import VolunteerQuickActions from '../components/dashboard/donor/VolunteerQuickActions';
import { AchievementsPanel } from '../components/common/AchievementsPanel';
import { volunteerProfileApi } from '../services/volunteerProfileApi';
import { useAuth } from '../context/AuthContext';

const VolunteerProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [volunteer, setVolunteer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [distance, setDistance] = useState(null);

  const fetchVolunteerProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const result = await volunteerProfileApi.getVolunteerProfile(id);

    if (result.success) {
      setVolunteer(result.data.volunteer);
      const savedDistance = sessionStorage.getItem('volunteer_distance');
      if (savedDistance) {
        setDistance(parseFloat(savedDistance));
        sessionStorage.removeItem('volunteer_distance');
      }
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchVolunteerProfile();
  }, [fetchVolunteerProfile]);

  const handleRequestPickup = (volunteerData) => {
    navigate('/donation/create', { state: { preferredVolunteerId: volunteerData.id } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-page">
        <div className="bg-surface/90 backdrop-blur-md border-b border-border/80 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-surface-hover rounded-xl transition-colors text-text-secondary"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="ml-4 text-lg font-bold text-text-primary">Loading Volunteer Profile...</h1>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="animate-pulse pb-glass-card rounded-3xl h-56" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="animate-pulse pb-glass-card rounded-2xl h-64" />
              <div className="animate-pulse pb-glass-card rounded-2xl h-48" />
            </div>
            <div className="space-y-6">
              <div className="animate-pulse pb-glass-card rounded-2xl h-48" />
              <div className="animate-pulse pb-glass-card rounded-2xl h-64" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center p-4">
        <div className="pb-glass-card rounded-3xl p-8 max-w-md text-center border border-danger/30 shadow-md">
          <AlertCircle className="w-14 h-14 text-danger mx-auto mb-3" />
          <h2 className="text-xl font-bold text-text-primary mb-1">Error Loading Profile</h2>
          <p className="text-xs text-text-secondary mb-5">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 bg-dash-primary hover:bg-dash-primary-hover text-white rounded-xl font-bold text-xs transition-colors shadow-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!volunteer) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center p-4">
        <div className="pb-glass-card rounded-3xl p-8 max-w-md text-center border border-border/80 shadow-md">
          <AlertCircle className="w-14 h-14 text-text-muted mx-auto mb-3" />
          <h2 className="text-xl font-bold text-text-primary mb-1">Volunteer Not Found</h2>
          <p className="text-xs text-text-secondary mb-5">
            The volunteer profile you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 bg-dash-primary hover:bg-dash-primary-hover text-white rounded-xl font-bold text-xs transition-colors shadow-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page">
      {/* Top Sticky Header */}
      <div className="bg-surface/90 backdrop-blur-md border-b border-border/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                aria-label="Go back"
                className="p-2 hover:bg-surface-hover rounded-xl transition-colors text-text-secondary"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-base sm:text-lg font-extrabold text-text-primary flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-dash-primary" /> {volunteer.name}'s Profile
                </h1>
              </div>
            </div>

            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-dash-primary-soft text-dash-primary border border-dash-primary/20">
              Verified Volunteer
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Profile Header */}
          <VolunteerProfileHeader
            volunteer={volunteer}
            distance={distance}
            isOwnProfile={user?.id === Number(id)}
            onPhotoUpdated={(updatedUser) => setVolunteer((prev) => ({ ...prev, profile_photo: updatedUser.profile_photo }))}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <VolunteerProfileInfo volunteer={volunteer} />
              <VolunteerStatistics statistics={volunteer.statistics} />
              <VolunteerReviews
                volunteerId={volunteer.id}
                ratingSummary={volunteer.rating_summary}
              />
              <VolunteerGallery volunteer={volunteer} />
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              <VolunteerTeamInfo team={volunteer.team} />
              <AchievementsPanel userId={volunteer.id} userRole="volunteer" />
              <VolunteerQuickActions
                volunteer={volunteer}
                onRequestPickup={handleRequestPickup}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { VolunteerProfilePage };
export default VolunteerProfilePage;
