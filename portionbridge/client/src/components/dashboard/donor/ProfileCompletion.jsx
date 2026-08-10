import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkeletonCard } from '../skeletons';
import { Phone, MapPin, Camera, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * ProfileCompletion card — encourages the donor to complete their profile.
 */
export function ProfileCompletion() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${API_BASE}/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data?.success) {
          setProfile(response.data.data.user);
        } else {
          throw new Error('Failed to fetch profile');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const calculateCompletion = (user) => {
    if (!user) return 0;

    const fields = [
      user.name,
      user.email,
      user.phone,
      user.address,
      user.photo,
    ];

    const completedFields = fields.filter(field => field && field.trim() !== '').length;
    return Math.round((completedFields / fields.length) * 100);
  };

  const getMissingFields = (user) => {
    if (!user) return [];

    const missing = [];
    if (!user.photo) missing.push({ field: 'Profile Photo', icon: Camera });
    if (!user.phone) missing.push({ field: 'Phone Number', icon: Phone });
    if (!user.address) missing.push({ field: 'Address', icon: MapPin });

    return missing;
  };

  const completion = calculateCompletion(profile);
  const missingFields = getMissingFields(profile);

  if (loading) {
    return (
      <div className="bg-surface rounded-xl border border-border p-5">
        <SkeletonCard count={1} />
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-5">
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-text-primary mb-0.5">
            Profile Completion
          </h2>
          <p className="text-xs text-text-secondary">
            Complete your profile to get the most out of PortionBridge
          </p>
        </div>
        <div className="relative w-14 h-14 shrink-0">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="28"
              cy="28"
              r="24"
              stroke="currentColor"
              strokeWidth="5"
              fill="none"
              className="text-border"
            />
            <circle
              cx="28"
              cy="28"
              r="24"
              stroke="currentColor"
              strokeWidth="5"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 24}`}
              strokeDashoffset={`${2 * Math.PI * 24 * (1 - completion / 100)}`}
              strokeLinecap="round"
              className="text-dash-primary transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-semibold text-text-primary">
              {completion}%
            </span>
          </div>
        </div>
      </div>

      {missingFields.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-text-secondary mb-2">
            Missing Information
          </p>
          {missingFields.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-2.5 p-2 rounded-lg bg-page border border-border"
              >
                <Icon size={14} className="text-text-secondary" />
                <span className="text-xs text-text-secondary">{item.field}</span>
              </div>
            );
          })}
          <button
            onClick={() => navigate('/donor/profile')}
            className="w-full mt-3 py-2 px-4 text-sm bg-dash-primary hover:bg-dash-primary-hover text-white font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary focus-visible:ring-offset-2"
          >
            Complete Profile
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-success-soft">
          <CheckCircle size={18} className="text-success shrink-0" />
          <div>
            <p className="text-sm font-medium text-success">
              Profile Complete!
            </p>
            <p className="text-xs text-success">
              Your profile is fully set up.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}