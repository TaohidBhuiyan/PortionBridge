import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkeletonCard } from '../skeletons';
import { Phone, MapPin, Camera, CheckCircle2, UserCheck, ArrowRight } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * ProfileCompletion — Interactive Profile Health Card
 * Features an SVG radial progress meter, missing fields checklist, and 1-click update buttons.
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
      user.profile_photo || user.profile_picture || user.photo,
    ];

    const completedFields = fields.filter(field => field && String(field).trim() !== '').length;
    return Math.round((completedFields / fields.length) * 100);
  };

  const getMissingFields = (user) => {
    if (!user) return [];

    const hasPhoto = Boolean(user.profile_photo || user.profile_picture || user.photo);
    const missing = [];
    if (!hasPhoto) missing.push({ field: 'Profile Photo', icon: Camera, path: '/donor/profile' });
    if (!user.phone) missing.push({ field: 'Phone Number', icon: Phone, path: '/donor/profile' });
    if (!user.address) missing.push({ field: 'Pickup Address', icon: MapPin, path: '/donor/addresses' });

    return missing;
  };

  const completion = calculateCompletion(profile);
  const missingFields = getMissingFields(profile);

  // Radial SVG calculation: radius 22, circumference = 2 * PI * 22 ≈ 138.2
  const circumference = 2 * Math.PI * 22;
  const strokeDashoffset = circumference - (completion / 100) * circumference;

  if (loading) {
    return (
      <div className="bg-surface rounded-3xl border border-border/50 p-5 shadow-pb-card h-full flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="h-5 w-32 bg-border/40 rounded-md animate-pulse" />
          <div className="h-4 w-12 bg-border/30 rounded-md animate-pulse" />
        </div>
        <SkeletonCard count={2} />
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-3xl border border-border/50 p-5 sm:p-6 shadow-pb-card h-full flex flex-col justify-between">
      <div>
        {/* Header & Radial Meter */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-dash-primary-soft flex items-center justify-center text-dash-primary">
                <UserCheck size={16} />
              </div>
              <h3 className="text-base font-bold text-text-primary">Profile Health</h3>
            </div>
            <p className="text-xs text-text-secondary">
              Verified info speeds up volunteer pickups
            </p>
          </div>

          {/* Circular SVG Gauge */}
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 52 52">
              {/* Background circle */}
              <circle
                cx="26"
                cy="26"
                r="22"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-border/40"
              />
              {/* Animated Progress circle */}
              <circle
                cx="26"
                cy="26"
                r="22"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="text-dash-primary transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-black text-text-primary">{completion}%</span>
            </div>
          </div>
        </div>

        {/* Completion status */}
        {completion === 100 ? (
          <div className="p-3.5 rounded-2xl bg-success-soft/60 border border-success/30 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-success text-white flex items-center justify-center shrink-0">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-text-primary">Profile 100% Complete</p>
              <p className="text-[11px] text-text-secondary">Your account is fully verified for priority service.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-text-secondary mb-1">Recommended actions:</p>
            {missingFields.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.field}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-border/50 bg-surface hover:bg-surface-hover transition-colors text-left group"
                >
                  <div className="flex items-center gap-2 text-xs font-medium text-text-primary">
                    <Icon size={14} className="text-dash-primary" />
                    <span>Add {item.field}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-dash-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Fix <ArrowRight size={11} />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-3 mt-3 border-t border-border/40">
        <button
          onClick={() => navigate('/donor/profile')}
          className="w-full text-center text-xs font-semibold text-dash-primary hover:text-dash-primary-hover transition-colors"
        >
          Manage Profile Details
        </button>
      </div>
    </div>
  );
}