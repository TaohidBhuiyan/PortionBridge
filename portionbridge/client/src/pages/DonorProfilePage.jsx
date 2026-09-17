import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Save, MapPin, Calendar, User, Mail, Phone, Camera, Loader2, CheckCircle2, ShieldCheck, ExternalLink, Sparkles, AlertCircle, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { DashboardLayout } from '../components/dashboard';
import { useAuth } from '../context/AuthContext';
import { profileApi } from '../services/profileApi';
import { Avatar } from '../components/common/Avatar';

export function DonorProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
  });

  const extractFormData = (userData) => ({
    name: userData.name || '',
    phone: userData.phone || '',
    address: userData.address || '',
    dateOfBirth: userData.date_of_birth ? userData.date_of_birth.split('T')[0] : '',
    gender: userData.gender || '',
  });

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await profileApi.getProfile();
      if (result.success) {
        setProfile(result.data.user);
        setFormData(extractFormData(result.data.user));
      } else {
        setError(result.error || 'Failed to load profile details.');
      }
    } catch {
      setError('Failed to load profile. Please refresh to try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProfile();
  }, [loadProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setPhotoError(null);
    setPhotoUploading(true);
    try {
      const result = await profileApi.uploadPhoto(file);
      if (result.success) {
        setProfile(result.data.user);
        updateUser(result.data.user);
        toast.success('Profile photo updated!');
      } else {
        const msg = result.message || 'Failed to upload photo.';
        setPhotoError(msg);
        toast.error(msg);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to upload photo.';
      setPhotoError(msg);
      toast.error(msg);
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const result = await profileApi.updateProfile(formData);
      
      if (result.success) {
        toast.success('Profile updated successfully!');
        setProfile(result.data.user);
        updateUser(result.data.user);
      } else {
        const msg = result.error || 'Failed to update profile';
        setError(msg);
        toast.error(msg);
      }
    } catch {
      const msg = 'Failed to update profile. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="h-10 w-48 bg-surface border border-border rounded-xl animate-pulse" />
          <div className="bg-surface rounded-3xl border border-border p-8 h-48 animate-pulse" />
          <div className="bg-surface rounded-3xl border border-border p-8 h-96 animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-16">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 bg-surface hover:bg-surface-hover border border-border rounded-xl transition-all shadow-xs shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-text-primary tracking-tight">
                Profile Management
              </h1>
              <p className="text-xs text-text-secondary mt-0.5">
                Update your personal information and profile picture
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/donor/settings')}
            className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover border border-border text-text-primary text-xs font-semibold rounded-xl transition-all shadow-xs"
          >
            <ShieldCheck size={16} className="text-dash-primary" />
            <span>Account Settings</span>
          </button>
        </div>

        {/* Hero Cover & Avatar Banner */}
        <div className="bg-surface rounded-3xl border border-border overflow-hidden shadow-sm relative">
          {/* Gradient Cover Photo Header */}
          <div className="h-36 sm:h-44 bg-gradient-to-r from-dash-primary via-dash-primary/80 to-purple-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_60%)]" />
            <div className="absolute top-4 right-4 px-3 py-1 bg-black/20 backdrop-blur-md rounded-full text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20">
              <Sparkles size={12} />
              <span className="capitalize">{profile?.role || 'Donor'} Account</span>
            </div>
          </div>

          {/* Profile Header Content */}
          <div className="px-6 sm:px-8 pb-6 pt-0 relative flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
              {/* Avatar + Photo Upload Overlay */}
              <div className="relative group">
                <Avatar
                  item={profile}
                  className="w-28 h-28 sm:w-32 sm:h-32 text-4xl rounded-2xl ring-4 ring-surface shadow-xl object-cover"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoUploading}
                  title="Upload profile photo"
                  className="absolute bottom-1 right-1 p-2.5 bg-dash-primary hover:bg-dash-primary-hover text-white rounded-xl shadow-lg transition-all border-2 border-surface focus:outline-none disabled:opacity-60 cursor-pointer"
                >
                  {photoUploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>

              {/* User Snapshot Details */}
              <div className="mb-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-text-primary">
                    {profile?.name || 'Valued User'}
                  </h2>
                  <span className="p-1 rounded-full bg-success-soft text-success">
                    <CheckCircle2 size={16} />
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">{profile?.email}</p>
                <div className="flex items-center gap-3 text-xs text-text-muted mt-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-dash-primary-soft text-dash-primary font-semibold text-[11px] capitalize">
                    {profile?.role || 'Donor'}
                  </span>
                  <span>•</span>
                  <span>Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '2026'}</span>
                </div>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoUploading}
                className="w-full sm:w-auto px-4 py-2 bg-page hover:bg-surface-hover border border-border text-text-primary text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <Camera size={14} />
                <span>{photoUploading ? 'Uploading...' : 'Change Photo'}</span>
              </button>
            </div>
          </div>

          {photoError && (
            <div className="px-6 pb-4">
              <p className="text-xs text-danger font-medium bg-danger-soft p-2.5 rounded-xl border border-danger/20 flex items-center gap-2">
                <AlertCircle size={14} /> {photoError}
              </p>
            </div>
          )}
        </div>

        {/* Main Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Card */}
          <div className="bg-surface rounded-3xl border border-border p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <div className="p-2.5 bg-dash-primary-soft text-dash-primary rounded-xl">
                <User size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">Personal Details</h3>
                <p className="text-xs text-text-secondary">Update your name, contact phone, and personal demographics</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-xl bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary transition-all"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-xl bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary transition-all"
                    placeholder="+880 1XXX-XXXXXX"
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-xl bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary transition-all"
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-border rounded-xl bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary transition-all cursor-pointer"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location & Address Card */}
          <div className="bg-surface rounded-3xl border border-border p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-dash-primary-soft text-dash-primary rounded-xl">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">Primary Location & Address</h3>
                  <p className="text-xs text-text-secondary">Your default address for pickup scheduling</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/donor/addresses')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-page hover:bg-surface-hover border border-border text-xs font-semibold text-text-primary rounded-lg transition-all"
              >
                <span>Saved Addresses</span>
                <ExternalLink size={12} className="text-text-muted" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Street Address / Area Detail
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted" />
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-xl bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary transition-all resize-none"
                  placeholder="e.g. House 42, Road 11, Block D, Mirpur 12, Dhaka"
                />
              </div>
            </div>
          </div>

          {/* Account Security Overview Card */}
          <div className="bg-surface rounded-3xl border border-border p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <div className="p-2.5 bg-dash-primary-soft text-dash-primary rounded-xl">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">Account Identity & Email</h3>
                <p className="text-xs text-text-secondary">System credentials associated with this account</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Primary Email (Read-Only)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-xl bg-page text-text-muted text-sm font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Account Status
                </label>
                <div className="p-3 bg-page border border-border rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
                    <span className="text-xs font-semibold text-text-primary">Email Verified & Active</span>
                  </div>
                  <span className="text-[11px] font-mono text-dash-primary font-medium">ID #{profile?.id || '---'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-8 py-3.5 bg-dash-primary hover:bg-dash-primary-hover text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Save Profile Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

