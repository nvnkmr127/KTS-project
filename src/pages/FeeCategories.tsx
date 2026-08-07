import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, AlertCircle, Tags, ShieldAlert, MapPin, Search, CheckCircle, Bus, Pencil, Check, X, AlertTriangle } from 'lucide-react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export interface FeeCategory {
  id: string;
  name: string;
  description: string | null;
  status: string;
}

export interface VillageRate {
  id: string;
  village: string;
  amount: number;
}

const DEMO_VILLAGE_RATES: VillageRate[] = [
  { id: '1', village: 'Chevella', amount: 7000 },
  { id: '2', village: 'Urella', amount: 7500 },
  { id: '3', village: 'DharmaSagar', amount: 8000 },
  { id: '4', village: 'Devuni Yerravally', amount: 8000 },
  { id: '5', village: 'Nyalata', amount: 9000 },
  { id: '6', village: 'Mirzaguda', amount: 9000 },
  { id: '7', village: 'Malkapur', amount: 7000 },
  { id: '8', village: 'Kesaram', amount: 6500 },
  { id: '9', village: 'Jajugutta', amount: 8500 },
  { id: '10', village: 'Gollapally', amount: 8500 },
  { id: '11', village: 'Damarigidda', amount: 9000 },
  { id: '12', village: 'Dall Company', amount: 8500 },
  { id: '13', village: 'Ramannaguda', amount: 9000 },
  { id: '14', village: 'Pamena', amount: 9500 },
  { id: '15', village: 'Allada', amount: 9500 },
  { id: '16', village: 'Bastepur', amount: 10000 },
  { id: '17', village: 'Chanvally', amount: 11500 },
  { id: '18', village: 'Nancheri', amount: 11500 },
  { id: '19', village: 'Kammeta', amount: 11500 },
  { id: '20', village: 'Yenkapally Gate', amount: 11000 },
  { id: '21', village: 'Khanapur Gate', amount: 11000 },
  { id: '22', village: 'Gollaguda', amount: 12000 },
  { id: '23', village: 'Khanapuram', amount: 11500 },
  { id: '24', village: 'Ghanapur', amount: 12000 },
  { id: '25', village: 'Devarampally', amount: 12000 },
  { id: '26', village: 'Kothapally', amount: 12500 },
  { id: '27', village: 'Koukuntla', amount: 12500 },
  { id: '28', village: 'Antaram', amount: 12500 },
  { id: '29', village: 'Aloor', amount: 12500 },
  { id: '30', village: 'Hastepur', amount: 12500 },
  { id: '31', village: 'Pragathi', amount: 13500 },
  { id: '32', village: 'Singappaguda', amount: 9000 },
  { id: '33', village: 'Ibramhimpally', amount: 9000 },
  { id: '34', village: 'Tangedipally', amount: 12000 },
  { id: '35', village: 'Yetla Erravelly', amount: 12500 },
  { id: '36', village: 'Nagarguda', amount: 12500 },
  { id: '37', village: 'Kandada', amount: 9000 },
  { id: '38', village: 'Palgutta', amount: 9000 },
];

export function FeeCategories() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'super_admin' || user?.roles?.includes('admin') || user?.roles?.includes('super-admin');

  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Village/Area rates state
  const [villageRatesMap, setVillageRatesMap] = useState<Record<string, VillageRate[]>>({});
  const [settingId, setSettingId] = useState<string | null>(null);
  const [selectedCategoryForRates, setSelectedCategoryForRates] = useState<FeeCategory | null>(null);
  const [showRatesModal, setShowRatesModal] = useState(false);
  const [activeCategoryRates, setActiveCategoryRates] = useState<VillageRate[]>([]);
  const [newVillageName, setNewVillageName] = useState('');
  const [newVillageAmount, setNewVillageAmount] = useState('');
  const [ratesSearch, setRatesSearch] = useState('');
  const [savingRates, setSavingRates] = useState(false);

  // Inline edit rate state
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [editingVillageName, setEditingVillageName] = useState('');
  const [editingVillageAmount, setEditingVillageAmount] = useState('');

  // Edit Category state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FeeCategory | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);

  // Delete Warning state
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<FeeCategory | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await api.getResources('fee-categories');
      setCategories(data);
    } catch (err) {
      console.error('Error loading fee categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadVillageRates = async () => {
    try {
      const res = await api.getResources('settings', { key: 'kts_fee_category_village_rates' });
      if (Array.isArray(res) && res.length > 0) {
        setSettingId(String(res[0].id));
        if (res[0].value) {
          const parsed = JSON.parse(res[0].value);
          setVillageRatesMap(parsed);
          localStorage.setItem('kts_fee_category_village_rates', JSON.stringify(parsed));
        }
      } else {
        const local = localStorage.getItem('kts_fee_category_village_rates');
        if (local) {
          setVillageRatesMap(JSON.parse(local));
        }
      }
    } catch (err) {
      console.error('Error loading village rates setting:', err);
      const local = localStorage.getItem('kts_fee_category_village_rates');
      if (local) {
        setVillageRatesMap(JSON.parse(local));
      }
    }
  };

  useEffect(() => {
    loadCategories();
    loadVillageRates();
  }, []);

  const saveVillageRatesMap = async (updatedMap: Record<string, VillageRate[]>) => {
    setSavingRates(true);
    try {
      const valueStr = JSON.stringify(updatedMap);
      setVillageRatesMap(updatedMap);
      localStorage.setItem('kts_fee_category_village_rates', valueStr);
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'kts_fee_category_village_rates',
        newValue: valueStr
      }));

      if (settingId) {
        await api.updateResource('settings', settingId, { value: valueStr });
      } else {
        const created = await api.createResource('settings', {
          key: 'kts_fee_category_village_rates',
          value: valueStr,
          group: 'fees',
          type: 'json',
          is_public: true,
        });
        if (created && created.id) setSettingId(String(created.id));
      }
    } catch (err) {
      console.error('Error saving village rates:', err);
    } finally {
      setSavingRates(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const name = fd.get('name') as string;
    const description = fd.get('description') as string;

    if (!name.trim()) {
      setErrorMsg('Category name is required.');
      setSaving(false);
      return;
    }

    try {
      await api.createResource('fee-categories', {
        name: name.trim(),
        description: description ? description.trim() : null,
        status: 'active',
      });
      setShowAddModal(false);
      loadCategories();
    } catch (err) {
      console.error('Error creating fee category:', err);
      setErrorMsg((err as Error).message || 'Failed to create fee category.');
    } finally {
      setSaving(false);
    }
  };

  const handlePromptDeleteCategory = (category: FeeCategory) => {
    if (!isAdmin) return;
    setCategoryToDelete(category);
    setShowDeleteWarning(true);
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete || !isAdmin) return;
    setDeletingId(categoryToDelete.id);
    try {
      await api.deleteResource('fee-categories', categoryToDelete.id);
      setShowDeleteWarning(false);
      setCategoryToDelete(null);
      loadCategories();
    } catch (err) {
      console.error('Error deleting fee category:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenEditModal = (category: FeeCategory) => {
    setEditingCategory(category);
    setEditName(category.name);
    setEditDescription(category.description || '');
    setEditStatus(category.status === 'inactive' || category.status === 'Inactive' ? 'inactive' : 'active');
    setEditErrorMsg(null);
    setShowEditModal(true);
  };

  const handleUpdateCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCategory) return;
    if (!editName.trim()) {
      setEditErrorMsg('Category name is required.');
      return;
    }
    setSavingEdit(true);
    try {
      await api.updateResource('fee-categories', editingCategory.id, {
        name: editName.trim(),
        description: editDescription ? editDescription.trim() : null,
        status: editStatus,
      });
      setShowEditModal(false);
      setEditingCategory(null);
      loadCategories();
    } catch (err) {
      console.error('Error updating fee category:', err);
      setEditErrorMsg((err as Error).message || 'Failed to update fee category.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleOpenRatesModal = (category: FeeCategory) => {
    setSelectedCategoryForRates(category);
    const key = category.name.trim().toLowerCase();
    const existing = villageRatesMap[key] || villageRatesMap[category.id] || [];
    setActiveCategoryRates(existing);
    setNewVillageName('');
    setNewVillageAmount('');
    setRatesSearch('');
    setShowRatesModal(true);
  };

  const handleAddVillageRate = () => {
    if (!newVillageName.trim() || !newVillageAmount || Number(newVillageAmount) <= 0) return;
    const newRate: VillageRate = {
      id: Date.now().toString(),
      village: newVillageName.trim(),
      amount: Number(newVillageAmount)
    };
    setActiveCategoryRates(prev => [...prev, newRate]);
    setNewVillageName('');
    setNewVillageAmount('');
  };

  const handleDeleteVillageRate = (id: string) => {
    setActiveCategoryRates(prev => prev.filter(r => r.id !== id));
    if (editingRateId === id) setEditingRateId(null);
  };

  const handleStartEditRate = (rate: VillageRate) => {
    setEditingRateId(rate.id);
    setEditingVillageName(rate.village);
    setEditingVillageAmount(String(rate.amount));
  };

  const handleCancelEditRate = () => {
    setEditingRateId(null);
    setEditingVillageName('');
    setEditingVillageAmount('');
  };

  const handleSaveEditRate = (id: string) => {
    if (!editingVillageName.trim() || !editingVillageAmount || Number(editingVillageAmount) <= 0) return;
    setActiveCategoryRates(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, village: editingVillageName.trim(), amount: Number(editingVillageAmount) }
          : r
      )
    );
    setEditingRateId(null);
    setEditingVillageName('');
    setEditingVillageAmount('');
  };

  const handleLoadDemoRates = () => {
    setActiveCategoryRates(DEMO_VILLAGE_RATES);
  };

  const handleSaveModalRates = async () => {
    if (!selectedCategoryForRates) return;
    const key = selectedCategoryForRates.name.trim().toLowerCase();
    const updatedMap = {
      ...villageRatesMap,
      [key]: activeCategoryRates,
      [selectedCategoryForRates.id]: activeCategoryRates,
    };
    await saveVillageRatesMap(updatedMap);
    setShowRatesModal(false);
  };

  const filteredRates = activeCategoryRates.filter(r =>
    r.village.toLowerCase().includes(ratesSearch.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[var(--bg)] text-center">
        <ShieldAlert size={48} className="text-[var(--red-tx)] mb-4" />
        <h2 className="text-lg font-bold text-[var(--tx)] mb-2">Access Denied</h2>
        <p className="text-sm text-[var(--tx3)]">Only administrators have access to manage fee categories.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[14px] font-bold text-[var(--tx)] flex items-center gap-2">
            School Fee Categories {loading && <Loader2 size={13} className="animate-spin text-[var(--tx3)]" />}
          </div>
          <div className="text-[11px] text-[var(--tx3)]">
            Manage fee heads and define dynamic village/area-wise transport rates.
          </div>
        </div>
        <button
          onClick={() => { setErrorMsg(null); setShowAddModal(true); }}
          className="flex items-center gap-1.5 px-3.5 py-2 text-[12px] bg-[var(--blue)] text-white rounded-xl font-bold hover:opacity-90 cursor-pointer shadow-sm"
        >
          <Plus size={13} /> Add Category
        </button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px] min-w-[600px]">
            <thead>
              <tr className="border-b border-[var(--b)]">
                {['Category Name', 'Description', 'Area / Village Rates', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-3.5 py-2.5 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => {
                const key = c.name.trim().toLowerCase();
                const rates = villageRatesMap[key] || villageRatesMap[c.id] || [];
                const isBusCategory = key.includes('bus') || key.includes('transport') || key.includes('route') || key.includes('village');

                return (
                  <tr key={c.id} className="border-b border-[var(--b)] hover:bg-[var(--surf2)]/50 transition-colors last:border-0">
                    <td className="px-3.5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isBusCategory ? 'bg-[var(--purple-bg)] text-[var(--purple-tx)]' : 'bg-[var(--blue-bg)] text-[var(--blue-tx)]'}`}>
                          {isBusCategory ? <Bus size={15} /> : <Tags size={15} />}
                        </div>
                        <div>
                          <div className="font-semibold text-[var(--tx)] text-[12.5px]">{c.name}</div>
                          {isBusCategory && (
                            <span className="text-[10px] text-[var(--purple-tx)] font-medium bg-[var(--purple-bg)] px-1.5 py-0.5 rounded">
                              Transport Category
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 text-[var(--tx2)]">{c.description || 'N/A'}</td>
                    <td className="px-3.5 py-3">
                      {isBusCategory ? (
                        rates.length > 0 ? (
                          <button
                            onClick={() => handleOpenRatesModal(c)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-[var(--blue-bg)] text-[var(--blue-tx)] border border-[var(--blue-tx)]/20 rounded-lg hover:bg-[var(--blue-bg)]/80 cursor-pointer flex items-center gap-1.5 transition-colors"
                          >
                            <MapPin size={11} /> {rates.length} Village Rates Configured
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenRatesModal(c)}
                            className="px-2.5 py-1 text-[11px] font-medium border border-[var(--b)] bg-[var(--surf2)] text-[var(--tx2)] rounded-lg hover:bg-[var(--surf3)] hover:text-[var(--tx)] cursor-pointer flex items-center gap-1.5 transition-colors"
                          >
                            <Plus size={11} /> Configure Area Rates
                          </button>
                        )
                      ) : (
                        <span className="text-[var(--tx3)] text-[11.5px] font-mono px-2">—</span>
                      )}
                    </td>
                    <td className="px-3.5 py-3">
                      <Badge variant={c.status === 'active' || c.status === 'Active' ? 'green' : 'gray'}>
                        {c.status || 'Active'}
                      </Badge>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(c)}
                          className="p-1.5 rounded-lg text-[var(--tx2)] hover:text-[var(--blue-tx)] hover:bg-[var(--blue-bg)] cursor-pointer transition-colors"
                          title="Edit Category"
                        >
                          <Pencil size={14} />
                        </button>
                        {isBusCategory && (
                          <button
                            onClick={() => handleOpenRatesModal(c)}
                            className="p-1.5 rounded-lg text-[var(--blue-tx)] hover:bg-[var(--blue-bg)] cursor-pointer transition-colors"
                            title="Configure Village Rates"
                          >
                            <MapPin size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handlePromptDeleteCategory(c)}
                          disabled={deletingId !== null}
                          className="p-1.5 rounded-lg text-[var(--tx3)] hover:text-[var(--red-tx)] hover:bg-[var(--red-bg)] cursor-pointer disabled:opacity-50 transition-colors"
                          title="Delete Category"
                        >
                          {deletingId === c.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {categories.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-[12px] text-[var(--tx3)]">
                    No fee categories found. Click Add Category to define one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAddCategory} className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--b)] bg-[var(--surf2)]">
              <div>
                <div className="text-[14px] font-bold text-[var(--tx)]">Add Fee Category</div>
                <div className="text-[11px] text-[var(--tx3)]">Define a new category of fee collected in school</div>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg hover:bg-[var(--surf3)] cursor-pointer text-[var(--tx2)]"><Plus className="rotate-45" size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Category Name *</label>
                <input name="name" required className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="e.g. Bus Fee, Tuition Fee, Exam Fee" />
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Description</label>
                <textarea name="description" className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)] resize-none" rows={3} placeholder="Brief description of the fee category" />
              </div>
              {errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-[var(--red-bg)] rounded-xl border border-[var(--red-tx)]/10">
                  <AlertCircle size={13} className="text-[var(--red-tx)] flex-shrink-0" />
                  <span className="text-[11.5px] text-[var(--red-tx)]">{errorMsg}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 p-4 border-t border-[var(--b)] bg-[var(--surf2)]">
              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 border border-[var(--b)] bg-[var(--surf)] rounded-xl text-[12.5px] font-medium text-[var(--tx)] hover:bg-[var(--surf3)] cursor-pointer">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 py-2 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold hover:opacity-90 cursor-pointer disabled:opacity-75 flex items-center justify-center gap-1.5">
                {saving && <Loader2 size={13} className="animate-spin" />}
                {saving ? 'Creating...' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && editingCategory && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleUpdateCategory} className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--b)] bg-[var(--surf2)]">
              <div>
                <div className="text-[14px] font-bold text-[var(--tx)] flex items-center gap-2">
                  <Pencil size={15} className="text-[var(--blue-tx)]" /> Edit Fee Category
                </div>
                <div className="text-[11px] text-[var(--tx3)]">Update category details and status</div>
              </div>
              <button type="button" onClick={() => setShowEditModal(false)} className="p-1.5 rounded-lg hover:bg-[var(--surf3)] cursor-pointer text-[var(--tx2)]">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-3.5">
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Category Name *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)] font-medium"
                  placeholder="e.g. Bus Fee, Tuition Fee, Exam Fee"
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)] resize-none"
                  rows={3}
                  placeholder="Brief description of the fee category"
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Status *</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'active' | 'inactive')}
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)] font-semibold"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              {editErrorMsg && (
                <div className="flex items-center gap-2 p-3 bg-[var(--red-bg)] rounded-xl border border-[var(--red-tx)]/10">
                  <AlertCircle size={13} className="text-[var(--red-tx)] flex-shrink-0" />
                  <span className="text-[11.5px] text-[var(--red-tx)]">{editErrorMsg}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 p-4 border-t border-[var(--b)] bg-[var(--surf2)]">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-2 border border-[var(--b)] bg-[var(--surf)] rounded-xl text-[12.5px] font-medium text-[var(--tx)] hover:bg-[var(--surf3)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="flex-1 py-2 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold hover:opacity-90 cursor-pointer disabled:opacity-75 flex items-center justify-center gap-1.5 shadow-sm"
              >
                {savingEdit ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Warning Confirmation Modal */}
      {showDeleteWarning && categoryToDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[420px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[var(--red-bg)] text-[var(--red-tx)] flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[var(--tx)]">Delete Fee Category?</h3>
                  <p className="text-[12px] text-[var(--tx2)] mt-1 leading-relaxed">
                    Are you sure you want to delete <strong className="text-[var(--tx)]">"{categoryToDelete.name}"</strong>?
                  </p>
                </div>
              </div>

              <div className="p-3 bg-[var(--amber-bg)]/25 border border-[var(--amber-tx)]/20 rounded-xl text-[11px] text-[var(--amber-tx)] space-y-1">
                <div className="font-bold flex items-center gap-1">
                  ⚠️ Warning: Action Cannot Be Undone
                </div>
                <p className="opacity-90 leading-tight">
                  If students currently have fee dues or records under this category, deleting it may impact their fee ledgers and reports.
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 p-4 border-t border-[var(--b)] bg-[var(--surf2)]">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteWarning(false);
                  setCategoryToDelete(null);
                }}
                className="flex-1 py-2 border border-[var(--b)] bg-[var(--surf)] rounded-xl text-[12.5px] font-medium text-[var(--tx)] hover:bg-[var(--surf3)] cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCategory}
                disabled={deletingId !== null}
                className="flex-1 py-2 bg-[var(--red-tx)] text-white rounded-xl text-[12.5px] font-semibold hover:opacity-90 cursor-pointer disabled:opacity-75 flex items-center justify-center gap-1.5 shadow-sm transition-opacity"
              >
                {deletingId !== null ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                {deletingId !== null ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configure Village / Area Bus Fees Modal */}
      {showRatesModal && selectedCategoryForRates && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[560px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-[var(--b)] bg-gradient-to-r from-[var(--purple)] to-[var(--purple)] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MapPin size={18} />
                <div>
                  <div className="text-[14px] font-bold">{selectedCategoryForRates.name} — Area / Village Rates</div>
                  <div className="text-[11px] opacity-80">Define village-wise transport fees for students from different areas</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRatesModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
              >
                <Plus className="rotate-45" size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3.5 overflow-y-auto flex-1">
              {/* Quick Preset Bar */}
              <div className="p-3 bg-[var(--purple-bg)]/30 border border-[var(--purple-tx)]/20 rounded-xl flex items-center justify-between gap-2">
                <div className="text-[11.5px] text-[var(--tx2)] font-medium">
                  Quick Preset: Load standard 38 village routes structure
                </div>
                <button
                  type="button"
                  onClick={handleLoadDemoRates}
                  className="px-3 py-1 text-[11px] font-bold bg-[var(--purple-bg)] text-[var(--purple-tx)] border border-[var(--purple-tx)]/30 rounded-lg hover:bg-[var(--purple-bg)]/80 cursor-pointer whitespace-nowrap transition-all flex items-center gap-1"
                >
                  <Bus size={11} /> Load Demo 38 Villages
                </button>
              </div>

              {/* Add New Village Form */}
              <div className="p-3 bg-[var(--surf2)] border border-[var(--b)] rounded-xl space-y-2">
                <div className="text-[11.5px] font-bold text-[var(--tx)]">Add New Route / Village Fee</div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  <input
                    type="text"
                    value={newVillageName}
                    onChange={(e) => setNewVillageName(e.target.value)}
                    placeholder="Route / Village (e.g. Chevella)"
                    className="sm:col-span-3 bg-[var(--surf)] border border-[var(--b)] rounded-lg px-3 py-1.5 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                  />
                  <input
                    type="number"
                    value={newVillageAmount}
                    onChange={(e) => setNewVillageAmount(e.target.value)}
                    placeholder="Fee ₹ (e.g. 7000)"
                    className="sm:col-span-2 bg-[var(--surf)] border border-[var(--b)] rounded-lg px-3 py-1.5 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddVillageRate}
                    disabled={!newVillageName.trim() || !newVillageAmount}
                    className="px-3.5 py-1.5 bg-[var(--blue)] text-white rounded-lg text-[11.5px] font-bold hover:opacity-90 cursor-pointer disabled:opacity-40 flex items-center gap-1"
                  >
                    <Plus size={12} /> Add Village Rate
                  </button>
                </div>
              </div>

              {/* Search & Rates Table */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="text-[11.5px] font-bold text-[var(--tx)]">
                    Configured Village Rates ({activeCategoryRates.length})
                  </div>
                  <div className="relative w-48">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--tx3)]" size={11} />
                    <input
                      type="text"
                      placeholder="Search village..."
                      value={ratesSearch}
                      onChange={(e) => setRatesSearch(e.target.value)}
                      className="w-full pl-7 pr-2.5 py-1 bg-[var(--surf2)] border border-[var(--b)] rounded-lg text-[11px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                    />
                  </div>
                </div>

                <div className="border border-[var(--b)] rounded-xl overflow-hidden max-h-[220px] overflow-y-auto">
                  <table className="w-full border-collapse text-[11.5px]">
                    <thead className="sticky top-0 bg-[var(--surf2)] border-b border-[var(--b)]">
                      <tr className="text-[10px] text-[var(--tx3)] uppercase">
                        <th className="text-left px-3 py-1.5 w-10">#</th>
                        <th className="text-left px-3 py-1.5">Route / Village Name</th>
                        <th className="text-right px-3 py-1.5">Bus Fee (₹)</th>
                        <th className="text-center px-3 py-1.5 w-20">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRates.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-6 text-[var(--tx3)] text-[11px]">
                            {activeCategoryRates.length === 0
                              ? 'No village rates configured yet. Click "Load Demo 38 Villages" or add one manually above.'
                              : 'No matching villages found.'}
                          </td>
                        </tr>
                      ) : (
                        filteredRates.map((r, index) => {
                          const isEditingThis = editingRateId === r.id;
                          return (
                            <tr key={r.id} className="border-b border-[var(--b)] hover:bg-[var(--surf2)]/50 last:border-0">
                              <td className="px-3 py-1.5 text-[var(--tx3)] font-mono text-[10.5px]">{index + 1}</td>
                              <td className="px-3 py-1.5 font-semibold text-[var(--tx)]">
                                {isEditingThis ? (
                                  <input
                                    type="text"
                                    value={editingVillageName}
                                    onChange={(e) => setEditingVillageName(e.target.value)}
                                    className="w-full bg-[var(--surf)] border border-[var(--blue)] rounded px-2 py-1 text-[11.5px] text-[var(--tx)] outline-none"
                                  />
                                ) : (
                                  r.village
                                )}
                              </td>
                              <td className="px-3 py-1.5 text-right font-bold text-[var(--blue-tx)]">
                                {isEditingThis ? (
                                  <input
                                    type="number"
                                    value={editingVillageAmount}
                                    onChange={(e) => setEditingVillageAmount(e.target.value)}
                                    className="w-full text-right bg-[var(--surf)] border border-[var(--blue)] rounded px-2 py-1 text-[11.5px] text-[var(--tx)] outline-none font-bold"
                                  />
                                ) : (
                                  `₹${r.amount.toLocaleString()}`
                                )}
                              </td>
                              <td className="px-3 py-1.5 text-center">
                                {isEditingThis ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveEditRate(r.id)}
                                      className="p-1 text-[var(--teal-tx)] hover:bg-[var(--teal-bg)] rounded cursor-pointer"
                                      title="Save Changes"
                                    >
                                      <Check size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleCancelEditRate}
                                      className="p-1 text-[var(--red-tx)] hover:bg-[var(--red-bg)] rounded cursor-pointer"
                                      title="Cancel"
                                    >
                                      <X size={13} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleStartEditRate(r)}
                                      className="p-1 text-[var(--blue-tx)] hover:bg-[var(--blue-bg)] rounded cursor-pointer"
                                      title="Edit Rate"
                                    >
                                      <Pencil size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteVillageRate(r.id)}
                                      className="p-1 text-[var(--tx3)] hover:text-[var(--red-tx)] hover:bg-[var(--red-bg)] rounded cursor-pointer"
                                      title="Remove Rate"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[var(--b)] bg-[var(--surf2)] flex items-center justify-between gap-3">
              <div className="text-[11px] text-[var(--tx3)]">
                {activeCategoryRates.length} village rates defined
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRatesModal(false)}
                  className="px-4 py-2 border border-[var(--b)] bg-[var(--surf)] rounded-xl text-[12px] font-medium text-[var(--tx)] hover:bg-[var(--surf3)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveModalRates}
                  disabled={savingRates}
                  className="px-5 py-2 bg-[var(--blue)] text-white rounded-xl text-[12px] font-bold hover:opacity-90 cursor-pointer disabled:opacity-75 flex items-center gap-1.5 shadow-sm"
                >
                  {savingRates ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                  {savingRates ? 'Saving...' : 'Save Village Rates'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

