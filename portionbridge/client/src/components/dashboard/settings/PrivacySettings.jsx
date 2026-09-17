import { useState } from 'react';
import { Shield, Eye, EyeOff, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export function PrivacySettings() {
  const { user } = useAuth();
  const [overridden, setOverridden] = useState(null);
  const showOnLeaderboard = overridden !== null ? overridden : (user?.show_on_leaderboard !== false);
  const [saving, setSaving] = useState(false);

  const handleToggle = async () => {
    setSaving(true);

    try {
      const nextValue = !showOnLeaderboard;
      const response = await axios.patch(
        `${API_BASE_URL}/profile`,
        { showOnLeaderboard: nextValue },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );

      if (response.data.success) {
        setOverridden(nextValue);
        toast.success(nextValue ? 'Leaderboard visibility enabled!' : 'Leaderboard profile set to Anonymous');
      } else {
        toast.error(response.data.message || 'Failed to update privacy settings');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update privacy settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-dash-primary-soft text-dash-primary rounded-xl">
            <Shield size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Privacy & Public Visibility</h2>
            <p className="text-xs text-text-secondary mt-0.5">Control how your activity and profile appear across PortionBridge</p>
          </div>
        </div>
      </div>

      {/* Leaderboard Visibility Card */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div className="flex items-start gap-3.5">
            <div className={`p-3 rounded-xl shrink-0 ${showOnLeaderboard ? 'bg-success-soft text-success' : 'bg-page text-text-muted border border-border'}`}>
              {showOnLeaderboard ? <Eye size={22} /> : <EyeOff size={22} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-text-primary">Public Leaderboard Visibility</h3>
                <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${showOnLeaderboard ? 'bg-success-soft text-success' : 'bg-page text-text-secondary border border-border'}`}>
                  {showOnLeaderboard ? 'Public' : 'Anonymous'}
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-1 max-w-xl">
                {showOnLeaderboard
                  ? 'Your full name, avatar, and impact score will be visible on the public Donor Leaderboard.'
                  : 'Your profile will be masked as "Anonymous Donor" on public leaderboards.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggle}
            disabled={saving}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer ${
              showOnLeaderboard ? 'bg-dash-primary' : 'bg-border'
            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ease-in-out shadow-xs ${
                showOnLeaderboard ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Live Preview Card */}
        <div className="mt-6 pt-2">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Live Leaderboard Preview</p>
          <div className="p-4 rounded-xl border border-border bg-page flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-dash-primary/20 text-dash-primary flex items-center justify-center font-bold text-sm">
                {showOnLeaderboard ? (user?.name?.substring(0, 2).toUpperCase() || 'PB') : 'AN'}
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">
                  {showOnLeaderboard ? (user?.name || 'Your Name') : 'Anonymous Donor'}
                </p>
                <p className="text-xs text-text-secondary">#3 Top Impact Contributor</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-dash-primary bg-dash-primary-soft px-3 py-1 rounded-full">
                1,250 Impact Pts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Notice */}
      <div className="bg-info-soft/40 border border-info/20 rounded-2xl p-5 flex items-start gap-3.5">
        <div className="p-2 bg-info-soft text-info rounded-xl shrink-0">
          <Info size={18} />
        </div>
        <div className="text-xs text-text-secondary space-y-1">
          <p className="font-semibold text-text-primary text-sm">Your Data Privacy Protection</p>
          <p>
            Opting out of the public leaderboard only masks your identity from public views. Your personal donation history, receipts, and impact stats remain securely tracked inside your private dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}

