import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkeletonCard } from '../skeletons';
import { Phone, MapPin, Camera, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * ProfileCompletion card component showing profile completion percentage
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
      <div className="bg-white dark:bg-[#120721] rounded-xl border border-gray-200 dark:border-purple-950/30 p-6 mb-6">
        <SkeletonCard count={1} />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#120721] rounded-xl border border-gray-200 dark:border-purple-950/30 p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
            Profile Completion
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Complete your profile to get the most out of PortionBridge
          </p>
        </div>
        <div className="relative w-20 h-20">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200 dark:text-purple-950/30"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 36}`}
              strokeDashoffset={`${2 * Math.PI * 36 * (1 - completion / 100)}`}
              strokeLinecap="round"
              className="text-purple-500 transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {completion}%
            </span>
          </div>
        </div>
      </div>

      {missingFields.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Missing Information:
          </p>
          {missingFields.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-purple-950/10 border border-gray-200 dark:border-purple-950/30"
              >
                <Icon size={18} className="text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{item.field}</span>
              </div>
            );
          })}
          <button 
            onClick={() => navigate('/donor/profile')}
            className="w-full mt-4 py-2.5 px-4 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-800 hover:from-purple-600 hover:via-purple-700 hover:to-purple-900 text-white font-semibold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Complete Profile
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-950/30">
          <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
          <div>
            <p className="font-medium text-green-700 dark:text-green-400">
              Profile Complete!
            </p>
            <p className="text-sm text-green-600 dark:text-green-500">
              Your profile is fully set up.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
