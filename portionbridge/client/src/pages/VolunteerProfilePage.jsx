import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import VolunteerProfileHeader from '../components/dashboard/donor/VolunteerProfileHeader';
import VolunteerProfileInfo from '../components/dashboard/donor/VolunteerProfileInfo';
import VolunteerStatistics from '../components/dashboard/donor/VolunteerStatistics';
import VolunteerReviews from '../components/dashboard/donor/VolunteerReviews';
import VolunteerGallery from '../components/dashboard/donor/VolunteerGallery';
import VolunteerTeamInfo from '../components/dashboard/donor/VolunteerTeamInfo';
import VolunteerQuickActions from '../components/dashboard/donor/VolunteerQuickActions';
import { volunteerProfileApi } from '../services/volunteerProfileApi';

/**
 * Volunteer Profile Page
 * Displays complete volunteer profile with all components
 */
const VolunteerProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [volunteer, setVolunteer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [distance, setDistance] = useState(null);

  useEffect(() => {
    fetchVolunteerProfile();
  }, [id]);

  const fetchVolunteerProfile = async () => {
    setLoading(true);
    setError(null);
    
    const result = await volunteerProfileApi.getVolunteerProfile(id);

    if (result.success) {
      setVolunteer(result.data.volunteer);
      // Calculate distance if user location is available (from discovery page)
      const savedDistance = sessionStorage.getItem('volunteer_distance');
      if (savedDistance) {
        setDistance(parseFloat(savedDistance));
        sessionStorage.removeItem('volunteer_distance');
      }
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleRequestPickup = (volunteerData) => {
    console.log('Request pickup for:', volunteerData);
    // Placeholder for future phase
    alert('Pickup requests will be available in the next phase!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Volunteer Profile
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-2xl h-48" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-64" />
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-48" />
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-64" />
            </div>
            <div className="space-y-6">
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-48" />
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-64" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Profile
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!volunteer) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Volunteer Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The volunteer profile you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <div className="ml-4">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Volunteer Profile
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Profile Header */}
          <VolunteerProfileHeader volunteer={volunteer} distance={distance} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Information */}
              <VolunteerProfileInfo volunteer={volunteer} />

              {/* Statistics */}
              <VolunteerStatistics statistics={volunteer.statistics} />

              {/* Reviews */}
              <VolunteerReviews
                volunteerId={volunteer.id}
                ratingSummary={volunteer.rating_summary}
              />

              {/* Photo Gallery */}
              <VolunteerGallery volunteer={volunteer} />
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Team Information */}
              <VolunteerTeamInfo team={volunteer.team} />

              {/* Quick Actions */}
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

export default VolunteerProfilePage;
