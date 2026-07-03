import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, AlertCircle, Tags, ShieldAlert } from 'lucide-react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface FeeCategory {
  id: string;
  name: string;
  description: string | null;
  status: string;
}

export function FeeCategories() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  useEffect(() => {
    loadCategories();
  }, []);

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

  const handleDeleteCategory = async (id: string) => {
    if (!isAdmin) return;
    setDeletingId(id);
    try {
      await api.deleteResource('fee-categories', id);
      loadCategories();
    } catch (err) {
      console.error('Error deleting fee category:', err);
    } finally {
      setDeletingId(null);
    }
  };

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
        <div className="text-[13px] font-semibold text-[var(--tx)] flex items-center gap-2">
          School Fee Categories {loading && <Loader2 size={13} className="animate-spin text-[var(--tx3)]" />}
        </div>
        <button
          onClick={() => { setErrorMsg(null); setShowAddModal(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] bg-[var(--blue)] text-white rounded-lg hover:opacity-90 cursor-pointer"
        >
          <Plus size={12} /> Add Category
        </button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px] min-w-[500px]">
            <thead>
              <tr className="border-b border-[var(--b)]">
                {['Name', 'Description', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-3 py-2 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-[var(--b)] hover:bg-[var(--surf2)] transition-colors last:border-0">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[var(--blue-bg)] flex items-center justify-center text-[var(--blue-tx)]">
                        <Tags size={14} />
                      </div>
                      <span className="font-semibold text-[var(--tx)]">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[var(--tx2)]">{c.description || 'N/A'}</td>
                  <td className="px-3 py-3">
                    <Badge variant={c.status === 'active' || c.status === 'Active' ? 'green' : 'gray'}>
                      {c.status || 'Active'}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => handleDeleteCategory(c.id)}
                      disabled={deletingId !== null}
                      className="p-1.5 rounded-lg text-[var(--tx3)] hover:text-[var(--red-tx)] hover:bg-[var(--red-bg)] cursor-pointer disabled:opacity-50 transition-colors"
                      title="Delete Category"
                    >
                      {deletingId === c.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-[12px] text-[var(--tx3)]">
                    No fee categories found. Click Add Category to define one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAddCategory} className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[400px] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div>
                <div className="text-[14px] font-bold text-[var(--tx)]">Add Fee Category</div>
                <div className="text-[11px] text-[var(--tx3)]">Define a new category of fee collected in school</div>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer text-[var(--tx2)]"><Plus className="rotate-45" size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Category Name *</label>
                <input name="name" required className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="e.g. Tuition Fee, Bus Fee, Exam Fee" />
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
            <div className="flex gap-2 p-5 pt-0">
              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] font-medium text-[var(--tx)] hover:bg-[var(--surf3)] cursor-pointer">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold hover:opacity-90 cursor-pointer disabled:opacity-75 flex items-center justify-center gap-1.5">
                {saving && <Loader2 size={13} className="animate-spin" />}
                {saving ? 'Creating...' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
