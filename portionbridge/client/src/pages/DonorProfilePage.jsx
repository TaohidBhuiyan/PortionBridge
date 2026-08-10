import { useState, useEffect } from 'react';
import { ArrowLeft, Camera, Save, MapPin, Calendar, User, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard';
import { useAuth } from '../context/AuthContext';
import { profileApi } from '../services/profileApi';
import { Avatar } from '../components/common/Avatar';

/**
 * Donor Profile Settings Page
 * Edit profile information, photo, and preferences
 */
export function DonorProfilePage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await profileApi.getProfile();
      
      if (result.success) {
        setProfile(result.data.user);
        setFormData(extractFormData(result.data.user));
      } else {
        setError(result.error || 'Failed to load profile');
      }
    } catch (err) {
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const extractFormData = (userData) => ({
    name: userData.name || '',
    phone: userData.phone || '',
    address: userData.address || '',
    dateOfBirth: userData.date_of_birth || '',
    gender: userData.gender || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await profileApi.updateProfile(formData);
      
      if (result.success) {
        setSuccess('Profile updated successfully!');
        setProfile(result.data.user);
        setUser(result.data.user);
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center gap-4 mb-6">
            <div className="h-10 w-10 bg-surface-hover rounded-lg animate-pulse" />
            <div className="space-y-2">
              <div className="h-8 w-48 bg-surface-hover rounded-lg animate-pulse" />
              <div className="h-4 w-64 bg-surface-hover rounded-lg animate-pulse" />
            </div>
          </div>

          {/* Profile Photo Section Skeleton */}
          <div className="bg-surface rounded-2xl border border-border p-6 animate-pulse">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-surface-hover animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-surface-hover rounded-lg animate-pulse" />
                <div className="h-10 w-32 bg-surface-hover rounded-lg animate-pulse" />
              </div>
            </div>
          </div>

          {/* Form Skeleton */}
          <div className="bg-surface rounded-2xl border border-border p-6 animate-pulse space-y-4">
            <div className="h-6 w-48 bg-surface-hover rounded-lg animate-pulse" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-surface-hover rounded-lg animate-pulse" />
                <div className="h-12 w-full bg-surface-hover rounded-lg animate-pulse" />
              </div>
            ))}
          </div>

          {/* Account Info Skeleton */}
          <div className="bg-page rounded-2xl border border-border p-6 animate-pulse">
            <div className="h-6 w-48 bg-surface-hover rounded-lg animate-pulse mb-4" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-32 bg-surface-hover rounded-lg animate-pulse" />
                <div className="h-4 w-24 bg-surface-hover rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Profile Settings
            </h1>
            <p className="text-sm text-text-secondary">
              Manage your profile information
            </p>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-4 bg-success-soft border border-success/20 rounded-lg" role="alert" aria-live="polite">
            <p className="text-sm text-success">{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-danger-soft border border-danger/20 rounded-lg" role="alert" aria-live="assertive">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {/* Profile Photo Section */}
        <div className="bg-surface rounded-2xl border border-border p-6 mb-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Profile Photo
          </h2>
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar item={profile} className="w-24 h-24 text-3xl" />
              <button className="absolute bottom-0 right-0 p-2 bg-dash-primary text-white rounded-full hover:bg-dash-primary-hover transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2">
                <Camera size={16} />
              </button>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-2">
                Upload a new profile photo
              </p>
              <button className="px-4 py-2 bg-page border border-border text-text-primary rounded-xl hover:bg-surface-hover transition-colors text-sm font-medium">
                Choose File
              </button>
              <p className="text-xs text-text-secondary mt-2">
                Recommended: Square image, max 2MB
              </p>
            </div>
          </div>
        </div>

        {/* Profile Information Form */}
        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl border border-border p-6 mb-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Personal Information
          </h2>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-page text-text-primary focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-surface-hover text-text-secondary cursor-not-allowed"
                  placeholder="your@email.com"
                />
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Contact support to change email
              </p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-page text-text-primary focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all"
                  placeholder="+880 1XXX-XXXXXX"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-text-secondary" />
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-page text-text-primary focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all resize-none"
                  placeholder="Enter your address"
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Date of Birth
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-page text-text-primary focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-border rounded-xl bg-page text-text-primary focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-dash-primary hover:bg-dash-primary-hover text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Account Info */}
        <div className="bg-page rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Account Information
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Member Since</span>
              <span className="text-text-primary font-medium">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Account Type</span>
              <span className="text-text-primary font-medium capitalize">
                {profile?.role || 'Donor'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Email Verified</span>
              <span className={`font-medium ${profile?.email_verified ? 'text-success' : 'text-warning'}`}>
                {profile?.email_verified ? 'Verified' : 'Not Verified'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
