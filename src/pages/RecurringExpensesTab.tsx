import { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2, Loader2, Calendar } from 'lucide-react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { api, clearApiCache } from '../services/api';
import { formatDate } from '../utils/date';
import { useDialog } from '../context/DialogContext';

interface RecurringExpense {
  id: string;
  title: string;
  type: 'recurring' | 'emi';
  amount: number;
  total_amount: number | null;
  frequency: string;
  start_date: string;
  end_date: string | null;
  next_due_date: string;
  status: 'active' | 'completed' | 'cancelled';
  category?: { id: number; name: string };
  expense_category_id: number;
}

export function RecurringExpensesTab() {
  const { confirm } = useDialog();
  const [items, setItems] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Electricity');
  const [customCategory, setCustomCategory] = useState('');
  const [editingItem, setEditingItem] = useState<RecurringExpense | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.request('/recurring-expenses');
      setItems(data?.data || []);
    } catch (err) {
      console.error('Error loading recurring expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      title: fd.get('title'),
      type: fd.get('type'),
      amount: parseFloat(fd.get('amount') as string) || 0,
      total_amount: fd.get('total_amount') ? parseFloat(fd.get('total_amount') as string) : null,
      category: selectedCategory === 'manual_entry' ? customCategory.trim() : selectedCategory,
      frequency: fd.get('frequency'),
      start_date: fd.get('start_date'),
      end_date: fd.get('end_date') || null,
      next_due_date: fd.get('start_date'), // Initial next due date is start date
    };

    try {
      await api.request('/recurring-expenses', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      clearApiCache('recurring-expenses');
      setShowAdd(false);
      loadData();
    } catch (err) {
      console.error('Error adding:', err);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;
    const fd = new FormData(e.currentTarget);
    const data = {
      title: fd.get('title'),
      type: fd.get('type'),
      amount: parseFloat(fd.get('amount') as string) || 0,
      total_amount: fd.get('total_amount') ? parseFloat(fd.get('total_amount') as string) : null,
      category: selectedCategory === 'manual_entry' ? customCategory.trim() : selectedCategory,
      frequency: fd.get('frequency'),
      start_date: fd.get('start_date'),
      end_date: fd.get('end_date') || null,
      next_due_date: fd.get('next_due_date'),
      status: fd.get('status')
    };

    try {
      await api.request(`/recurring-expenses/${editingItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      clearApiCache('recurring-expenses');
      setEditingItem(null);
      loadData();
    } catch (err) {
      console.error('Error updating:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm('Are you sure you want to delete this item? Future expenses will not be generated.', 'Delete Recurring Expense', true)) return;
    
    try {
      await api.request(`/recurring-expenses/${id}`, { method: 'DELETE' });
      clearApiCache('recurring-expenses');
      loadData();
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <div className="text-[13px] font-semibold text-[var(--tx)] flex items-center gap-2">
          Recurring Expenses & EMIs {loading && <Loader2 size={13} className="animate-spin text-[var(--tx3)]" />}
        </div>
        <button
          onClick={() => {
            setSelectedCategory('Electricity');
            setCustomCategory('');
            setShowAdd(true);
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 text-[11.5px] bg-[var(--blue)] text-white rounded-lg cursor-pointer hover:opacity-90"
        >
          <Plus size={11} /> Add New
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px] min-w-[700px]">
          <thead>
            <tr className="border-b border-[var(--b)]">
              {['Title', 'Type', 'Amount', 'Frequency', 'Next Due', 'Status', 'Actions'].map((h) => (
                <th key={h} className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-[var(--b)] hover:bg-[var(--surf2)] transition-colors">
                <td className="px-2 py-2.5 text-[var(--tx)] font-medium">
                  {item.title}
                  {item.type === 'emi' && item.total_amount && (
                    <div className="text-[10px] text-[var(--tx3)] font-normal mt-0.5">
                      Total: ₹{item.total_amount.toLocaleString()}
                    </div>
                  )}
                </td>
                <td className="px-2 py-2.5">
                  <Badge variant={item.type === 'emi' ? 'purple' : 'blue'}>{item.type.toUpperCase()}</Badge>
                </td>
                <td className="px-2 py-2.5 font-semibold text-[var(--tx)]">₹{item.amount.toLocaleString()}</td>
                <td className="px-2 py-2.5 text-[var(--tx3)] capitalize">{item.frequency}</td>
                <td className="px-2 py-2.5">
                  <div className="flex items-center gap-1 text-[var(--tx2)]">
                    <Calendar size={12} />
                    {formatDate(item.next_due_date)}
                  </div>
                </td>
                <td className="px-2 py-2.5">
                  {item.status === 'active' && <Badge variant="teal">Active</Badge>}
                  {item.status === 'completed' && <Badge variant="gray">Completed</Badge>}
                  {item.status === 'cancelled' && <Badge variant="red">Cancelled</Badge>}
                </td>
                <td className="px-2 py-2.5">
                  <div className="flex items-center gap-2">
                    <button onClick={() => {
                      setEditingItem(item);
                      const isPredefined = ['Electricity', 'Maintenance', 'Stationery', 'Water', 'Transport', 'Events'].includes(item.category?.name || '');
                      setSelectedCategory(isPredefined ? (item.category?.name || 'Electricity') : 'manual_entry');
                      setCustomCategory(isPredefined ? '' : (item.category?.name || ''));
                    }} className="p-1 text-[var(--tx3)] hover:text-[var(--blue)]"><Edit2 size={13} /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-1 text-[var(--tx3)] hover:text-[var(--red)]"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr><td colSpan={7} className="text-center py-6 text-[var(--tx3)]">No recurring expenses found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {(showAdd || editingItem) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={editingItem ? handleUpdate : handleAdd} className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[460px] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div className="text-[14px] font-bold text-[var(--tx)]">{editingItem ? 'Edit' : 'Add'} Recurring / EMI</div>
              <button type="button" onClick={() => {setShowAdd(false); setEditingItem(null);}} className="p-1.5 rounded-lg hover:bg-[var(--surf2)]"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Title *</label>
                <input name="title" defaultValue={editingItem?.title} required className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="e.g. Car Loan EMI" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Type *</label>
                  <select name="type" defaultValue={editingItem?.type || 'recurring'} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]">
                    <option value="recurring">Recurring Expense</option>
                    <option value="emi">EMI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Category *</label>
                  <select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)} 
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                  >
                    {['Electricity', 'Maintenance', 'Stationery', 'Water', 'Transport', 'Events'].map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="General">General</option>
                    <option value="manual_entry">Manual Entry</option>
                  </select>
                </div>
              </div>
              {selectedCategory === 'manual_entry' && (
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Custom Category *</label>
                  <input
                    type="text"
                    required
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                    placeholder="e.g. Office Supplies"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Amount (per cycle) *</label>
                  <input type="number" name="amount" defaultValue={editingItem?.amount} required className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Total Amount (optional)</label>
                  <input type="number" name="total_amount" defaultValue={editingItem?.total_amount || ''} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Frequency *</label>
                  <select name="frequency" defaultValue={editingItem?.frequency || 'monthly'} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Start Date *</label>
                  <input type="date" name="start_date" defaultValue={editingItem?.start_date ? editingItem.start_date.split('T')[0] : new Date().toISOString().slice(0,10)} required className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">End Date (optional)</label>
                  <input type="date" name="end_date" defaultValue={editingItem?.end_date ? editingItem.end_date.split('T')[0] : ''} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
                </div>
                {editingItem && (
                  <div>
                    <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Next Due Date</label>
                    <input type="date" name="next_due_date" defaultValue={editingItem.next_due_date ? editingItem.next_due_date.split('T')[0] : ''} required className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
                  </div>
                )}
              </div>
              {editingItem && (
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Status</label>
                  <select name="status" defaultValue={editingItem.status} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]">
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button type="button" onClick={() => {setShowAdd(false); setEditingItem(null);}} className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] text-[var(--tx)] cursor-pointer">Cancel</button>
              <button type="submit" className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold cursor-pointer">Save</button>
            </div>
          </form>
        </div>
      )}
    </Card>
  );
}
