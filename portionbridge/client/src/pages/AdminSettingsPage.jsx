import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft, Lock, Bell, Moon, Shield, UserCog, Sliders,
  Search, Sparkles, User, Settings2, ShieldCheck, Database,
  Globe, AlertTriangle, Users, Activity, CheckCircle, XCircle,
  Loader2, Monitor, Smartphone, Laptop, Key, Download, Clock,
  RefreshCw, Save, Eye, EyeOff, X, Upload, HardDrive,
  ArchiveRestore, FileJson, Info, Trash2,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard';
import { Avatar } from '../components/common/Avatar';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../services/adminApi';
import { profileApi } from '../services/profileApi';

// ---------------------------------------------------------------------------
// Small reusable toggle
// ---------------------------------------------------------------------------
function Toggle({ value, onChange, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
        value ? 'bg-violet-600' : 'bg-surface border border-border/60'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div
        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${
          value ? 'right-1' : 'left-1'
        }`}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Toast notification
// ---------------------------------------------------------------------------
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium animate-fade-in ${
      type === 'success'
        ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
        : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
    }`}>
      {type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
      {message}
      <button onClick={onClose} className="ml-2"><X size={14} /></button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Change Password Modal
// ---------------------------------------------------------------------------
function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (form.newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    setSaving(true);
    try {
      const res = await profileApi.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      if (res.success || res.status === 200 || !res.error) {
        setSuccess(true);
        setTimeout(onClose, 1500);
      } else {
        setError(res.error || 'Failed to change password.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl border border-border/60 shadow-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Key size={18} className="text-violet-600" /> Change Password
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover">
            <X size={18} className="text-text-muted" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle size={40} className="text-emerald-500" />
            <p className="text-sm text-text-primary font-medium">Password changed successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-300">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={form.currentPassword}
                  onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))}
                  required
                  className="w-full px-3 py-2 pr-10 border border-border/60 rounded-lg bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                  {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
                  required
                  className="w-full px-3 py-2 pr-10 border border-border/60 rounded-lg bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-border/60 rounded-lg bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium bg-surface border border-border/60 text-text-secondary rounded-xl hover:bg-surface-hover transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 text-sm font-medium bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Saving...' : 'Change Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sessions Modal
// ---------------------------------------------------------------------------
function SessionsModal({ onClose }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminApi.listSessions();
    if (res.success) setSessions(res.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRevoke = async (id) => {
    setRevoking(id);
    const res = await adminApi.revokeSession(id);
    if (res.success) setSessions((prev) => prev.filter((s) => s.id !== id));
    setRevoking(null);
  };

  const formatDate = (d) => new Date(d).toLocaleString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl border border-border/60 shadow-2xl p-6 w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Monitor size={18} className="text-violet-600" /> Active Sessions
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover">
            <X size={18} className="text-text-muted" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-violet-500" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8">No active sessions found.</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-start justify-between gap-3 p-3 bg-page rounded-xl border border-border/40">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg mt-0.5">
                    <Monitor size={14} className="text-violet-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text-primary truncate max-w-[250px]">
                      {s.userAgent}
                    </p>
                    <p className="text-[11px] text-text-muted mt-0.5">{s.ipAddress}</p>
                    <p className="text-[11px] text-text-muted">Started: {formatDate(s.createdAt)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(s.id)}
                  disabled={revoking === s.id}
                  className="shrink-0 px-2.5 py-1.5 text-[11px] font-medium bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  {revoking === s.id ? <Loader2 size={10} className="animate-spin" /> : 'Revoke'}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center mt-4 pt-4 border-t border-border/40">
          <span className="text-xs text-text-muted">{sessions.length} active session{sessions.length !== 1 ? 's' : ''}</span>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Log Retention Modal
// ---------------------------------------------------------------------------
function LogRetentionModal({ current, onSave, onClose }) {
  const [days, setDays] = useState(current || 90);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(Number(days));
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl border border-border/60 shadow-2xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Clock size={18} className="text-violet-600" /> Log Retention
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover">
            <X size={18} className="text-text-muted" />
          </button>
        </div>
        <p className="text-xs text-text-secondary mb-4">Set how many days audit logs are retained before automatic cleanup.</p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="7"
            max="365"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="flex-1 px-3 py-2 border border-border/60 rounded-lg bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <span className="text-sm text-text-muted">days</span>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium bg-surface border border-border/60 text-text-secondary rounded-xl hover:bg-surface-hover transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 text-sm font-medium bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function AdminSettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');

  // Remote settings state
  const [settings, setSettings] = useState(null);     // null = not loaded yet
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState({});            // { key: true } per toggle
  const [toast, setToast] = useState(null);            // { message, type }

  // Local UI-only appearance state (localStorage)
  const [theme, setTheme] = useState(() => localStorage.getItem('adminTheme') || 'light');
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem('adminCompact') === 'true');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('adminSidebarCollapsed') === 'true');
  const [animationsEnabled, setAnimationsEnabled] = useState(() => localStorage.getItem('adminAnimations') !== 'false');

  // Modal state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [showLogRetention, setShowLogRetention] = useState(false);
  const [exportingLogs, setExportingLogs] = useState(false);

  const tabParam = searchParams.get('tab');
  const activeTab = tabParam && ['security', 'notifications', 'appearance', 'platform', 'audit', 'moderation', 'database'].includes(tabParam)
    ? tabParam
    : 'security';

  const handleTabChange = (tabId) => setSearchParams({ tab: tabId });

  // --- Load settings from backend on mount ---
  useEffect(() => {
    (async () => {
      const res = await adminApi.getAdminSettings();
      if (res.success) {
        setSettings(res.data);
      } else {
        setLoadError(res.error || 'Failed to load settings.');
        // Use defaults
        setSettings({
          emailNotifications: true, pushNotifications: true, smsNotifications: false,
          maintenanceMode: false, registrationEnabled: true, platformName: 'PortionBridge',
          autoModeration: true, spamDetection: true, logRetentionDays: 90,
        });
      }
    })();
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // --- Generic settings toggle/update helpers ---
  const updateSetting = useCallback(async (key, value) => {
    setSaving((p) => ({ ...p, [key]: true }));
    // Optimistic UI update
    setSettings((prev) => ({ ...prev, [key]: value }));
    const res = await adminApi.updateAdminSettings({ [key]: value });
    setSaving((p) => ({ ...p, [key]: false }));
    if (res.success) {
      setSettings(res.data);
      showToast(`${key.replace(/([A-Z])/g, ' $1').trim()} updated.`);
    } else {
      // Rollback
      setSettings((prev) => ({ ...prev, [key]: !value }));
      showToast(res.error || 'Failed to save setting.', 'error');
    }
  }, [showToast]);

  const updatePlatformName = useCallback(async (name) => {
    setSaving((p) => ({ ...p, platformName: true }));
    const res = await adminApi.updateAdminSettings({ platformName: name });
    setSaving((p) => ({ ...p, platformName: false }));
    if (res.success) {
      setSettings(res.data);
      showToast('Platform name updated.');
    } else {
      showToast(res.error || 'Failed to save platform name.', 'error');
    }
  }, [showToast]);

  // Appearance: localStorage only
  const setThemeAndSave = (t) => { setTheme(t); localStorage.setItem('adminTheme', t); };
  const setCompactAndSave = (v) => { setCompactMode(v); localStorage.setItem('adminCompact', String(v)); };
  const setSidebarAndSave = (v) => { setSidebarCollapsed(v); localStorage.setItem('adminSidebarCollapsed', String(v)); };
  const setAnimationsAndSave = (v) => { setAnimationsEnabled(v); localStorage.setItem('adminAnimations', String(v)); };

  const handleExportLogs = async () => {
    setExportingLogs(true);
    const res = await adminApi.exportAuditLogs();
    setExportingLogs(false);
    if (!res.success) showToast(res.error || 'Export failed.', 'error');
    else showToast('Audit logs exported successfully.');
  };

  // ---- Database export/import state ----
  const [exportingDb, setExportingDb] = useState(false);
  const [importingDb, setImportingDb] = useState(false);
  const [importResult, setImportResult] = useState(null); // null | { tablesProcessed, results }
  const [importError, setImportError] = useState('');
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingBackup, setPendingBackup] = useState(null); // parsed JSON object
  const [pendingFilename, setPendingFilename] = useState('');
  const importFileRef = useRef(null);

  const handleExportDb = async () => {
    setExportingDb(true);
    const res = await adminApi.exportDatabase();
    setExportingDb(false);
    if (!res.success) showToast(res.error || 'Export failed.', 'error');
    else showToast('Database exported and downloaded successfully.');
  };

  const [exportingSql, setExportingSql] = useState(false);
  const handleExportDbSql = async () => {
    setExportingSql(true);
    const res = await adminApi.exportDatabaseSql();
    setExportingSql(false);
    if (!res.success) showToast(res.error || 'SQL export failed.', 'error');
    else showToast('SQL backup downloaded — ready for phpMyAdmin / MySQL import!');
  };

  const handleImportFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImportError('');
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed.tables || typeof parsed.tables !== 'object') {
          setImportError('Invalid backup file: missing "tables" key. Please use a file exported by PortionBridge.');
          return;
        }
        setPendingBackup(parsed);
        setPendingFilename(file.name);
        setShowImportConfirm(true);
      } catch {
        setImportError('Could not parse file as JSON. Make sure you selected a valid PortionBridge backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    setShowImportConfirm(false);
    setImportingDb(true);
    setImportError('');
    setImportResult(null);
    const res = await adminApi.importDatabase(pendingBackup);
    setImportingDb(false);
    setPendingBackup(null);
    if (res.success) {
      setImportResult(res.data);
      showToast('Database restored successfully!');
    } else {
      setImportError(res.error || 'Import failed.');
      showToast(res.error || 'Import failed.', 'error');
    }
  };

  const tabs = [
    { id: 'security', label: 'Security & Access', icon: Lock, desc: 'Password, sessions & admin authentication' },
    { id: 'notifications', label: 'Notification Rules', icon: Bell, desc: 'System-wide notification preferences' },
    { id: 'appearance', label: 'Admin Interface', icon: Moon, desc: 'Theme & dashboard customization' },
    { id: 'platform', label: 'Platform Settings', icon: Globe, desc: 'General platform configuration' },
    { id: 'audit', label: 'Audit & Logs', icon: ShieldCheck, desc: 'Activity logs & compliance settings' },
    { id: 'moderation', label: 'Moderation Tools', icon: AlertTriangle, desc: 'Content moderation & spam controls' },
    { id: 'database', label: 'Database Backup', icon: Database, desc: 'Export full DB & restore from backup' },
  ];

  const filteredTabs = tabs.filter((t) =>
    t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLoading = settings === null;

  return (
    <DashboardLayout>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
      {showSessions && <SessionsModal onClose={() => setShowSessions(false)} />}
      {showLogRetention && (
        <LogRetentionModal
          current={settings?.logRetentionDays}
          onSave={(days) => updateSetting('logRetentionDays', days)}
          onClose={() => setShowLogRetention(false)}
        />
      )}

      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 dark:from-violet-800 dark:via-purple-800 dark:to-indigo-900 shadow-pb-elevated p-6 md:p-8">
          <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-pink-400/20 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-sm rounded-xl transition-all shrink-0"
              aria-label="Back to previous page"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 border border-white/30 backdrop-blur-sm">
                  <Settings2 size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">Admin Settings</h1>
                  <p className="text-white/70 text-sm mt-1">Platform administration & configuration</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-border/60 rounded-xl bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
          />
        </div>

        {/* Admin Profile Banner */}
        <div className="bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50 dark:from-violet-900/20 dark:via-purple-900/20 dark:to-indigo-900/20 rounded-2xl border border-violet-200 dark:border-violet-800 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative overflow-hidden">
          <div className="flex items-center gap-4 z-10">
            <div className="relative">
              <Avatar item={user} tone="dash" className="w-16 h-16 rounded-2xl border-2 border-white shadow-md object-cover" />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">✓</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-text-primary">{user?.name || 'Administrator'}</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-violet-600 text-white uppercase tracking-wider">Admin</span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">{user?.email}</p>
              <div className="flex items-center gap-3 text-[11px] text-text-muted mt-2">
                <span>Admin since {user?.created_at ? new Date(user.created_at).getFullYear() : '2026'}</span>
                <span>•</span>
                <span className="text-violet-600 dark:text-violet-400 font-medium flex items-center gap-1">
                  <Sparkles size={12} /> Full Access
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 z-10">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-surface rounded-lg border border-violet-200 dark:border-violet-800">
              <Activity size={14} className="text-violet-600 dark:text-violet-400" />
              <span className="text-xs font-medium text-text-primary">System Active</span>
            </div>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface hover:bg-violet-50 dark:hover:bg-violet-900/20 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 text-xs font-semibold rounded-xl transition-all shadow-xs"
            >
              <Users size={14} />
              <span>Dashboard</span>
            </button>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-surface text-text-secondary hover:bg-surface-hover border border-border/60'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop sidebar */}
          <div className="hidden lg:block lg:col-span-4 space-y-2">
            <div className="bg-surface rounded-2xl border border-border/60 shadow-pb-card p-4 space-y-1">
              <div className="px-3 py-2 text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <Settings2 size={14} /> Admin Settings
              </div>
              {filteredTabs.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-start gap-3 p-3.5 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-bold shadow-xs border border-violet-300 dark:border-violet-700'
                        : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary border border-transparent'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 transition-colors ${
                      isSelected ? 'bg-violet-600 text-white' : 'bg-page text-text-secondary'
                    }`}>
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-tight">{tab.label}</p>
                      <p className="text-[11px] text-text-muted font-normal mt-0.5 truncate">{tab.desc}</p>
                    </div>
                  </button>
                );
              })}
              {filteredTabs.length === 0 && (
                <div className="p-4 text-center text-xs text-text-muted">No matching settings tab found.</div>
              )}
            </div>
          </div>

          {/* Content area */}
          <div className="col-span-1 lg:col-span-8 space-y-6">
            {/* Loading skeleton */}
            {isLoading && (
              <div className="bg-surface rounded-2xl border border-border/60 shadow-pb-card p-8 flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-violet-500" />
              </div>
            )}

            {/* ------------------------------------------------------------------ */}
            {/* TAB: Security & Access                                              */}
            {/* ------------------------------------------------------------------ */}
            {!isLoading && activeTab === 'security' && (
              <div className="bg-surface rounded-2xl border border-border/60 shadow-pb-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                    <Lock size={20} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Security & Access</h3>
                    <p className="text-xs text-text-secondary">Manage your admin account security</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {/* Change Password */}
                  <div className="p-4 bg-page rounded-xl border border-border/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">Password</h4>
                        <p className="text-xs text-text-secondary">Update your admin account password</p>
                      </div>
                      <button
                        onClick={() => setShowChangePassword(true)}
                        className="px-3 py-1.5 text-xs font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                      >
                        Change Password
                      </button>
                    </div>
                  </div>

                  {/* Sessions */}
                  <div className="p-4 bg-page rounded-xl border border-border/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">Active Sessions</h4>
                        <p className="text-xs text-text-secondary">View and manage your active sessions across devices</p>
                      </div>
                      <button
                        onClick={() => setShowSessions(true)}
                        className="px-3 py-1.5 text-xs font-medium bg-surface border border-border/60 rounded-lg hover:bg-surface-hover transition-colors"
                      >
                        Manage Sessions
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------------ */}
            {/* TAB: Notification Rules                                             */}
            {/* ------------------------------------------------------------------ */}
            {!isLoading && activeTab === 'notifications' && (
              <div className="bg-surface rounded-2xl border border-border/60 shadow-pb-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                    <Bell size={20} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Notification Rules</h3>
                    <p className="text-xs text-text-secondary">Configure system-wide notification preferences</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { key: 'emailNotifications', label: 'Email Notifications', desc: 'Send notifications via email' },
                    { key: 'pushNotifications', label: 'Push Notifications', desc: 'Send in-app push notifications' },
                    { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Send notifications via SMS' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="p-4 bg-page rounded-xl border border-border/40">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-text-primary">{label}</h4>
                          <p className="text-xs text-text-secondary">{desc}</p>
                        </div>
                        <Toggle
                          value={!!settings?.[key]}
                          onChange={(v) => updateSetting(key, v)}
                          disabled={!!saving[key]}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------------ */}
            {/* TAB: Appearance (localStorage only)                                */}
            {/* ------------------------------------------------------------------ */}
            {!isLoading && activeTab === 'appearance' && (
              <div className="bg-surface rounded-2xl border border-border/60 shadow-pb-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                    <Moon size={20} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Admin Interface</h3>
                    <p className="text-xs text-text-secondary">Customize admin dashboard appearance</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {/* Theme */}
                  <div className="p-4 bg-page rounded-xl border border-border/40">
                    <h4 className="text-sm font-semibold text-text-primary mb-3">Theme</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {[['light', 'Light', 'bg-gray-100'], ['dark', 'Dark', 'bg-gray-800'], ['auto', 'Auto', 'bg-gradient-to-r from-gray-100 to-gray-800']].map(([val, label, bg]) => (
                        <button
                          key={val}
                          onClick={() => setThemeAndSave(val)}
                          className={`p-3 rounded-xl text-center transition-all ${
                            theme === val
                              ? 'border-2 border-violet-500 shadow-sm '
                              : 'bg-surface border border-border/60 hover:border-violet-300'
                          }`}
                        >
                          <div className={`w-8 h-8 ${bg} rounded-lg mx-auto mb-2`} />
                          <span className="text-xs font-medium text-text-primary">{label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800">
                      <p className="text-xs text-violet-700 dark:text-violet-300">Current theme: <span className="font-semibold capitalize">{theme}</span></p>
                    </div>
                  </div>

                  {/* Compact Mode */}
                  <div className="p-4 bg-page rounded-xl border border-border/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">Compact Mode</h4>
                        <p className="text-xs text-text-secondary">Use more compact interface</p>
                      </div>
                      <Toggle value={compactMode} onChange={setCompactAndSave} />
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="p-4 bg-page rounded-xl border border-border/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">Sidebar Default</h4>
                        <p className="text-xs text-text-secondary">Sidebar collapsed by default</p>
                      </div>
                      <Toggle value={sidebarCollapsed} onChange={setSidebarAndSave} />
                    </div>
                  </div>

                  {/* Animations */}
                  <div className="p-4 bg-page rounded-xl border border-border/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">Animations</h4>
                        <p className="text-xs text-text-secondary">Enable interface animations</p>
                      </div>
                      <Toggle value={animationsEnabled} onChange={setAnimationsAndSave} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------------ */}
            {/* TAB: Platform Settings                                              */}
            {/* ------------------------------------------------------------------ */}
            {!isLoading && activeTab === 'platform' && (
              <div className="bg-surface rounded-2xl border border-border/60 shadow-pb-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                    <Globe size={20} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Platform Settings</h3>
                    <p className="text-xs text-text-secondary">General platform configuration</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {/* Maintenance Mode */}
                  <div className="p-4 bg-page rounded-xl border border-border/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">Maintenance Mode</h4>
                        <p className="text-xs text-text-secondary">Put platform in maintenance mode</p>
                      </div>
                      {saving.maintenanceMode ? (
                        <Loader2 size={18} className="animate-spin text-violet-500" />
                      ) : (
                        <Toggle
                          value={!!settings?.maintenanceMode}
                          onChange={(v) => updateSetting('maintenanceMode', v)}
                        />
                      )}
                    </div>
                  </div>

                  {/* Registration */}
                  <div className="p-4 bg-page rounded-xl border border-border/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">Registration</h4>
                        <p className="text-xs text-text-secondary">Allow new user registrations</p>
                      </div>
                      {saving.registrationEnabled ? (
                        <Loader2 size={18} className="animate-spin text-violet-500" />
                      ) : (
                        <Toggle
                          value={!!settings?.registrationEnabled}
                          onChange={(v) => updateSetting('registrationEnabled', v)}
                        />
                      )}
                    </div>
                  </div>

                  {/* Platform Name */}
                  <div className="p-4 bg-page rounded-xl border border-border/40">
                    <h4 className="text-sm font-semibold text-text-primary mb-3">Platform Name</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={settings?.platformName ?? 'PortionBridge'}
                        onChange={(e) => setSettings((p) => ({ ...p, platformName: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-border/60 rounded-lg bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                      <button
                        onClick={() => updatePlatformName(settings?.platformName)}
                        disabled={saving.platformName}
                        className="px-3 py-2 text-xs font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-60 flex items-center gap-1"
                      >
                        {saving.platformName ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------------ */}
            {/* TAB: Audit & Logs                                                   */}
            {/* ------------------------------------------------------------------ */}
            {!isLoading && activeTab === 'audit' && (
              <div className="bg-surface rounded-2xl border border-border/60 shadow-pb-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                    <ShieldCheck size={20} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Audit & Logs</h3>
                    <p className="text-xs text-text-secondary">Activity logs & compliance settings</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {/* Log Retention */}
                  <div className="p-4 bg-page rounded-xl border border-border/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">Log Retention</h4>
                        <p className="text-xs text-text-secondary">
                          Keep logs for <span className="font-semibold text-violet-600">{settings?.logRetentionDays ?? 90}</span> days
                        </p>
                      </div>
                      <button
                        onClick={() => setShowLogRetention(true)}
                        className="px-3 py-1.5 text-xs font-medium bg-surface border border-border/60 rounded-lg hover:bg-surface-hover transition-colors"
                      >
                        Configure
                      </button>
                    </div>
                  </div>

                  {/* Export Logs */}
                  <div className="p-4 bg-page rounded-xl border border-border/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">Export Logs</h4>
                        <p className="text-xs text-text-secondary">Download all activity logs as CSV</p>
                      </div>
                      <button
                        onClick={handleExportLogs}
                        disabled={exportingLogs}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-60"
                      >
                        {exportingLogs ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                        {exportingLogs ? 'Exporting...' : 'Export'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------------ */}
            {/* TAB: Moderation Tools                                               */}
            {/* ------------------------------------------------------------------ */}
            {!isLoading && activeTab === 'moderation' && (
              <div className="bg-surface rounded-2xl border border-border/60 shadow-pb-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                    <AlertTriangle size={20} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Moderation Tools</h3>
                    <p className="text-xs text-text-secondary">Content moderation & spam controls</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { key: 'autoModeration', label: 'Auto-Moderation', desc: 'Enable automatic content filtering' },
                    { key: 'spamDetection', label: 'Spam Detection', desc: 'Enable spam detection algorithms' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="p-4 bg-page rounded-xl border border-border/40">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-text-primary">{label}</h4>
                          <p className="text-xs text-text-secondary">{desc}</p>
                        </div>
                        <Toggle
                          value={!!settings?.[key]}
                          onChange={(v) => updateSetting(key, v)}
                          disabled={!!saving[key]}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------------ */}
            {/* TAB: Database Backup                                                */}
            {/* ------------------------------------------------------------------ */}
            {!isLoading && activeTab === 'database' && (
              <div className="space-y-6">
                {/* Import confirmation modal */}
                {showImportConfirm && pendingBackup && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-surface rounded-2xl border border-border/60 shadow-2xl p-6 w-full max-w-lg mx-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-xl">
                          <AlertTriangle size={22} className="text-red-600" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-text-primary">Confirm Database Restore</h3>
                          <p className="text-xs text-text-secondary mt-0.5">This will overwrite all existing data</p>
                        </div>
                      </div>

                      {/* Backup metadata */}
                      {pendingBackup.metadata && (
                        <div className="p-3 bg-page rounded-xl border border-border/40 mb-4 space-y-1.5">
                          <p className="text-xs font-medium text-text-primary flex items-center gap-1.5">
                            <FileJson size={13} className="text-violet-500" />
                            {pendingFilename}
                          </p>
                          {pendingBackup.metadata.exportedAt && (
                            <p className="text-xs text-text-muted">
                              Exported: {new Date(pendingBackup.metadata.exportedAt).toLocaleString()}
                            </p>
                          )}
                          <p className="text-xs text-text-muted">
                            Tables: {pendingBackup.metadata.tableCount ?? Object.keys(pendingBackup.tables).length}
                          </p>
                          {pendingBackup.metadata.rowCounts && (
                            <div className="mt-2 max-h-36 overflow-y-auto space-y-1">
                              {Object.entries(pendingBackup.metadata.rowCounts).map(([t, n]) => (
                                <div key={t} className="flex justify-between text-[11px] text-text-muted">
                                  <span className="font-mono">{t}</span>
                                  <span>{n} rows</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mb-5">
                        <p className="text-xs text-red-700 dark:text-red-300 font-medium">
                          ⚠️ All current data in every table listed above will be <strong>permanently replaced</strong>.
                          This cannot be undone. Make sure you have a fresh export before proceeding.
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => { setShowImportConfirm(false); setPendingBackup(null); }}
                          className="flex-1 px-4 py-2.5 text-sm font-medium bg-surface border border-border/60 text-text-secondary rounded-xl hover:bg-surface-hover transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleConfirmImport}
                          className="flex-1 px-4 py-2.5 text-sm font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <ArchiveRestore size={14} />
                          Yes, Restore Database
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hidden file input */}
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportFileChange}
                  className="hidden"
                />

                {/* Export card */}
                <div className="bg-surface rounded-2xl border border-border/60 shadow-pb-card p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                      <HardDrive size={20} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">Export Full Database</h3>
                      <p className="text-xs text-text-secondary">Download every table as a JSON or SQL backup file</p>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200 dark:border-emerald-800/50 rounded-xl mb-5">
                    <ul className="space-y-1.5">
                      {[
                        'Exports ALL tables — users, donations, volunteers, teams, audit logs, etc.',
                        'Save the file somewhere safe (your computer, Google Drive, etc.)',
                        'If the database is ever wiped or corrupted, use Import (JSON) to restore via PortionBridge',
                        'Use SQL export to restore directly in phpMyAdmin, MySQL CLI, or any SQL tool',
                      ].map((txt) => (
                        <li key={txt} className="flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                          <CheckCircle size={13} className="mt-0.5 shrink-0 text-emerald-600" />
                          {txt}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Two export buttons side by side */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      id="admin-db-export-btn"
                      onClick={handleExportDb}
                      disabled={exportingDb || exportingSql}
                      className="w-full flex items-center justify-center gap-2.5 px-5 py-3 text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all disabled:opacity-60 shadow-md hover:shadow-lg active:scale-[0.99]"
                    >
                      {exportingDb ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                      {exportingDb ? 'Exporting…' : 'Export as JSON'}
                    </button>

                    <button
                      id="admin-db-export-sql-btn"
                      onClick={handleExportDbSql}
                      disabled={exportingDb || exportingSql}
                      className="w-full flex items-center justify-center gap-2.5 px-5 py-3 text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all disabled:opacity-60 shadow-md hover:shadow-lg active:scale-[0.99]"
                    >
                      {exportingSql ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                      {exportingSql ? 'Exporting SQL…' : 'Export as SQL (.sql)'}
                    </button>
                  </div>

                  <p className="mt-2 text-center text-xs text-text-muted">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">SQL file</span> can be imported directly in <strong>phpMyAdmin</strong>, <strong>MySQL CLI</strong>, <strong>DBeaver</strong>, or <strong>MySQL Workbench</strong>.
                  </p>
                </div>

                {/* Import card */}
                <div className="bg-surface rounded-2xl border border-border/60 shadow-pb-card p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                      <ArchiveRestore size={20} className="text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">Import & Restore</h3>
                      <p className="text-xs text-text-secondary">Restore all data from a previously exported backup file</p>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/50 rounded-xl mb-5 flex items-start gap-2.5">
                    <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-600" />
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      <strong>Destructive operation.</strong> Importing will <strong>overwrite</strong> all data in every table included
                      in the backup. Export a fresh backup first if you want to preserve current data.
                    </p>
                  </div>

                  {/* Import error */}
                  {importError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mb-4 flex items-start gap-2">
                      <XCircle size={14} className="shrink-0 mt-0.5 text-red-500" />
                      <p className="text-xs text-red-700 dark:text-red-300">{importError}</p>
                    </div>
                  )}

                  {/* Import success result */}
                  {importResult && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200 dark:border-emerald-800/50 rounded-xl mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle size={16} className="text-emerald-600" />
                        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Restore Successful</p>
                      </div>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 mb-2">
                        {importResult.tablesProcessed} tables processed at {new Date(importResult.importedAt).toLocaleString()}
                      </p>
                      <div className="max-h-44 overflow-y-auto space-y-1">
                        {Object.entries(importResult.results || {}).map(([table, res]) => (
                          <div key={table} className="flex justify-between text-[11px] text-emerald-700 dark:text-emerald-400">
                            <span className="font-mono">{table}</span>
                            <span>
                              {res.skipped
                                ? `⏭ skipped (${res.reason})`
                                : `✓ ${res.restored} rows restored`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    id="admin-db-import-btn"
                    onClick={() => importFileRef.current?.click()}
                    disabled={importingDb}
                    className="w-full flex items-center justify-center gap-2.5 px-5 py-3 text-sm font-bold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl transition-all disabled:opacity-60 shadow-md hover:shadow-lg active:scale-[0.99]"
                  >
                    {importingDb ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    {importingDb ? 'Restoring Database…' : 'Select Backup File to Restore'}
                  </button>
                </div>

                {/* How-to guide */}
                <div className="bg-surface rounded-2xl border border-border/60 shadow-pb-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Info size={16} className="text-violet-500" />
                    <h4 className="text-sm font-bold text-text-primary">How to use Backup & Restore</h4>
                  </div>
                  <ol className="space-y-3">
                    {[
                      { step: '1', title: 'Export before anything risky', body: 'Always click "Export & Download Backup" before running seed scripts, making schema changes, or doing bulk updates.' },
                      { step: '2', title: 'Store the backup file safely', body: 'Save the downloaded .json file to a secure location (Google Drive, external drive, etc.). One file holds the entire database.' },
                      { step: '3', title: 'Restore when needed', body: 'If data is lost or corrupted, click "Select Backup File to Restore", choose the .json backup, review the table list in the confirmation dialog, then confirm.' },
                      { step: '4', title: 'After restore', body: 'Refresh the page and verify your data is back. The restore replaces all table data — relationships and settings are preserved exactly as they were at export time.' },
                    ].map(({ step, title, body }) => (
                      <li key={step} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center">{step}</span>
                        <div>
                          <p className="text-xs font-semibold text-text-primary">{title}</p>
                          <p className="text-xs text-text-secondary mt-0.5">{body}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}