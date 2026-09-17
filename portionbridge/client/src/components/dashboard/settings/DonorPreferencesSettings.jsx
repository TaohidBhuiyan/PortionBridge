import { useState, useEffect } from 'react';
import { Clock, PhoneCall, MapPin, Save, Check, ExternalLink, Sparkles, Mail, MessageSquare, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { profileApi } from '../../../services/profileApi';

const TIME_SLOTS = [
  { id: 'morning', label: 'Morning Slot', time: '8:00 AM - 12:00 PM', icon: Clock, desc: 'Ideal for early morning pickups' },
  { id: 'afternoon', label: 'Afternoon Slot', time: '12:00 PM - 5:00 PM', icon: Clock, desc: 'Convenient mid-day pickups' },
  { id: 'evening', label: 'Evening Slot', time: '5:00 PM - 9:00 PM', icon: Clock, desc: 'After office hours pickups' },
  { id: 'anytime', label: 'Flexible / Any Time', time: '8:00 AM - 9:00 PM', icon: Sparkles, desc: 'Any available volunteer window' },
];

const CONTACT_METHODS = [
  { id: 'email', label: 'Email Only', desc: 'Detailed updates sent to your registered email', icon: Mail },
  { id: 'phone', label: 'Direct Phone Call', desc: 'Volunteers call before arrival for coordination', icon: PhoneCall },
  { id: 'sms', label: 'SMS & Messaging', desc: 'Instant text alerts for quick updates', icon: MessageSquare },
  { id: 'in_app', label: 'In-App Alerts', desc: 'Real-time notifications inside PortionBridge', icon: Bell },
];

export function DonorPreferencesSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [preferredPickupTimeSlot, setPreferredPickupTimeSlot] = useState('anytime');
  const [preferredContactMethod, setPreferredContactMethod] = useState('email');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Populate from logged in user if available
    if (user?.preferred_pickup_time_slot) {
      setPreferredPickupTimeSlot(user.preferred_pickup_time_slot);
    }
    if (user?.preferred_contact_method) {
      setPreferredContactMethod(user.preferred_contact_method);
    }
  }, [user]);

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      const res = await profileApi.updatePreferences({
        preferredPickupTimeSlot,
        preferredContactMethod,
      });

      if (res.success || res.status === 'success') {
        toast.success('Donation preferences saved!');
      } else {
        toast.error(res.message || 'Failed to save preferences');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-dash-primary/10 via-dash-primary-soft to-transparent rounded-2xl border border-dash-primary/20 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dash-primary/10 text-dash-primary text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles size={14} /> Donor Customization
          </div>
          <h2 className="text-xl font-bold text-text-primary">Donation & Pickup Preferences</h2>
          <p className="text-sm text-text-secondary mt-1">
            Customize default schedule windows and communication channels for smoother food pickups.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-dash-primary hover:bg-dash-primary-hover text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 shrink-0"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save size={18} />
          )}
          <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
        </button>
      </div>

      {/* Preferred Pickup Time Slot */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
        <h3 className="text-base font-semibold text-text-primary mb-1 flex items-center gap-2">
          <Clock size={18} className="text-dash-primary" />
          Default Preferred Pickup Window
        </h3>
        <p className="text-xs text-text-secondary mb-4">
          Select your default preferred time frame. This will automatically pre-fill when posting a new donation.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TIME_SLOTS.map((slot) => {
            const Icon = slot.icon;
            const isSelected = preferredPickupTimeSlot === slot.id;
            return (
              <div
                key={slot.id}
                onClick={() => setPreferredPickupTimeSlot(slot.id)}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-start gap-3 relative overflow-hidden ${
                  isSelected
                    ? 'border-dash-primary bg-dash-primary-soft/50 shadow-sm'
                    : 'border-border hover:border-dash-primary/40 bg-page/50'
                }`}
              >
                <div
                  className={`p-2.5 rounded-lg shrink-0 ${
                    isSelected ? 'bg-dash-primary text-white' : 'bg-surface text-text-secondary'
                  }`}
                >
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-text-primary">{slot.label}</p>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-dash-primary text-white flex items-center justify-center shrink-0">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-dash-primary mt-0.5 font-medium">{slot.time}</p>
                  <p className="text-xs text-text-muted mt-1 truncate">{slot.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preferred Contact Method */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
        <h3 className="text-base font-semibold text-text-primary mb-1 flex items-center gap-2">
          <PhoneCall size={18} className="text-dash-primary" />
          Preferred Communication Channel
        </h3>
        <p className="text-xs text-text-secondary mb-4">
          How assigned volunteers and support leads should contact you regarding pickup updates.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CONTACT_METHODS.map((method) => {
            const Icon = method.icon;
            const isSelected = preferredContactMethod === method.id;
            return (
              <div
                key={method.id}
                onClick={() => setPreferredContactMethod(method.id)}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-start gap-3 relative ${
                  isSelected
                    ? 'border-dash-primary bg-dash-primary-soft/50 shadow-sm'
                    : 'border-border hover:border-dash-primary/40 bg-page/50'
                }`}
              >
                <div
                  className={`p-2.5 rounded-lg shrink-0 ${
                    isSelected ? 'bg-dash-primary text-white' : 'bg-surface text-text-secondary'
                  }`}
                >
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-text-primary">{method.label}</p>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-dash-primary text-white flex items-center justify-center shrink-0">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary mt-1">{method.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Saved Addresses Quick Access Card */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-dash-primary-soft text-dash-primary rounded-xl shrink-0">
            <MapPin size={24} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary">Saved Pickup Addresses</h4>
            <p className="text-xs text-text-secondary mt-0.5">
              Manage your default home, office, or restaurant pickup locations for quick selection.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/donor/addresses')}
          className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover border border-border text-text-primary text-sm font-medium rounded-xl transition-all shrink-0 shadow-xs"
        >
          <span>Manage Saved Addresses</span>
          <ExternalLink size={14} className="text-text-secondary" />
        </button>
      </div>
    </div>
  );
}
