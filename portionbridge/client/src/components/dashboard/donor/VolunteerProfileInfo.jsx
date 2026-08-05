import { MapPin, Car, Clock, Globe, Briefcase, Calendar, Shield } from 'lucide-react';

/**
 * Volunteer Profile Information Component
 * Displays detailed volunteer information
 */
const VolunteerProfileInfo = ({ volunteer }) => {
  const getVehicleIcon = (vehicleType) => {
    switch (vehicleType) {
      case 'bicycle': return '🚴';
      case 'motorcycle': return '🏍️';
      case 'car': return '🚗';
      case 'van': return '🚐';
      case 'truck': return '🚚';
      default: return '🚶';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">About</h2>

      {/* Bio */}
      {volunteer.bio && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Bio</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {volunteer.bio}
          </p>
        </div>
      )}

      {/* Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vehicle Type */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <Car className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Vehicle Type</h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getVehicleIcon(volunteer.vehicle_type)}</span>
              <p className="text-gray-900 dark:text-white capitalize">
                {volunteer.vehicle_type || 'Not specified'}
              </p>
            </div>
          </div>
        </div>

        {/* Coverage Radius */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Coverage Radius</h3>
            <p className="text-gray-900 dark:text-white">
              {volunteer.coverage_radius ? `${volunteer.coverage_radius} km` : 'Not specified'}
            </p>
          </div>
        </div>

        {/* Service Areas */}
        {volunteer.service_area && volunteer.service_area.length > 0 && (
          <div className="flex items-start gap-3 md:col-span-2">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Service Areas</h3>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(volunteer.service_area) ? (
                  volunteer.service_area.map((area, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                    >
                      {area}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-700 dark:text-gray-300 text-sm">
                    {volunteer.service_area}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Skills */}
        {volunteer.skills && volunteer.skills.length > 0 && (
          <div className="flex items-start gap-3 md:col-span-2">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(volunteer.skills) ? (
                  volunteer.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-700 dark:text-gray-300 text-sm">
                    {volunteer.skills}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Availability */}
        {volunteer.availability && volunteer.availability.length > 0 && (
          <div className="flex items-start gap-3 md:col-span-2">
            <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Availability</h3>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(volunteer.availability) ? (
                  volunteer.availability.map((slot, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full text-sm"
                    >
                      {slot}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-700 dark:text-gray-300 text-sm">
                    {volunteer.availability}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Member Since */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Member Since</h3>
            <p className="text-gray-900 dark:text-white">
              {formatDate(volunteer.created_at)}
            </p>
          </div>
        </div>

        {/* Verification Status */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Email Verified</h3>
            <p className={`font-medium ${volunteer.email_verified ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {volunteer.email_verified ? 'Verified' : 'Not Verified'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerProfileInfo;
