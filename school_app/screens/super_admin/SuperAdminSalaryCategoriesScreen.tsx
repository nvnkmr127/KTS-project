import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  Edit3,
  Tag,
  Wallet,
  Landmark,
  Percent,
  DollarSign,
  Briefcase,
  Users,
  Check,
  X,
  AlertTriangle,
  ChevronRight,
  Calculator,
  TrendingUp,
  Layers,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { GlassCard } from '../../components/GlassCard';
import { api } from '../../services/api';
import { useResponsive } from '../../utils/responsive';

export interface SalaryComponent {
  id: string;
  name: string;
  type: 'earning' | 'deduction';
  calculationType?: 'flat' | 'percentage';
  month?: string;
  defaultAmount?: number;
}

export interface StaffSalaryProfile {
  id: string;
  name: string;
  designation: string;
  department: string;
  baseSalary: number;
  avatar: string;
  components: Record<string, number>;
}

const DEFAULT_COMPONENTS: SalaryComponent[] = [
  { id: 'basic', name: 'Basic Pay', type: 'earning', calculationType: 'flat', month: 'All', defaultAmount: 25000 },
  { id: 'hra', name: 'House Rent Allowance (HRA)', type: 'earning', calculationType: 'percentage', month: 'All', defaultAmount: 20 },
  { id: 'allowances', name: 'Special Allowance', type: 'earning', calculationType: 'flat', month: 'All', defaultAmount: 8000 },
  { id: 'travel_allowance', name: 'Conveyance / Travel', type: 'earning', calculationType: 'flat', month: 'All', defaultAmount: 3000 },
  { id: 'pf_deduction', name: 'Provident Fund (PF)', type: 'deduction', calculationType: 'percentage', month: 'All', defaultAmount: 12 },
  { id: 'prof_tax', name: 'Professional Tax', type: 'deduction', calculationType: 'flat', month: 'All', defaultAmount: 200 },
  { id: 'tds_tax', name: 'Income Tax (TDS)', type: 'deduction', calculationType: 'flat', month: 'All', defaultAmount: 1500 },
];

const INITIAL_STAFF_SALARIES: StaffSalaryProfile[] = [
  {
    id: 'st_1',
    name: 'Dr. Julian Vance',
    designation: 'Senior Faculty Head',
    department: 'Physics',
    baseSalary: 65000,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150',
    components: {
      basic: 38000,
      hra: 12000,
      allowances: 10000,
      travel_allowance: 5000,
      pf_deduction: 4560,
      prof_tax: 200,
      tds_tax: 2000,
    },
  },
  {
    id: 'st_2',
    name: 'Mrs. Sarah Jenkins',
    designation: 'Admin Operations Head',
    department: 'Administration',
    baseSalary: 58000,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150',
    components: {
      basic: 34000,
      hra: 11000,
      allowances: 9000,
      travel_allowance: 4000,
      pf_deduction: 4080,
      prof_tax: 200,
      tds_tax: 1500,
    },
  },
  {
    id: 'st_3',
    name: 'Prof. Michael Chen',
    designation: 'HOD Mathematics',
    department: 'Mathematics',
    baseSalary: 72000,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150',
    components: {
      basic: 42000,
      hra: 14000,
      allowances: 11000,
      travel_allowance: 5000,
      pf_deduction: 5040,
      prof_tax: 200,
      tds_tax: 3000,
    },
  },
  {
    id: 'st_4',
    name: 'Rajesh Sharma',
    designation: 'Senior Accountant',
    department: 'Accounts & Finance',
    baseSalary: 45000,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150',
    components: {
      basic: 27000,
      hra: 9000,
      allowances: 6000,
      travel_allowance: 3000,
      pf_deduction: 3240,
      prof_tax: 200,
      tds_tax: 1000,
    },
  },
  {
    id: 'st_5',
    name: 'Priya Nambiar',
    designation: 'Senior English Faculty',
    department: 'Languages',
    baseSalary: 48000,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150',
    components: {
      basic: 28000,
      hra: 9500,
      allowances: 7000,
      travel_allowance: 3500,
      pf_deduction: 3360,
      prof_tax: 200,
      tds_tax: 1200,
    },
  },
  {
    id: 'st_6',
    name: 'Ramesh Goud',
    designation: 'Transport & Fleet Supervisor',
    department: 'Logistics',
    baseSalary: 32000,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150',
    components: {
      basic: 20000,
      hra: 6000,
      allowances: 4000,
      travel_allowance: 2000,
      pf_deduction: 2400,
      prof_tax: 200,
      tds_tax: 500,
    },
  },
];

export const SuperAdminSalaryCategoriesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isSmallPhone, isTablet, insets, headerPaddingTop, scrollBottomPadding, containerStyle } = useResponsive();

  const [activeTab, setActiveTab] = useState<'components' | 'assignment'>('components');
  const [components, setComponents] = useState<SalaryComponent[]>(DEFAULT_COMPONENTS);
  const [staffSalaries, setStaffSalaries] = useState<StaffSalaryProfile[]>(INITIAL_STAFF_SALARIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState('All');

  // Modal states for Component Add / Edit
  const [compModalVisible, setCompModalVisible] = useState(false);
  const [editingComp, setEditingComp] = useState<SalaryComponent | null>(null);
  const [compName, setCompName] = useState('');
  const [compType, setCompType] = useState<'earning' | 'deduction'>('earning');
  const [compCalcType, setCompCalcType] = useState<'flat' | 'percentage'>('flat');
  const [compMonth, setCompMonth] = useState('All');
  const [compDefaultAmount, setCompDefaultAmount] = useState('');

  // Modal states for Staff Salary Assignment
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffSalaryProfile | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  // Custom Alert Modal
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'confirm_delete';
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });

  const showCustomAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'confirm_delete',
    onConfirm?: () => void
  ) => {
    setCustomAlert({ visible: true, title, message, type, onConfirm });
  };

  // Sync components from DB settings
  useEffect(() => {
    const syncFromDb = async () => {
      try {
        const settings = await api.getResources('settings');
        const extractArray = (res: any) =>
          Array.isArray(res)
            ? res
            : res?.data && Array.isArray(res.data)
            ? res.data
            : res?.data?.data && Array.isArray(res.data.data)
            ? res.data.data
            : [];
        const settingsArr = extractArray(settings);

        const compSetting = settingsArr.find((s: any) => s.key === 'salary_components');
        if (compSetting && compSetting.value) {
          try {
            const parsed = typeof compSetting.value === 'string' ? JSON.parse(compSetting.value) : compSetting.value;
            if (Array.isArray(parsed) && parsed.length > 0) {
              setComponents(parsed);
            }
          } catch (_) {}
        }
      } catch (_) {}
    };

    syncFromDb();
  }, []);

  // Open Add Component Modal
  const handleOpenAddComp = () => {
    setEditingComp(null);
    setCompName('');
    setCompType('earning');
    setCompCalcType('flat');
    setCompMonth('All');
    setCompDefaultAmount('');
    setCompModalVisible(true);
  };

  // Open Edit Component Modal
  const handleOpenEditComp = (comp: SalaryComponent) => {
    setEditingComp(comp);
    setCompName(comp.name);
    setCompType(comp.type);
    setCompCalcType(comp.calculationType || 'flat');
    setCompMonth(comp.month || 'All');
    setCompDefaultAmount(comp.defaultAmount ? String(comp.defaultAmount) : '');
    setCompModalVisible(true);
  };

  // Save Salary Component
  const handleSaveComponent = () => {
    if (!compName.trim()) {
      showCustomAlert('Validation Error', 'Please enter a component name.', 'error');
      return;
    }

    const defaultAmtNum = parseFloat(compDefaultAmount.trim()) || 0;

    if (editingComp) {
      const updated: SalaryComponent[] = components.map((c) =>
        c.id === editingComp.id
          ? {
              ...c,
              name: compName.trim(),
              type: compType,
              calculationType: compCalcType,
              month: compMonth,
              defaultAmount: defaultAmtNum,
            }
          : c
      );
      setComponents(updated);
      setCompModalVisible(false);
      showCustomAlert('Success', `Salary category "${compName.trim()}" updated successfully.`, 'success');
    } else {
      const newId = compName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      if (components.some((c) => c.id === newId)) {
        showCustomAlert('Duplicate Component', 'A salary component with this name already exists.', 'error');
        return;
      }

      const newComp: SalaryComponent = {
        id: newId,
        name: compName.trim(),
        type: compType,
        calculationType: compCalcType,
        month: compMonth,
        defaultAmount: defaultAmtNum,
      };

      setComponents([...components, newComp]);
      setCompModalVisible(false);
      showCustomAlert('Success', `New salary component "${newComp.name}" added to master list.`, 'success');
    }
  };

  // Delete Salary Component
  const handleDeleteComponent = (comp: SalaryComponent) => {
    if (comp.id === 'basic') {
      showCustomAlert('Cannot Delete', 'Basic Salary is the core baseline component and cannot be deleted.', 'error');
      return;
    }

    showCustomAlert(
      'Delete Component',
      `Are you sure you want to delete "${comp.name}"? It will be removed from all staff payroll calculations.`,
      'confirm_delete',
      () => {
        setComponents((prev) => prev.filter((c) => c.id !== comp.id));
        setCustomAlert((prev) => ({ ...prev, visible: false }));
      }
    );
  };

  // Open Edit Staff Salary Assignment Modal
  const handleOpenAssignSalary = (staff: StaffSalaryProfile) => {
    setSelectedStaff(staff);
    const initialInputs: Record<string, string> = {};
    components.forEach((c) => {
      const val = staff.components[c.id];
      if (val !== undefined) {
        initialInputs[c.id] = String(val);
      } else {
        initialInputs[c.id] = c.defaultAmount ? String(c.defaultAmount) : '0';
      }
    });
    setEditValues(initialInputs);
    setAssignModalVisible(true);
  };

  // Save Staff Salary Assignment
  const handleSaveStaffSalary = () => {
    if (!selectedStaff) return;

    const parsedComponents: Record<string, number> = {};
    components.forEach((c) => {
      const inputVal = editValues[c.id] || '0';
      parsedComponents[c.id] = parseFloat(inputVal) || 0;
    });

    setStaffSalaries((prev) =>
      prev.map((s) => (s.id === selectedStaff.id ? { ...s, components: parsedComponents } : s))
    );

    setAssignModalVisible(false);
    showCustomAlert('Salary Assigned', `Payroll structure updated for ${selectedStaff.name}.`, 'success');
  };

  // Helpers to calculate Gross, Deductions, and Net for a staff profile
  const calculateStaffPayroll = (staff: StaffSalaryProfile) => {
    let grossEarnings = 0;
    let totalDeductions = 0;

    components.forEach((c) => {
      const val = staff.components[c.id] || 0;
      if (c.type === 'earning') {
        grossEarnings += val;
      } else {
        totalDeductions += val;
      }
    });

    const netTakeHome = Math.max(0, grossEarnings - totalDeductions);
    return { grossEarnings, totalDeductions, netTakeHome };
  };

  // Real-time calculation for modal values
  const currentModalCalculation = useMemo(() => {
    let gross = 0;
    let ded = 0;
    components.forEach((c) => {
      const val = parseFloat(editValues[c.id] || '0') || 0;
      if (c.type === 'earning') {
        gross += val;
      } else {
        ded += val;
      }
    });
    return { gross, ded, net: Math.max(0, gross - ded) };
  }, [components, editValues]);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffSalaries.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      return !q || s.name.toLowerCase().includes(q) || s.designation.toLowerCase().includes(q) || s.department.toLowerCase().includes(q);
    });
  }, [staffSalaries, searchQuery]);

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#1d2022', '#101415']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header matching Super Admin Dark Gold Luxury Theme */}
      <View style={{ zIndex: 50 }}>
        <BlurView intensity={30} tint="dark" style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <Pressable
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 items-center justify-center active:bg-white/20 active:scale-95"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <ArrowLeft size={18} color="#ffe5a0" />
            </Pressable>
            <View className="flex-1">
              <Text numberOfLines={1} className="text-lg md:text-xl font-bold text-white font-display-lg">
                Salary Categories
              </Text>
              <Text numberOfLines={1} className="text-[9px] uppercase tracking-widest text-[#ffe5a0] font-bold">
                PAYROLL STRUCTURE & STAFF ALLOTMENT
              </Text>
            </View>
          </View>

          {activeTab === 'components' && (
            <Pressable
              onPress={handleOpenAddComp}
              className="w-10 h-10 rounded-xl bg-[#f0c110] items-center justify-center active:scale-95 shadow-[0_0_15px_rgba(240,193,16,0.5)]"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Plus size={20} color="#101415" strokeWidth={3} />
            </Pressable>
          )}
        </BlurView>

        {/* Glow Line below Header */}
        <LinearGradient
          colors={['rgba(245, 197, 24, 0.15)', 'transparent']}
          style={{ position: 'absolute', bottom: -15, left: 0, right: 0, height: 15 }}
          pointerEvents="none"
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, containerStyle, { paddingBottom: scrollBottomPadding + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation Tabs (Components vs Assignment) */}
        <View className="px-5 mb-5">
          <View className="bg-black/50 p-1.5 rounded-2xl border border-white/10 flex-row">
            <Pressable
              onPress={() => setActiveTab('components')}
              className={`flex-1 py-2.5 rounded-xl items-center justify-center flex-row gap-2 transition-all ${
                activeTab === 'components' ? 'bg-[#f0c110] shadow-md' : 'bg-transparent'
              }`}
            >
              <Tag size={15} color={activeTab === 'components' ? '#101415' : 'rgba(255,255,255,0.6)'} />
              <Text
                className={`text-xs font-bold ${
                  activeTab === 'components' ? 'text-[#101415]' : 'text-white/60'
                }`}
              >
                Salary Components ({components.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('assignment')}
              className={`flex-1 py-2.5 rounded-xl items-center justify-center flex-row gap-2 transition-all ${
                activeTab === 'assignment' ? 'bg-[#f0c110] shadow-md' : 'bg-transparent'
              }`}
            >
              <Users size={15} color={activeTab === 'assignment' ? '#101415' : 'rgba(255,255,255,0.6)'} />
              <Text
                className={`text-xs font-bold ${
                  activeTab === 'assignment' ? 'text-[#101415]' : 'text-white/60'
                }`}
              >
                Staff Allotment ({staffSalaries.length})
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ================= TAB 1: SALARY COMPONENTS ================= */}
        {activeTab === 'components' && (
          <View className="px-5 mb-8">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-[#ffe5a0] text-xs font-bold uppercase tracking-wider">
                ACTIVE COMPONENTS & HEADS
              </Text>
              <Text className="text-white/40 text-[10px]">Earning vs Deductions</Text>
            </View>

            <View className="gap-3">
              {components.map((comp) => {
                const isEarning = comp.type === 'earning';
                return (
                  <GlassCard
                    key={comp.id}
                    className="p-4 border border-white/10"
                    style={{
                      backgroundColor: '#1d2122',
                      shadowColor: '#f0c110',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.15,
                      shadowRadius: 8,
                    }}
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                        <View
                          className={`w-9 h-9 rounded-xl items-center justify-center border ${
                            isEarning
                              ? 'bg-[#41eec2]/15 border-[#41eec2]/30'
                              : 'bg-rose-500/15 border-rose-500/30'
                          }`}
                        >
                          <Wallet size={16} color={isEarning ? '#41eec2' : '#ffb4ab'} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-white font-bold text-sm" numberOfLines={1}>
                            {comp.name}
                          </Text>
                          <Text className="text-white/40 text-[10px] font-mono mt-0.5">ID: {comp.id}</Text>
                        </View>
                      </View>

                      <View className="flex-row items-center gap-1.5">
                        {/* Edit Action */}
                        <Pressable
                          onPress={() => handleOpenEditComp(comp)}
                          className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 items-center justify-center active:bg-white/20"
                        >
                          <Edit3 size={13} color="#ffe5a0" />
                        </Pressable>

                        {/* Delete Action (Protected for basic) */}
                        {comp.id !== 'basic' && (
                          <Pressable
                            onPress={() => handleDeleteComponent(comp)}
                            className="w-8 h-8 rounded-xl bg-red-500/15 border border-red-500/30 items-center justify-center active:bg-red-500/30"
                          >
                            <Trash2 size={13} color="#ffb4ab" />
                          </Pressable>
                        )}
                      </View>
                    </View>

                    {/* Meta Badges Ribbon */}
                    <View className="flex-row items-center gap-2 mt-2 pt-2 border-t border-white/5">
                      <View
                        className={`px-2.5 py-0.5 rounded-md border ${
                          isEarning
                            ? 'bg-[#41eec2]/10 border-[#41eec2]/20'
                            : 'bg-rose-500/10 border-rose-500/20'
                        }`}
                      >
                        <Text
                          className={`text-[9.5px] font-extrabold uppercase ${
                            isEarning ? 'text-[#41eec2]' : 'text-rose-400'
                          }`}
                        >
                          {comp.type}
                        </Text>
                      </View>

                      <View className="px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 flex-row items-center">
                        {comp.calculationType === 'percentage' ? (
                          <>
                            <Percent size={10} color="#ffe5a0" style={{ marginRight: 3 }} />
                            <Text className="text-[#ffe5a0] text-[9.5px] font-bold">% of Basic</Text>
                          </>
                        ) : (
                          <>
                            <DollarSign size={10} color="#ffe5a0" style={{ marginRight: 2 }} />
                            <Text className="text-[#ffe5a0] text-[9.5px] font-bold">Flat ₹ Amount</Text>
                          </>
                        )}
                      </View>

                      <View className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 ml-auto">
                        <Text className="text-white/40 text-[9px] font-semibold">
                          Period: {comp.month || 'All Months'}
                        </Text>
                      </View>
                    </View>
                  </GlassCard>
                );
              })}
            </View>
          </View>
        )}

        {/* ================= TAB 2: STAFF SALARY ASSIGNMENT ================= */}
        {activeTab === 'assignment' && (
          <View className="px-5 mb-8">
            {/* Search Staff */}
            <View className="mb-4">
              <View className="bg-black/40 border border-white/15 rounded-2xl px-3.5 py-2.5 flex-row items-center shadow-lg">
                <Search size={18} color="#ffe5a0" style={{ marginRight: 10 }} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search staff to configure payroll..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  className="flex-1 text-white text-xs font-semibold"
                />
              </View>
            </View>

            {/* Staff Salary Cards List */}
            <View className="gap-3.5">
              {filteredStaff.map((staff) => {
                const { grossEarnings, totalDeductions, netTakeHome } = calculateStaffPayroll(staff);
                return (
                  <GlassCard
                    key={staff.id}
                    className="p-4 border border-white/10"
                    style={{
                      backgroundColor: '#1d2122',
                      shadowColor: '#f0c110',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.15,
                      shadowRadius: 8,
                    }}
                  >
                    {/* Header Row */}
                    <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-white/10">
                      <View className="flex-row items-center flex-1 mr-2">
                        <Image
                          source={{ uri: staff.avatar }}
                          className="w-12 h-12 rounded-2xl border border-white/15 mr-3"
                        />
                        <View className="flex-1">
                          <Text className="text-white font-extrabold text-sm" numberOfLines={1}>
                            {staff.name}
                          </Text>
                          <Text className="text-[#ffe5a0] text-[10px] font-bold mt-0.5" numberOfLines={1}>
                            {staff.designation} • {staff.department}
                          </Text>
                        </View>
                      </View>

                      <Pressable
                        onPress={() => handleOpenAssignSalary(staff)}
                        className="px-3 py-1.5 rounded-xl bg-[#f0c110] flex-row items-center active:scale-95 shadow-md shadow-[#f0c110]/30"
                      >
                        <Calculator size={12} color="#101415" style={{ marginRight: 4 }} />
                        <Text className="text-[#101415] text-[10px] font-extrabold uppercase">Assign</Text>
                      </Pressable>
                    </View>

                    {/* Breakdown Summary Grid */}
                    <View className="flex-row justify-between bg-black/40 p-3 rounded-2xl border border-white/5">
                      <View className="items-center w-[30%]">
                        <Text className="text-white/40 text-[8.5px] font-bold uppercase">Gross Pay</Text>
                        <Text className="text-white font-extrabold text-xs mt-0.5">
                          ₹{grossEarnings.toLocaleString('en-IN')}
                        </Text>
                      </View>

                      <View className="items-center w-[30%] border-x border-white/10">
                        <Text className="text-white/40 text-[8.5px] font-bold uppercase">Deductions</Text>
                        <Text className="text-rose-400 font-extrabold text-xs mt-0.5">
                          -₹{totalDeductions.toLocaleString('en-IN')}
                        </Text>
                      </View>

                      <View className="items-center w-[30%]">
                        <Text className="text-[#ffe5a0] text-[8.5px] font-bold uppercase">Net Payable</Text>
                        <Text className="text-[#41eec2] font-extrabold text-sm mt-0.5">
                          ₹{netTakeHome.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>
                  </GlassCard>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* ================= ADD / EDIT SALARY COMPONENT MODAL ================= */}
      <Modal
        visible={compModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCompModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCardContainer}>
            <GlassCard
              className="p-6 border border-white/15"
              style={{
                backgroundColor: '#16191b',
                borderRadius: 28,
                shadowColor: '#f0c110',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
              }}
            >
              {/* Header */}
              <View className="flex-row items-center justify-between pb-4 border-b border-white/10 mb-4">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-xl bg-[#f0c110]/15 border border-[#f0c110]/30 items-center justify-center">
                    <Tag size={20} color="#f0c110" />
                  </View>
                  <View>
                    <Text className="text-white font-bold text-base">
                      {editingComp ? 'Edit Salary Component' : 'Add Salary Component'}
                    </Text>
                    <Text className="text-[#ffe5a0] text-[10px] uppercase tracking-wider font-bold">
                      PAYROLL HEAD DEFINITION
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => setCompModalVisible(false)}
                  className="w-8 h-8 rounded-full bg-white/10 items-center justify-center active:bg-white/20"
                >
                  <X size={16} color="#FFF" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Component Name */}
                <View className="mb-3">
                  <Text className="text-white/70 text-xs font-bold mb-1.5">Component Name *</Text>
                  <TextInput
                    value={compName}
                    onChangeText={setCompName}
                    placeholder="e.g. Special Performance Bonus"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    className="bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs font-semibold"
                  />
                </View>

                {/* Component Type (Earning vs Deduction) */}
                <View className="mb-3">
                  <Text className="text-white/70 text-xs font-bold mb-1.5">Component Type *</Text>
                  <View className="flex-row gap-2.5">
                    {(['earning', 'deduction'] as const).map((t) => {
                      const isSel = compType === t;
                      return (
                        <Pressable
                          key={t}
                          onPress={() => setCompType(t)}
                          className={`flex-1 py-2.5 rounded-xl border items-center justify-center ${
                            isSel
                              ? t === 'earning'
                                ? 'bg-[#41eec2] border-[#41eec2]'
                                : 'bg-rose-500 border-rose-500'
                              : 'bg-black/40 border-white/15'
                          }`}
                        >
                          <Text
                            className={`text-xs font-bold uppercase ${
                              isSel ? 'text-[#101415]' : 'text-white/70'
                            }`}
                          >
                            {t}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Calculation Mode */}
                <View className="mb-3">
                  <Text className="text-white/70 text-xs font-bold mb-1.5">Calculation Type *</Text>
                  <View className="flex-row gap-2.5">
                    {(['flat', 'percentage'] as const).map((calc) => {
                      const isSel = compCalcType === calc;
                      return (
                        <Pressable
                          key={calc}
                          onPress={() => setCompCalcType(calc)}
                          className={`flex-1 py-2.5 rounded-xl border items-center justify-center ${
                            isSel ? 'bg-[#f0c110] border-[#f0c110]' : 'bg-black/40 border-white/15'
                          }`}
                        >
                          <Text
                            className={`text-xs font-bold ${
                              isSel ? 'text-[#101415]' : 'text-white/70'
                            }`}
                          >
                            {calc === 'flat' ? 'Flat Amount (₹)' : '% of Basic Pay'}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Default Amount / Percentage */}
                <View className="mb-6">
                  <Text className="text-white/70 text-xs font-bold mb-1.5">
                    Default {compCalcType === 'percentage' ? 'Percentage (%)' : 'Amount (₹)'}
                  </Text>
                  <TextInput
                    value={compDefaultAmount}
                    onChangeText={setCompDefaultAmount}
                    placeholder={compCalcType === 'percentage' ? 'e.g. 20' : 'e.g. 5000'}
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="numeric"
                    className="bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs font-semibold"
                  />
                </View>

                <Pressable
                  onPress={handleSaveComponent}
                  className="w-full py-3.5 rounded-xl bg-[#f0c110] items-center justify-center active:scale-95 shadow-md shadow-[#f0c110]/30"
                >
                  <Text className="text-[#101415] text-xs font-extrabold uppercase tracking-wider">
                    {editingComp ? 'Save Component' : 'Create Component'}
                  </Text>
                </Pressable>
              </ScrollView>
            </GlassCard>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= CONFIGURE / ASSIGN SALARY MODAL ================= */}
      <Modal
        visible={assignModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAssignModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCardContainer}>
            <GlassCard
              className="p-6 border border-white/15 max-h-[85vh]"
              style={{
                backgroundColor: '#16191b',
                borderRadius: 28,
                shadowColor: '#f0c110',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
              }}
            >
              {selectedStaff && (
                <>
                  {/* Modal Header */}
                  <View className="flex-row items-center justify-between pb-4 border-b border-white/10 mb-4">
                    <View className="flex-row items-center gap-3">
                      <Image
                        source={{ uri: selectedStaff.avatar }}
                        className="w-12 h-12 rounded-2xl border border-white/20"
                      />
                      <View>
                        <Text className="text-white font-bold text-base">{selectedStaff.name}</Text>
                        <Text className="text-[#ffe5a0] text-xs font-semibold">
                          Base CTC: ₹{selectedStaff.baseSalary.toLocaleString('en-IN')}/mo
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => setAssignModalVisible(false)}
                      className="w-8 h-8 rounded-full bg-white/10 items-center justify-center active:bg-white/20"
                    >
                      <X size={16} color="#FFF" />
                    </Pressable>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false} className="pr-1">
                    {/* Live Calculation Preview Banner */}
                    <View className="bg-black/50 p-3.5 rounded-2xl border border-white/10 mb-4">
                      <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-white/60 text-xs">Gross Earnings</Text>
                        <Text className="text-[#41eec2] font-bold text-xs">
                          ₹{currentModalCalculation.gross.toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-white/60 text-xs">Total Deductions</Text>
                        <Text className="text-rose-400 font-bold text-xs">
                          -₹{currentModalCalculation.ded.toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View className="flex-row justify-between items-center pt-2 border-t border-white/10">
                        <Text className="text-white font-bold text-xs">Net Take-Home Pay</Text>
                        <Text className="text-[#f0c110] font-extrabold text-base">
                          ₹{currentModalCalculation.net.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>

                    {/* List of Component Amount Inputs */}
                    <Text className="text-white/70 text-xs font-bold mb-2 uppercase tracking-wider">
                      COMPONENT ALLOCATIONS (₹)
                    </Text>
                    <View className="gap-2.5 mb-6">
                      {components.map((comp) => {
                        const isEarning = comp.type === 'earning';
                        return (
                          <View key={comp.id} className="bg-black/40 p-3 rounded-2xl border border-white/5">
                            <View className="flex-row justify-between items-center mb-1.5">
                              <Text className="text-white font-bold text-xs">{comp.name}</Text>
                              <Text
                                className={`text-[9.5px] font-extrabold uppercase ${
                                  isEarning ? 'text-[#41eec2]' : 'text-rose-400'
                                }`}
                              >
                                {comp.type}
                              </Text>
                            </View>
                            <TextInput
                              value={editValues[comp.id] || '0'}
                              onChangeText={(t) => setEditValues((prev) => ({ ...prev, [comp.id]: t }))}
                              placeholder="0"
                              placeholderTextColor="rgba(255,255,255,0.3)"
                              keyboardType="numeric"
                              className="bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-white text-xs font-semibold"
                            />
                          </View>
                        );
                      })}
                    </View>

                    <Pressable
                      onPress={handleSaveStaffSalary}
                      className="w-full py-3.5 rounded-xl bg-[#f0c110] items-center justify-center active:scale-95 shadow-md shadow-[#f0c110]/30 mb-2"
                    >
                      <Text className="text-[#101415] text-xs font-extrabold uppercase tracking-wider">
                        Confirm & Save Salary
                      </Text>
                    </Pressable>
                  </ScrollView>
                </>
              )}
            </GlassCard>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= CUSTOM ALERT MODAL ================= */}
      <Modal
        visible={customAlert.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
      >
        <View style={styles.alertOverlay}>
          <GlassCard
            className="w-[85%] max-w-[340px] p-6 border border-white/10 items-center"
            style={{
              backgroundColor: '#16191b',
              borderRadius: 28,
              shadowColor: '#f0c110',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
            }}
          >
            <View
              className={`w-12 h-12 rounded-2xl mb-4 items-center justify-center border ${
                customAlert.type === 'confirm_delete' || customAlert.type === 'error'
                  ? 'bg-red-500/15 border-red-500/30'
                  : 'bg-[#f0c110]/15 border-[#f0c110]/30'
              }`}
            >
              {customAlert.type === 'confirm_delete' || customAlert.type === 'error' ? (
                <AlertTriangle size={24} color="#ffb4ab" />
              ) : (
                <Check size={24} color="#f0c110" strokeWidth={3} />
              )}
            </View>

            <Text className="text-white text-lg font-bold font-display-md text-center mb-2">
              {customAlert.title}
            </Text>
            <Text className="text-white/60 text-xs text-center leading-relaxed mb-6 px-1">
              {customAlert.message}
            </Text>

            {customAlert.type === 'confirm_delete' ? (
              <View className="flex-row gap-2 w-full">
                <Pressable
                  onPress={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
                  className="flex-1 py-3 rounded-xl bg-white/10 border border-white/15 items-center active:scale-95"
                >
                  <Text className="text-white text-xs font-bold uppercase">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => customAlert.onConfirm && customAlert.onConfirm()}
                  className="flex-1 py-3 rounded-xl bg-red-600 items-center active:scale-95 shadow-md shadow-red-600/30"
                >
                  <Text className="text-white text-xs font-bold uppercase">Delete</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
                className="w-full py-3.5 rounded-xl bg-[#f0c110] items-center active:scale-95 shadow-md shadow-[#f0c110]/30"
              >
                <Text className="text-[#101415] text-xs font-bold uppercase tracking-wider">Dismiss</Text>
              </Pressable>
            )}
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101415',
  },
  header: {
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(16, 20, 21, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCardContainer: {
    width: '100%',
    maxWidth: 480,
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 20, 21, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SuperAdminSalaryCategoriesScreen;
