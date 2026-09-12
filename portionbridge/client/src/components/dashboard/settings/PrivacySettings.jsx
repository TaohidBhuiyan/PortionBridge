import { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * PrivacySettings Component
 * Allows users to toggle their visibility on the public leaderboard
 */
export function PrivacySettings() {
  const { user } = useAuth();
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setShowOnLeaderboard(user.show_on_leaderboard !== false);
    }
  }, [user]);

  const handleToggle = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const response = await axios.patch(
        `${API_BASE_URL}/profile`,
        { showOnLeaderboard: !showOnLeaderboard },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.data.success) {
        setShowOnLeaderboard(!showOnLeaderboard);
        setSuccess(true);
        // Update local user context
        if (user) {
          user.show_on_leaderboard = !showOnLeaderboard;
        }
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(response.data.message || 'Failed to update privacy settings');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update privacy settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="w-6 h-6 text-dash-primary" />
        <h2 className="text-xl font-semibold text-text-primary">Privacy Settings</h2>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {showOnLeaderboard ? (
                <Eye className="w-5 h-5 text-success" />
              ) : (
                <EyeOff className="w-5 h-5 text-text-muted" />
              )}
              <h3 className="font-medium text-text-primary">Show on Leaderboard</h3>
            </div>
            <p className="text-sm text-text-secondary">
              {showOnLeaderboard
                ? 'Your name and donation stats will be visible on the public leaderboard.'
                : 'Your name will be hidden from the public leaderboard. Your donations will still be tracked privately.'}
            </p>
          </div>

          <button
            onClick={handleToggle}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              showOnLeaderboard ? 'bg-dash-primary' : 'bg-border'
            } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                showOnLeaderboard ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {success && (
          <div className="mt-4 p-3 bg-success-soft rounded-lg border border-success/30">
            <p className="text-sm text-success">Privacy settings updated successfully!</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-danger-soft rounded-lg border border-danger/30">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}
      </div>

      <div className="bg-info-soft rounded-xl border border-info/30 p-4">
        <p className="text-sm text-info">
          <strong>Note:</strong> Opting out of the leaderboard only hides your name from public view.
          Your donation history and impact points are still tracked in your private profile.
        </p>
      </div>
    </div>
  );
}
