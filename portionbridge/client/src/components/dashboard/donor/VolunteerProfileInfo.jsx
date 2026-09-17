import { MapPin, Car, Clock, Globe, Briefcase, Calendar, Shield } from 'lucide-react';

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
    <div className="pb-glass-card rounded-2xl p-6 border border-border/60 shadow-sm space-y-6">
      <h2 className="text-lg font-bold text-text-primary tracking-tight flex items-center gap-2">
        <Briefcase className="w-5 h-5 text-dash-primary" /> Volunteer Information & Skills
      </h2>

      {/* Bio Section */}
      {volunteer.bio && (
        <div className="p-4 rounded-xl bg-surface/80 border border-border/60">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">About Me</h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            {volunteer.bio}
          </p>
        </div>
      )}

      {/* Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Vehicle Type */}
        <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-surface/80 border border-border/60">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-0.5">Vehicle Transport</h3>
            <div className="flex items-center gap-2">
              <span className="text-xl">{getVehicleIcon(volunteer.vehicle_type)}</span>
              <p className="text-sm font-bold text-text-primary capitalize">
                {volunteer.vehicle_type || 'On Foot / Walking'}
              </p>
            </div>
          </div>
        </div>

        {/* Coverage Radius */}
        <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-surface/80 border border-border/60">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-0.5">Coverage Radius</h3>
            <p className="text-sm font-bold text-text-primary">
              {volunteer.coverage_radius ? `${volunteer.coverage_radius} km radius` : 'Not specified'}
            </p>
          </div>
        </div>

        {/* Service Areas */}
        {volunteer.service_area && volunteer.service_area.length > 0 && (
          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-surface/80 border border-border/60 md:col-span-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Primary Service Areas</h3>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(volunteer.service_area) ? (
                  volunteer.service_area.map((area, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                    >
                      {area}
                    </span>
                  ))
                ) : (
                  <span className="text-sm font-semibold text-text-primary">
                    {volunteer.service_area}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Skills */}
        {volunteer.skills && volunteer.skills.length > 0 && (
          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-surface/80 border border-border/60 md:col-span-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Specialized Skills</h3>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(volunteer.skills) ? (
                  volunteer.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-sm font-semibold text-text-primary">
                    {volunteer.skills}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Availability */}
        {volunteer.availability && volunteer.availability.length > 0 && (
          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-surface/80 border border-border/60 md:col-span-2">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Available Time Slots</h3>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(volunteer.availability) ? (
                  volunteer.availability.map((slot, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 capitalize"
                    >
                      {slot}
                    </span>
                  ))
                ) : (
                  <span className="text-sm font-semibold text-text-primary capitalize">
                    {volunteer.availability}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Member Since */}
        <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-surface/80 border border-border/60">
          <div className="w-10 h-10 rounded-xl bg-dash-primary-soft text-dash-primary flex items-center justify-center shrink-0 border border-dash-primary/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-0.5">Member Since</h3>
            <p className="text-sm font-bold text-text-primary">
              {formatDate(volunteer.created_at)}
            </p>
          </div>
        </div>

        {/* Verification Status */}
        <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-surface/80 border border-border/60">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-0.5">Verification Status</h3>
            <p className={`text-sm font-bold ${volunteer.email_verified ? 'text-emerald-500' : 'text-text-muted'}`}>
              {volunteer.email_verified ? 'Verified Volunteer Email' : 'Pending Verification'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerProfileInfo;
