import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, MapPin, Star, Pencil, Trash2, Phone, User, Loader2 } from 'lucide-react';
import { DashboardLayout } from '../components/dashboard';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { ConfirmActionModal } from '../components/common/ConfirmActionModal';
import { EmptyState } from '../components/dashboard/EmptyState';
import { ErrorState } from '../components/dashboard/ErrorState';
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
  contactPersonName: '',
  contactPhone: '',
  isDefault: false,
};

/**
 * Saved Addresses — Donor pickup-address management.
 *
 * The backend (saved_addresses table + full CRUD routes) already existed
 * and was complete; the only frontend surface for it was a read-only
 * dropdown inside donation creation with no way to add/edit/delete an
 * address independently. This is a new, standalone management page —
 * built from the shared Card/Button/Modal/ConfirmActionModal/EmptyState
 * primitives already used across the rest of the donor dashboard, so it
 * inherits the same visual language without introducing anything new.
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
      contactPersonName: addr.contact_person_name || '',
      contactPhone: addr.contact_phone || '',
      isDefault: !!addr.is_default,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, customLabel: form.label === 'custom' ? form.customLabel : undefined };
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
              Manage the pickup addresses you use when creating donations.
            </p>
          </div>
          <Button onClick={openAddModal} icon={Plus}>Add Address</Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-surface rounded-xl border border-border p-5 h-40 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <ErrorState title="Failed to load addresses" message={error} onRetry={load} />
        ) : addresses.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No saved addresses yet"
            description="Save a pickup address here so you don't have to type it every time you create a donation."
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

      {modalOpen && (
        <Modal title={editingId ? 'Edit Address' : 'Add Address'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Label</label>
              <select
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-dash-primary/10 focus:border-dash-primary"
              >
                {LABELS.map((l) => <option key={l.value} value={l.value}>{l.text}</option>)}
              </select>
            </div>

            {form.label === 'custom' && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Custom Label</label>
                <input
                  required
                  value={form.customLabel}
                  onChange={(e) => setForm((f) => ({ ...f, customLabel: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-dash-primary/10 focus:border-dash-primary"
                  placeholder="e.g. Warehouse"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Full Address *</label>
              <textarea
                required
                rows={2}
                value={form.fullAddress}
                onChange={(e) => setForm((f) => ({ ...f, fullAddress: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-dash-primary/10 focus:border-dash-primary"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Division *</label>
                <input required value={form.division} onChange={(e) => setForm((f) => ({ ...f, division: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-dash-primary/10 focus:border-dash-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">District *</label>
                <input required value={form.district} onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-dash-primary/10 focus:border-dash-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Area *</label>
                <input required value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-dash-primary/10 focus:border-dash-primary" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Contact Person *</label>
                <input required value={form.contactPersonName} onChange={(e) => setForm((f) => ({ ...f, contactPersonName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-dash-primary/10 focus:border-dash-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Contact Phone *</label>
                <input required value={form.contactPhone} onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-dash-primary/10 focus:border-dash-primary" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Landmark</label>
                <input value={form.landmark} onChange={(e) => setForm((f) => ({ ...f, landmark: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-dash-primary/10 focus:border-dash-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Delivery Instructions</label>
                <input value={form.deliveryInstructions} onChange={(e) => setForm((f) => ({ ...f, deliveryInstructions: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-dash-primary/10 focus:border-dash-primary" />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-text-primary pt-1">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                className="rounded border-border text-dash-primary focus:ring-dash-primary/40"
              />
              Set as default address
            </label>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
              <Button type="submit" loading={saving} className="flex-1">{editingId ? 'Save Changes' : 'Add Address'}</Button>
            </div>
          </form>
        </Modal>
      )}

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
