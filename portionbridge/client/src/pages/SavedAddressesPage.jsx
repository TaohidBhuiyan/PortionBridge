import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Plus,
  MapPin,
  Star,
  Pencil,
  Trash2,
  Phone,
  User,
  Loader2,
  Building,
  Layers,
  Compass,
  Sparkles,
  ExternalLink,
  Info,
} from 'lucide-react';
import { DashboardLayout } from '../components/dashboard';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { ConfirmActionModal } from '../components/common/ConfirmActionModal';
import { EmptyState } from '../components/dashboard/EmptyState';
import { ErrorState } from '../components/dashboard/ErrorState';
import { AddressLocationPicker } from '../components/dashboard/donor/AddressLocationPicker';
import { savedAddressApi } from '../services/savedAddressApi';

const LABELS = [
  { value: 'home', text: 'Home' },
  { value: 'office', text: 'Office' },
  { value: 'other', text: 'Other' },
  { value: 'custom', text: 'Custom' },
];

const EMPTY_FORM = {
  label: 'home',
  customLabel: '',
  fullAddress: '',
  division: '',
  district: '',
  area: '',
  postalCode: '',
  buildingName: '',
  floor: '',
  landmark: '',
  deliveryInstructions: '',
  latitude: null,
  longitude: null,
  contactPersonName: '',
  contactPhone: '',
  isDefault: false,
};

/**
 * Saved Addresses — Donor pickup-address management.
 *
 * Provides:
 * 1. Interactive Leaflet map allocation (search or click/drag to pin).
 * 2. High-accuracy GPS location detection with reverse geocoding of Area/Thana/District/Division.
 * 3. Dedicated manual input fields for Building Name/No., Apartment/Flat/Floor, and Landmark.
 * 4. CRUD operations with single-default invariant handling.
 */
export function SavedAddressesPage() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [settingDefaultId, setSettingDefaultId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await savedAddressApi.getAll();
    if (result.success) {
      setAddresses(result.data.addresses || []);
    } else {
      setError(result.message || 'Failed to load saved addresses.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount pattern used throughout this codebase
    load();
  }, [load]);

  const openAddModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (addr) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label,
      customLabel: addr.custom_label || '',
      fullAddress: addr.full_address || '',
      division: addr.division || '',
      district: addr.district || '',
      area: addr.area || '',
      postalCode: addr.postal_code || '',
      buildingName: addr.building_name || '',
      floor: addr.floor || '',
      landmark: addr.landmark || '',
      deliveryInstructions: addr.delivery_instructions || '',
      latitude: addr.latitude !== null && addr.latitude !== undefined ? Number(addr.latitude) : null,
      longitude: addr.longitude !== null && addr.longitude !== undefined ? Number(addr.longitude) : null,
      contactPersonName: addr.contact_person_name || '',
      contactPhone: addr.contact_phone || '',
      isDefault: !!addr.is_default,
    });
    setModalOpen(true);
  };

  // Called when user selects or updates location via map click, drag, search, or GPS
  const handleLocationChange = useCallback((loc) => {
    setForm((prev) => {
      const next = {
        ...prev,
        latitude: loc.latitude,
        longitude: loc.longitude,
      };

      if (loc.division) next.division = loc.division;
      if (loc.district) next.district = loc.district;
      if (loc.area) next.area = loc.area;
      if (loc.postalCode) next.postalCode = loc.postalCode;

      // If full address is blank, compose initial suggestion
      if (!prev.fullAddress.trim()) {
        const parts = [
          prev.buildingName,
          prev.floor,
          loc.road,
          loc.area,
          loc.district,
        ].filter(Boolean);
        if (parts.length > 0) {
          next.fullAddress = parts.join(', ');
        }
      }

      return next;
    });
  }, []);

  // Quick helper to synthesize full address from manual building details + auto-filled area
  const handleAutoGenerateAddress = () => {
    const parts = [
      form.buildingName,
      form.floor,
      form.landmark ? `Near ${form.landmark}` : '',
      form.area,
      form.district,
      form.division,
    ].filter(Boolean);

    if (parts.length > 0) {
      setForm((f) => ({ ...f, fullAddress: parts.join(', ') }));
      toast.success('Address generated from building & area details');
    } else {
      toast.error('Please enter Building Name and Area first');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      latitude: typeof form.latitude === 'number' ? form.latitude : null,
      longitude: typeof form.longitude === 'number' ? form.longitude : null,
      customLabel: form.label === 'custom' ? form.customLabel : undefined,
    };

    const result = editingId
      ? await savedAddressApi.update(editingId, payload)
      : await savedAddressApi.create(payload);

    if (result.success) {
      toast.success(editingId ? 'Address updated.' : 'Address saved.');
      setModalOpen(false);
      load();
    } else {
      toast.error(result.message || 'Failed to save address.');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await savedAddressApi.remove(deleteTarget.id);
    if (result.success) {
      toast.success('Address deleted.');
      setDeleteTarget(null);
      load();
    } else {
      toast.error(result.message || 'Failed to delete address.');
    }
    setDeleting(false);
  };

  const handleSetDefault = async (id) => {
    setSettingDefaultId(id);
    const result = await savedAddressApi.setDefault(id);
    if (result.success) {
      toast.success('Default address updated.');
      load();
    } else {
      toast.error(result.message || 'Failed to set default address.');
    }
    setSettingDefaultId(null);
  };

  const labelText = (addr) => (addr.label === 'custom' ? addr.custom_label : LABELS.find((l) => l.value === addr.label)?.text || addr.label);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-3"
        >
          <ArrowLeft size={16} />
          <span className="font-medium">Back</span>
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Saved Addresses</h1>
            <p className="text-sm text-text-secondary mt-1">
              Manage your pickup addresses with exact map coordinates and building details.
            </p>
          </div>
          <Button onClick={openAddModal} icon={Plus}>Add Address</Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-surface rounded-xl border border-border p-5 h-48 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <ErrorState title="Failed to load addresses" message={error} onRetry={load} />
        ) : addresses.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No saved addresses yet"
            description="Save a pickup address here with pinpoint map accuracy so volunteers can reach your pickup location effortlessly."
            actionLabel="Add Address"
            onAction={openAddModal}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {addresses.map((addr, index) => (
              <Card
                key={addr.id}
                interactive
                style={{ animation: 'rowIn 0.25s ease backwards', animationDelay: `${index * 40}ms` }}
                className={addr.is_default ? 'border-dash-primary/40 bg-dash-primary-soft/30' : ''}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-dash-primary-soft text-dash-primary">
                      {labelText(addr)}
                    </span>
                    {!!addr.is_default && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-warning">
                        <Star size={11} className="fill-warning" /> Default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(addr)}
                      aria-label={`Edit ${labelText(addr)} address`}
                      className="p-1.5 rounded-md hover:bg-surface-hover text-text-secondary transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(addr)}
                      aria-label={`Delete ${labelText(addr)} address`}
                      className="p-1.5 rounded-md hover:bg-danger-soft text-text-secondary hover:text-danger transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-text-primary font-medium">{addr.full_address}</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {[addr.area, addr.district, addr.division].filter(Boolean).join(', ')}
                </p>

                {/* Building / Flat / Landmark pills */}
                {(addr.building_name || addr.floor || addr.landmark) && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px] text-text-secondary">
                    {addr.building_name && (
                      <span className="inline-flex items-center gap-1 bg-surface-hover px-2 py-0.5 rounded border border-border/50">
                        <Building size={11} className="text-dash-primary" />
                        <span className="font-medium text-text-primary">{addr.building_name}</span>
                      </span>
                    )}
                    {addr.floor && (
                      <span className="inline-flex items-center gap-1 bg-surface-hover px-2 py-0.5 rounded border border-border/50">
                        <Layers size={11} className="text-dash-primary" />
                        <span>{addr.floor}</span>
                      </span>
                    )}
                    {addr.landmark && (
                      <span className="inline-flex items-center gap-1 bg-surface-hover px-2 py-0.5 rounded border border-border/50">
                        <Compass size={11} className="text-text-secondary" />
                        <span>{addr.landmark}</span>
                      </span>
                    )}
                  </div>
                )}

                {/* GPS Coordinates pill */}
                {typeof addr.latitude === 'number' && typeof addr.longitude === 'number' && (
                  <div className="mt-2.5 flex items-center justify-between text-[11px]">
                    <span className="inline-flex items-center gap-1 text-text-secondary bg-surface-hover/80 px-2 py-0.5 rounded border border-border/50 font-mono">
                      <MapPin size={11} className="text-emerald-500" />
                      {Number(addr.latitude).toFixed(4)}, {Number(addr.longitude).toFixed(4)}
                    </span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${addr.latitude},${addr.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-dash-primary hover:underline text-[11px]"
                    >
                      <span>View Map</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                )}

                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50 text-xs text-text-secondary">
                  <span className="flex items-center gap-1"><User size={11} /> {addr.contact_person_name}</span>
                  <span className="flex items-center gap-1"><Phone size={11} /> {addr.contact_phone}</span>
                </div>

                {!addr.is_default && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    disabled={settingDefaultId === addr.id}
                    className="mt-3 text-xs font-medium text-dash-primary hover:text-dash-primary-hover disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {settingDefaultId === addr.id && <Loader2 size={11} className="animate-spin" />}
                    Set as default
                  </button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Address Form Modal */}
      {modalOpen && (
        <Modal
          title={editingId ? 'Edit Address' : 'Add Pickup Address'}
          onClose={() => setModalOpen(false)}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[78vh] overflow-y-auto pr-1">
            {/* 1. Map & Location Allocation */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider">
                  Pickup Location & Map Pin *
                </label>
                <span className="text-[11px] text-text-secondary">
                  Move pin or use GPS to auto-detect Area & Thana
                </span>
              </div>
              <AddressLocationPicker
                latitude={form.latitude}
                longitude={form.longitude}
                onChange={handleLocationChange}
              />
            </div>

            {/* 2. Auto-filled Geographical Info */}
            <div className="bg-surface-hover/50 p-3 rounded-xl border border-border/70 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                  <MapPin size={13} className="text-dash-primary" />
                  <span>Area, Thana & District</span>
                </span>
                <span className="text-[11px] text-dash-primary bg-dash-primary-soft px-2 py-0.5 rounded-full font-medium">
                  Auto-filled from map / GPS
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-text-secondary mb-1">Division *</label>
                  <input
                    required
                    value={form.division}
                    onChange={(e) => setForm((f) => ({ ...f, division: e.target.value }))}
                    placeholder="e.g. Dhaka"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-input text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-dash-primary/20 focus:border-dash-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-text-secondary mb-1">District *</label>
                  <input
                    required
                    value={form.district}
                    onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                    placeholder="e.g. Dhaka"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-input text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-dash-primary/20 focus:border-dash-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-text-secondary mb-1">Area / Thana *</label>
                  <input
                    required
                    value={form.area}
                    onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
                    placeholder="e.g. Dhanmondi / Mirpur"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-input text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-dash-primary/20 focus:border-dash-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-text-secondary mb-1">Postal Code</label>
                  <input
                    value={form.postalCode}
                    onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
                    placeholder="e.g. 1205"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-input text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-dash-primary/20 focus:border-dash-primary"
                  />
                </div>
              </div>
            </div>

            {/* 3. Manual Building & Apartment Details */}
            <div className="bg-surface-hover/30 p-3 rounded-xl border border-border/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                  <Building size={13} className="text-dash-primary" />
                  <span>Building & Apartment Details</span>
                </span>
                <span className="text-[11px] text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full font-medium">
                  Enter Manually
                </span>
              </div>

              <div className="flex items-start gap-1.5 text-[11px] text-text-secondary bg-surface p-2 rounded-lg border border-border/50">
                <Info size={14} className="text-dash-primary shrink-0 mt-0.5" />
                <span>
                  GPS detects the area and coordinates, but building name and apartment details must be entered manually for volunteer pickup.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-text-secondary mb-1">
                    Building Name / House No. / Holding *
                  </label>
                  <input
                    value={form.buildingName}
                    onChange={(e) => setForm((f) => ({ ...f, buildingName: e.target.value }))}
                    placeholder="e.g. House 42, Road 9/A or Green Tower"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-input text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-dash-primary/20 focus:border-dash-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-text-secondary mb-1">
                    Apartment / Flat / Floor No. *
                  </label>
                  <input
                    value={form.floor}
                    onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))}
                    placeholder="e.g. Flat 3B, 2nd Floor"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-input text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-dash-primary/20 focus:border-dash-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-text-secondary mb-1">Landmark (Nearby prominent place)</label>
                <input
                  value={form.landmark}
                  onChange={(e) => setForm((f) => ({ ...f, landmark: e.target.value }))}
                  placeholder="e.g. Opposite to Dhanmondi Lake or near City College"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-input text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-dash-primary/20 focus:border-dash-primary"
                />
              </div>

              {/* Full Address */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-medium text-text-secondary">Full Formatted Address *</label>
                  <button
                    type="button"
                    onClick={handleAutoGenerateAddress}
                    className="text-[11px] text-dash-primary hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    <Sparkles size={11} />
                    <span>Auto-generate from fields</span>
                  </button>
                </div>
                <textarea
                  required
                  rows={2}
                  value={form.fullAddress}
                  onChange={(e) => setForm((f) => ({ ...f, fullAddress: e.target.value }))}
                  placeholder="e.g. Flat 3B, House 42, Road 9/A, Dhanmondi, Dhaka"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-input text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-dash-primary/20 focus:border-dash-primary"
                />
              </div>
            </div>

            {/* 4. Contact Details & Instructions */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Contact Person Name *</label>
                  <input
                    required
                    value={form.contactPersonName}
                    onChange={(e) => setForm((f) => ({ ...f, contactPersonName: e.target.value }))}
                    placeholder="e.g. Taohid Bhuiyan"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-dash-primary/20 focus:border-dash-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Contact Phone *</label>
                  <input
                    required
                    value={form.contactPhone}
                    onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                    placeholder="e.g. +88017XXXXXXXX"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-dash-primary/20 focus:border-dash-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Pickup / Delivery Instructions</label>
                <input
                  value={form.deliveryInstructions}
                  onChange={(e) => setForm((f) => ({ ...f, deliveryInstructions: e.target.value }))}
                  placeholder="e.g. Call when arriving, elevator available, ring flat 3B bell"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-dash-primary/20 focus:border-dash-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Address Label</label>
                  <select
                    value={form.label}
                    onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-dash-primary/20 focus:border-dash-primary"
                  >
                    {LABELS.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.text}
                      </option>
                    ))}
                  </select>
                </div>

                {form.label === 'custom' && (
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Custom Label Name *</label>
                    <input
                      required
                      value={form.customLabel}
                      onChange={(e) => setForm((f) => ({ ...f, customLabel: e.target.value }))}
                      placeholder="e.g. Warehouse / Hostel"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-input text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-dash-primary/20 focus:border-dash-primary"
                    />
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 text-xs sm:text-sm text-text-primary pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                  className="rounded border-border text-dash-primary focus:ring-dash-primary/40"
                />
                <span>Set as my default pickup address</span>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-2 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" loading={saving} className="flex-1">
                {editingId ? 'Save Changes' : 'Add Address'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmActionModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Address"
        message={`Are you sure you want to delete "${deleteTarget ? labelText(deleteTarget) : ''}"? This cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleting}
        tone="danger"
      />
    </DashboardLayout>
  );
}
