import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, CheckCircle, Tag, Users, Wallet, CreditCard, ArrowLeft, Loader2 } from 'lucide-react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Avatar } from '../components/ui';
import { api } from '../services/api';
import { STAFF } from './StaffManagement';

interface SalaryComponent {
  id: string;
  name: string;
  type: 'earning' | 'deduction';
  calculationType?: 'flat' | 'percentage';
}

interface StaffSalary {
  staffId: string;
  values: Record<string, number>; // componentId -> amount
}

export function SalaryCategories() {
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [components, setComponents] = useState<SalaryComponent[]>([]);
  const [staffSalaries, setStaffSalaries] = useState<Record<string, Record<string, number>>>({});

  // Component Modal
  const [showCompModal, setShowCompModal] = useState(false);
  const [compName, setCompName] = useState('');
  const [compType, setCompType] = useState<'earning' | 'deduction'>('earning');
  const [compCalcType, setCompCalcType] = useState<'flat' | 'percentage'>('flat');

  // Assign Salary Modal
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  // Helper to get component amount
  const getComponentAmt = (comp: SalaryComponent, salaries: Record<string, number>, basicAmt: number) => {
    if (comp.id === 'basic') return basicAmt;
    const val = salaries[comp.id];
    if (val !== undefined) {
      if (comp.calculationType === 'percentage') {
        return Math.round((val / 100) * basicAmt);
      }
      return val;
    }
    const defaultVal = comp.id === 'hra' ? 8000 : comp.id === 'allowances' ? 5000 : comp.id === 'deductions' ? 3000 : 0;
    return defaultVal;
  };

  const saveSettingToDb = async (key: string, value: string) => {
    try {
      const settings = await api.getResources('settings');
      const existing = settings.find((s: any) => s.key === key);
      if (existing) {
        await api.updateResource('settings', existing.id, { key, value });
      } else {
        await api.createResource('settings', { key, value, group: 'general', type: 'json', is_public: false, is_encrypted: false });
      }
    } catch (err) {
      console.error(`Error saving setting ${key} to DB:`, err);
    }
  };

  // Initialize data
  useEffect(() => {
    async function syncFromDb() {
      try {
        const settings = await api.getResources('settings');
        
        const compSetting = settings.find((s: any) => s.key === 'salary_components');
        if (compSetting && compSetting.value) {
          localStorage.setItem('salary_components', compSetting.value);
          setComponents(JSON.parse(compSetting.value));
        } else {
          const savedComps = localStorage.getItem('salary_components');
          if (savedComps) {
            setComponents(JSON.parse(savedComps));
            saveSettingToDb('salary_components', savedComps);
          } else {
            const defaultComps: SalaryComponent[] = [
              { id: 'basic', name: 'Basic', type: 'earning', calculationType: 'flat' },
              { id: 'hra', name: 'HRA', type: 'earning', calculationType: 'flat' },
              { id: 'allowances', name: 'Allowances', type: 'earning', calculationType: 'flat' },
              { id: 'deductions', name: 'Deductions', type: 'deduction', calculationType: 'flat' },
            ];
            setComponents(defaultComps);
            localStorage.setItem('salary_components', JSON.stringify(defaultComps));
            saveSettingToDb('salary_components', JSON.stringify(defaultComps));
          }
        }

        const salariesSetting = settings.find((s: any) => s.key === 'staff_salaries');
        if (salariesSetting && salariesSetting.value) {
          localStorage.setItem('staff_salaries', salariesSetting.value);
          setStaffSalaries(JSON.parse(salariesSetting.value));
        } else {
          const savedSalaries = localStorage.getItem('staff_salaries');
          if (savedSalaries) {
            setStaffSalaries(JSON.parse(savedSalaries));
            saveSettingToDb('staff_salaries', savedSalaries);
          }
        }

        const staffSetting = settings.find((s: any) => s.key === 'kts_staff_members');
        if (staffSetting && staffSetting.value) {
          localStorage.setItem('kts_staff_members', staffSetting.value);
        }
      } catch (err) {
        console.error('Error syncing settings from DB in SalaryCategories:', err);
        const savedComps = localStorage.getItem('salary_components');
        if (savedComps) {
          setComponents(JSON.parse(savedComps));
        } else {
          const defaultComps: SalaryComponent[] = [
            { id: 'basic', name: 'Basic', type: 'earning', calculationType: 'flat' },
            { id: 'hra', name: 'HRA', type: 'earning', calculationType: 'flat' },
            { id: 'allowances', name: 'Allowances', type: 'earning', calculationType: 'flat' },
            { id: 'deductions', name: 'Deductions', type: 'deduction', calculationType: 'flat' },
          ];
          setComponents(defaultComps);
          localStorage.setItem('salary_components', JSON.stringify(defaultComps));
        }
        const savedSalaries = localStorage.getItem('staff_salaries');
        if (savedSalaries) setStaffSalaries(JSON.parse(savedSalaries));
      } finally {
        loadFaculty();
      }
    }

    // Load faculty
    const loadFaculty = () => {
      const savedStaffStr = localStorage.getItem('kts_staff_members');
      const currentStaffList = savedStaffStr ? JSON.parse(savedStaffStr) : STAFF;
      // Map staff directory members to matching structure
      const mappedStaff = currentStaffList.map((s: any) => ({
        id: s.id,
        name: s.name,
        subject: s.subject || s.designation || 'Staff',
      }));
      setFaculty(mappedStaff);
    };

    syncFromDb();
  }, []);

  // Save components helper
  const saveComponents = (newComps: SalaryComponent[]) => {
    setComponents(newComps);
    localStorage.setItem('salary_components', JSON.stringify(newComps));
    saveSettingToDb('salary_components', JSON.stringify(newComps));
  };

  // Add Component
  const handleAddComponent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName.trim()) return;
    
    const id = compName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (components.some((c) => c.id === id)) {
      alert('Component already exists!');
      return;
    }

    const newComp: SalaryComponent = {
      id,
      name: compName.trim(),
      type: compType,
      calculationType: compCalcType,
    };

    const updated = [...components, newComp];
    saveComponents(updated);
    
    setCompName('');
    setCompCalcType('flat');
    setShowCompModal(false);
  };

  // Delete Component
  const handleDeleteComponent = (id: string) => {
    if (id === 'basic') {
      alert('Basic Salary component cannot be deleted.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this salary component? It will be removed from all staff assignments.')) {
      const updated = components.filter((c) => c.id !== id);
      saveComponents(updated);

      // Clean up assignments
      const updatedSalaries = { ...staffSalaries };
      Object.keys(updatedSalaries).forEach((staffId) => {
        if (updatedSalaries[staffId]) {
          delete updatedSalaries[staffId][id];
        }
      });
      setStaffSalaries(updatedSalaries);
      localStorage.setItem('staff_salaries', JSON.stringify(updatedSalaries));
      saveSettingToDb('staff_salaries', JSON.stringify(updatedSalaries));
    }
  };

  // Open Edit Salary Modal
  const openEditSalary = (staff: any) => {
    setEditingStaff(staff);
    const salaries = staffSalaries[staff.id] || staffSalaries[staff.name] || {};
    const initialValues: Record<string, string> = {};
    components.forEach((comp) => {
      initialValues[comp.id] = String(salaries[comp.id] ?? (comp.id === 'basic' ? 25000 : comp.id === 'hra' ? 8000 : comp.id === 'allowances' ? 5000 : comp.id === 'deductions' ? 3000 : 0));
    });
    setEditValues(initialValues);
  };

  // Save Salary Assignment
  const handleSaveSalary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    const parsedValues: Record<string, number> = {};
    components.forEach((comp) => {
      parsedValues[comp.id] = Number(editValues[comp.id]) || 0;
    });

    const updated = {
      ...staffSalaries,
      [editingStaff.id]: parsedValues,
      [editingStaff.name]: parsedValues,
    };

    setStaffSalaries(updated);
    localStorage.setItem('staff_salaries', JSON.stringify(updated));
    saveSettingToDb('staff_salaries', JSON.stringify(updated));
    setEditingStaff(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-[var(--bg)] space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-[var(--b)] pb-3">
        <div>
          <h1 className="text-[16px] font-bold text-[var(--tx)] flex items-center gap-2">
            <Wallet size={16} className="text-[var(--blue)]" /> Salary Categories & Settings
          </h1>
          <p className="text-[11px] text-[var(--tx3)]">Define salary components and assign salaries to staff members</p>
        </div>
        <button
          onClick={() => setShowCompModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] bg-[var(--blue)] text-white rounded-lg cursor-pointer hover:opacity-90 font-medium transition-all"
        >
          <Plus size={13} /> Add Component
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_3fr] gap-4">
        {/* Components Sidebar */}
        <Card className="p-4 space-y-4 h-fit">
          <div className="text-[12px] font-bold text-[var(--tx)] flex items-center gap-1.5 border-b border-[var(--b)] pb-2">
            <Tag size={13} className="text-[var(--tx3)]" /> Salary Components
          </div>
          
          <div className="space-y-2">
            {components.map((comp) => (
              <div key={comp.id} className="flex items-center justify-between p-2.5 bg-[var(--surf2)] border border-[var(--b)] rounded-xl group transition-all hover:border-[var(--b2)]">
                <div>
                  <div className="text-[11.5px] font-semibold text-[var(--tx)]">{comp.name}</div>
                  <div className="text-[9px] mt-0.5 flex gap-1">
                    {comp.type === 'earning' ? (
                      <span className="text-[var(--teal-tx)] font-medium bg-[var(--teal-bg)] px-1.5 py-0.5 rounded text-[8.5px]">Earning</span>
                    ) : (
                      <span className="text-[var(--red-tx)] font-medium bg-[var(--red-bg)] px-1.5 py-0.5 rounded text-[8.5px]">Deduction</span>
                    )}
                    <span className="text-[var(--tx3)] font-medium bg-[var(--surf3)] px-1.5 py-0.5 rounded text-[8.5px] capitalize">
                      {comp.calculationType === 'percentage' ? '%' : 'Flat'}
                    </span>
                  </div>
                </div>
                {comp.id !== 'basic' && (
                  <button
                    onClick={() => handleDeleteComponent(comp.id)}
                    className="p-1 text-[var(--tx3)] hover:text-[var(--red-tx)] hover:bg-[var(--red-bg)] rounded-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Delete Component"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Staff Salary Table */}
        <Card className="p-4">
          <div className="text-[12px] font-bold text-[var(--tx)] flex items-center gap-1.5 border-b border-[var(--b)] pb-3 mb-3">
            <Users size={13} className="text-[var(--tx3)]" /> Staff Salary Assignments {loading && <Loader2 size={12} className="animate-spin text-[var(--tx3)] ml-2" />}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px] min-w-[800px]">
              <thead>
                <tr className="border-b border-[var(--b)]">
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2 whitespace-nowrap">Staff Name</th>
                  {components.map((comp) => (
                    <th key={comp.id} className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2 whitespace-nowrap">{comp.name}</th>
                  ))}
                  <th className="text-[10.5px] font-bold text-[var(--blue-tx)] text-left px-2 py-2 whitespace-nowrap bg-[var(--blue-bg)]/30 rounded-t-lg">Net Salary</th>
                  <th className="px-2 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {faculty.map((staff) => {
                  const salaries = staffSalaries[staff.id] || staffSalaries[staff.name] || {};
                  
                  // Compute net salary
                  let earningsSum = 0;
                  let deductionsSum = 0;
                  const basicAmt = salaries['basic'] !== undefined ? salaries['basic'] : 25000;
                  components.forEach((c) => {
                    const amt = getComponentAmt(c, salaries, basicAmt);
                    if (c.type === 'earning') {
                      earningsSum += amt;
                    } else {
                      deductionsSum += amt;
                    }
                  });
                  const netSalary = Math.max(0, earningsSum - deductionsSum);

                  const init = staff.name.split(' ').map((n: any) => n[0] ?? '').join('').toUpperCase().slice(0, 2);

                  return (
                    <tr key={staff.id} className="border-b border-[var(--b)] hover:bg-[var(--surf2)] transition-colors last:border-0">
                      <td className="px-2 py-2.5">
                        <div className="flex items-center gap-2">
                          <Avatar initials={init || 'ST'} bg="var(--blue-bg)" color="var(--blue-tx)" />
                          <div>
                            <div className="font-semibold text-[var(--tx)]">{staff.name}</div>
                            <div className="text-[9.5px] text-[var(--tx3)]">{staff.subject || 'Faculty'}</div>
                          </div>
                        </div>
                      </td>
                      {components.map((comp) => {
                        const val = salaries[comp.id];
                        const isPercentage = comp.calculationType === 'percentage';
                        const amt = getComponentAmt(comp, salaries, basicAmt);
                        return (
                          <td key={comp.id} className={`px-2 py-2.5 ${comp.type === 'deduction' ? 'text-[var(--red-tx)]' : 'text-[var(--tx2)]'}`}>
                            {isPercentage && val !== undefined ? `${val}% (₹${amt.toLocaleString()})` : `₹${amt.toLocaleString()}`}
                          </td>
                        );
                      })}
                      <td className="px-2 py-2.5 font-bold text-[var(--blue-tx)] bg-[var(--blue-bg)]/20">
                        ₹{netSalary.toLocaleString()}
                      </td>
                      <td className="px-2 py-2.5">
                        <button
                          onClick={() => openEditSalary(staff)}
                          className="flex items-center gap-1 text-[11px] text-[var(--blue-tx)] hover:underline cursor-pointer font-medium"
                        >
                          <Edit2 size={11} /> Assign
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Add Component Modal */}
      {showCompModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAddComponent} className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[360px] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--b)] bg-[var(--surf2)]">
              <div className="text-[13px] font-bold text-[var(--tx)]">Add Salary Component</div>
              <button type="button" onClick={() => setShowCompModal(false)} className="text-[var(--tx2)] hover:text-[var(--tx)] cursor-pointer">✕</button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-[var(--tx2)] mb-1">Component Name *</label>
                <input
                  type="text"
                  required
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  placeholder="e.g. Special Allowance, PF, Tax"
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[var(--tx2)] mb-1">Type *</label>
                <select
                  value={compType}
                  onChange={(e) => setCompType(e.target.value as 'earning' | 'deduction')}
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]"
                >
                  <option value="earning">Earning</option>
                  <option value="deduction">Deduction</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[var(--tx2)] mb-1">Calculation Type *</label>
                <select
                  value={compCalcType}
                  onChange={(e) => setCompCalcType(e.target.value as 'flat' | 'percentage')}
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]"
                >
                  <option value="flat">Flat Amount (₹)</option>
                  <option value="percentage">Percentage of Basic (%)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 p-4 bg-[var(--surf2)] border-t border-[var(--b)]">
              <button type="button" onClick={() => setShowCompModal(false)} className="flex-1 py-2 border border-[var(--b)] bg-[var(--surf)] rounded-xl text-[12px] font-medium text-[var(--tx)] cursor-pointer">Cancel</button>
              <button type="submit" className="flex-1 py-2 bg-[var(--blue)] text-white rounded-xl text-[12px] font-semibold cursor-pointer">Add</button>
            </div>
          </form>
        </div>
      )}

      {/* Assign Salary Modal */}
      {editingStaff && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSaveSalary} className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--b)] bg-[var(--surf2)]">
              <div>
                <div className="text-[13px] font-bold text-[var(--tx)]">Assign Salary Details</div>
                <div className="text-[11px] text-[var(--tx3)]">{editingStaff.name}</div>
              </div>
              <button type="button" onClick={() => setEditingStaff(null)} className="text-[var(--tx2)] hover:text-[var(--tx)] cursor-pointer">✕</button>
            </div>
            <div className="p-4 space-y-3 max-h-[350px] overflow-y-auto">
              {components.map((comp) => (
                <div key={comp.id}>
                  <label className="block text-[11px] font-medium text-[var(--tx2)] mb-1">
                    {comp.name} {comp.type === 'deduction' ? '(Deduction)' : '(Earning)'} {comp.calculationType === 'percentage' ? '(%)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    required
                    value={editValues[comp.id] || ''}
                    onChange={(e) => setEditValues({ ...editValues, [comp.id]: e.target.value })}
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 p-4 bg-[var(--surf2)] border-t border-[var(--b)]">
              <button type="button" onClick={() => setEditingStaff(null)} className="flex-1 py-2 border border-[var(--b)] bg-[var(--surf)] rounded-xl text-[12px] font-medium text-[var(--tx)] cursor-pointer">Cancel</button>
              <button type="submit" className="flex-1 py-2 bg-[var(--blue)] text-white rounded-xl text-[12px] font-semibold cursor-pointer">Save Salary</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
