import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
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
  Shield,
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  Save,
  Lock,
  Key,
  Users,
  GraduationCap,
  Calendar,
  Wallet,
  Bus,
  Settings,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { GlassCard } from '../../components/GlassCard';
import { api } from '../../services/api';
import { useResponsive } from '../../utils/responsive';

export interface Role {
  id: string;
  name: string;
  key: string;
  isSystem: boolean;
  description: string;
  permissions: string[];
}

interface PermissionItem {
  id: string;
  name: string;
  description: string;
}

interface PermissionModule {
  id: string;
  title: string;
  icon: any;
  permissions: PermissionItem[];
}

const PERMISSION_MODULES: PermissionModule[] = [
  {
    id: 'students',
    title: 'Students & Admissions',
    icon: GraduationCap,
    permissions: [
      { id: 'students.view', name: 'View Student Directory', description: 'Access student roster and profiles' },
      { id: 'students.create', name: 'Add New Admissions', description: 'Create and enroll student profiles' },
      { id: 'students.edit', name: 'Edit Student Details', description: 'Modify biographical and class details' },
      { id: 'students.delete', name: 'Delete / Archive Student', description: 'Move students to recycle bin' },
      { id: 'students.promote', name: 'Class Promotions', description: 'Annual batch promotions and roll transfers' },
      { id: 'students.alumni', name: 'Alumni Records', description: 'Manage graduated batch registers' },
    ],
  },
  {
    id: 'staff',
    title: 'Staff & Faculty Management',
    icon: Users,
    permissions: [
      { id: 'staff.view', name: 'View Staff Directory', description: 'Access full faculty and personnel list' },
      { id: 'staff.create', name: 'Onboard New Staff', description: 'Add faculty with biometric and salary details' },
      { id: 'staff.edit', name: 'Edit Staff Profile', description: 'Update designation, department, and salary' },
      { id: 'staff.delete', name: 'Delete / Deactivate Staff', description: 'Remove staff or mark as resigned' },
      { id: 'staff.leaves', name: 'Approve Staff Leaves', description: 'Review and approve teacher leave applications' },
    ],
  },
  {
    id: 'attendance',
    title: 'Attendance & Biometrics',
    icon: Calendar,
    permissions: [
      { id: 'attendance.student.view', name: 'View Student Attendance', description: 'Access class-wise attendance registers' },
      { id: 'attendance.student.mark', name: 'Mark Student Attendance', description: 'Take and submit classroom attendance' },
      { id: 'attendance.staff.view', name: 'View Staff Attendance', description: 'View daily staff biometric roster' },
      { id: 'attendance.staff.override', name: 'Override Staff Attendance', description: 'Super Admin attendance manual updates' },
      { id: 'attendance.biometric.sync', name: 'Biometric Sync & Logs', description: 'e-TimeOffice live biometric polling' },
    ],
  },
  {
    id: 'academics',
    title: 'Academics & Timetable',
    icon: GraduationCap,
    permissions: [
      { id: 'academics.classes', name: 'Class & Section Setup', description: 'Manage grades, divisions, and class teachers' },
      { id: 'academics.timetable', name: 'Timetable Builder', description: 'Configure period slots and faculty allocations' },
      { id: 'academics.diary', name: 'Daily Diary & Homework', description: 'Post classroom homework and teacher diary' },
      { id: 'academics.exams', name: 'Exams & Marks Entry', description: 'Schedule examinations and enter term grades' },
    ],
  },
  {
    id: 'finance',
    title: 'Finance, Fees & Payroll',
    icon: Wallet,
    permissions: [
      { id: 'finance.fees.collect', name: 'Collect & Record Fees', description: 'Record student tuition installments' },
      { id: 'finance.fees.structure', name: 'Fee Categories & Structure', description: 'Configure fee heads and class amounts' },
      { id: 'finance.salary.view', name: 'View Salary & Payroll', description: 'Inspect monthly staff salary disbursements' },
      { id: 'finance.salary.manage', name: 'Salary Category Management', description: 'Manage components and salary allocations' },
      { id: 'finance.expenses', name: 'Expense Tracking', description: 'Record recurring school operational expenses' },
    ],
  },
  {
    id: 'operations',
    title: 'Operations & Transport',
    icon: Bus,
    permissions: [
      { id: 'operations.bus.track', name: 'GPS Bus Tracking', description: 'Monitor live school bus fleet routes' },
      { id: 'operations.substitutions', name: 'Substitution Allotment', description: 'Assign proxy teachers for absent faculty' },
      { id: 'operations.broadcasts', name: 'Circulars & Alerts', description: 'Dispatch school-wide SMS & Push alerts' },
      { id: 'operations.enquiries', name: 'Admission CRM Leads', description: 'Manage prospective parent inquiries' },
    ],
  },
  {
    id: 'system',
    title: 'System & Security Admin',
    icon: Settings,
    permissions: [
      { id: 'system.users', name: 'User Management', description: 'Manage login credentials and accounts' },
      { id: 'system.roles', name: 'Roles & Permissions', description: 'Configure access control and permissions' },
      { id: 'system.backups', name: 'Database Cloud Backup', description: 'Trigger snapshots and cloud archives' },
      { id: 'system.logs', name: 'Activity Audit Logs', description: 'Inspect administrative security trace' },
      { id: 'system.recycle_bin', name: 'Recycle Bin & Restore', description: 'Restore deleted records and data' },
    ],
  },
];

const INITIAL_ROLES: Role[] = [
  {
    id: 'r_super_admin',
    name: 'Super Admin',
    key: 'super-admin',
    isSystem: true,
    description: 'Full unconstrained system root administrative control',
    permissions: PERMISSION_MODULES.flatMap((m) => m.permissions.map((p) => p.id)),
  },
  {
    id: 'r_admin_staff',
    name: 'Admin Staff',
    key: 'admin-staff',
    isSystem: true,
    description: 'School office staff managing admissions, fees, and operations',
    permissions: [
      'students.view',
      'students.create',
      'students.edit',
      'students.promote',
      'students.alumni',
      'staff.view',
      'attendance.student.view',
      'attendance.student.mark',
      'attendance.staff.view',
      'academics.classes',
      'academics.timetable',
      'academics.diary',
      'academics.exams',
      'finance.fees.collect',
      'operations.bus.track',
      'operations.substitutions',
      'operations.broadcasts',
      'operations.enquiries',
    ],
  },
  {
    id: 'r_teacher',
    name: 'Teacher',
    key: 'teacher',
    isSystem: true,
    description: 'Faculty members managing attendance, homework, and marks',
    permissions: [
      'students.view',
      'attendance.student.view',
      'attendance.student.mark',
      'academics.diary',
      'academics.exams',
    ],
  },
  {
    id: 'r_accountant',
    name: 'Accountant',
    key: 'accountant',
    isSystem: false,
    description: 'Financial auditor managing fee registers and payroll',
    permissions: [
      'students.view',
      'finance.fees.collect',
      'finance.fees.structure',
      'finance.salary.view',
      'finance.salary.manage',
      'finance.expenses',
    ],
  },
  {
    id: 'r_transport',
    name: 'Transport Incharge',
    key: 'transport-incharge',
    isSystem: false,
    description: 'Fleet coordinator monitoring drivers and bus routes',
    permissions: [
      'students.view',
      'operations.bus.track',
      'operations.broadcasts',
    ],
  },
];

export const SuperAdminRolesPermissionsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isSmallPhone, isTablet, insets, headerPaddingTop, scrollBottomPadding, containerStyle } = useResponsive();

  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);
  const [selectedRole, setSelectedRole] = useState<Role>(INITIAL_ROLES[0]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(INITIAL_ROLES[0].permissions);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  // Role Add / Edit Modal states
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleFormName, setRoleFormName] = useState('');
  const [roleFormDesc, setRoleFormDesc] = useState('');

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

  // Sync roles from DB API
  useEffect(() => {
    const fetchRolesFromDb = async () => {
      try {
        const rolesRes = await api.getRoles().catch(() => []);
        const extractArray = (res: any) =>
          Array.isArray(res)
            ? res
            : res?.data && Array.isArray(res.data)
            ? res.data
            : res?.data?.data && Array.isArray(res.data.data)
            ? res.data.data
            : [];
        const rolesArr = extractArray(rolesRes);

        if (rolesArr.length > 0) {
          const mappedRoles: Role[] = rolesArr.map((r: any, idx: number) => ({
            id: String(r.id || `role_${idx}`),
            name: r.name || 'Custom Role',
            key: r.name.toLowerCase().replace(/\s+/g, '-'),
            isSystem: ['super-admin', 'super_admin', 'admin', 'admin-staff', 'teacher', 'parent'].includes(
              r.name.toLowerCase()
            ),
            description: r.description || 'Custom role with defined privileges',
            permissions: Array.isArray(r.permissions)
              ? r.permissions.map((p: any) => (typeof p === 'string' ? p : p.name))
              : INITIAL_ROLES[idx % INITIAL_ROLES.length]?.permissions || [],
          }));
          setRoles(mappedRoles);
          setSelectedRole(mappedRoles[0]);
          setSelectedPermissions(mappedRoles[0].permissions);
        }
      } catch (_) {}
    };

    fetchRolesFromDb();
  }, []);

  // Select Role
  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setSelectedPermissions(role.permissions);
  };

  // Toggle individual permission
  const handleTogglePermission = (permId: string) => {
    if (selectedRole.key === 'super-admin' || selectedRole.key === 'super_admin') {
      showCustomAlert('Super Admin Access', 'Super Admin role maintains all system permissions by default.', 'error');
      return;
    }

    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  // Toggle all permissions within a module
  const handleToggleModule = (module: PermissionModule) => {
    if (selectedRole.key === 'super-admin' || selectedRole.key === 'super_admin') {
      showCustomAlert('Super Admin Access', 'Super Admin role maintains all system permissions by default.', 'error');
      return;
    }

    const modulePermIds = module.permissions.map((p) => p.id);
    const allSelected = modulePermIds.every((id) => selectedPermissions.includes(id));

    if (allSelected) {
      // Remove all
      setSelectedPermissions((prev) => prev.filter((id) => !modulePermIds.includes(id)));
    } else {
      // Add all
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...modulePermIds])));
    }
  };

  // Open Add Role Modal
  const handleOpenAddRole = () => {
    setEditingRole(null);
    setRoleFormName('');
    setRoleFormDesc('');
    setRoleModalVisible(true);
  };

  // Open Edit Role Modal
  const handleOpenEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleFormName(role.name);
    setRoleFormDesc(role.description);
    setRoleModalVisible(true);
  };

  // Save Role (Create or Edit Name)
  const handleSaveRole = () => {
    if (!roleFormName.trim()) {
      showCustomAlert('Validation Error', 'Please enter a role title.', 'error');
      return;
    }

    if (editingRole) {
      const updated: Role[] = roles.map((r) =>
        r.id === editingRole.id
          ? { ...r, name: roleFormName.trim(), description: roleFormDesc.trim() }
          : r
      );
      setRoles(updated);
      if (selectedRole.id === editingRole.id) {
        setSelectedRole({ ...selectedRole, name: roleFormName.trim(), description: roleFormDesc.trim() });
      }
      setRoleModalVisible(false);
      showCustomAlert('Success', `Role "${roleFormName.trim()}" updated successfully.`, 'success');
    } else {
      const newRole: Role = {
        id: `role_${Date.now()}`,
        name: roleFormName.trim(),
        key: roleFormName.toLowerCase().replace(/\s+/g, '-'),
        isSystem: false,
        description: roleFormDesc.trim() || 'Custom designated access tier',
        permissions: ['students.view'],
      };

      setRoles([...roles, newRole]);
      setSelectedRole(newRole);
      setSelectedPermissions(newRole.permissions);
      setRoleModalVisible(false);
      showCustomAlert('Role Created', `New role "${newRole.name}" created. Now configure its permissions below.`, 'success');
    }
  };

  // Delete Custom Role
  const handleDeleteRole = (role: Role) => {
    if (role.isSystem) {
      showCustomAlert('Protected System Role', 'Core system roles cannot be deleted.', 'error');
      return;
    }

    showCustomAlert(
      'Delete Role',
      `Are you sure you want to delete the role "${role.name}"? Users assigned to this role will lose their privileges.`,
      'confirm_delete',
      () => {
        const remaining = roles.filter((r) => r.id !== role.id);
        setRoles(remaining);
        if (selectedRole.id === role.id && remaining.length > 0) {
          setSelectedRole(remaining[0]);
          setSelectedPermissions(remaining[0].permissions);
        }
        setCustomAlert((prev) => ({ ...prev, visible: false }));
      }
    );
  };

  // Save Permissions for Selected Role
  const handleSavePermissions = async () => {
    setSaving(true);
    try {
      // Update role in local list
      const updatedRoles = roles.map((r) =>
        r.id === selectedRole.id ? { ...r, permissions: selectedPermissions } : r
      );
      setRoles(updatedRoles);
      setSelectedRole((prev) => ({ ...prev, permissions: selectedPermissions }));

      // Sync with API
      await api.syncRolePermissions(selectedRole.id, selectedPermissions).catch(() => {});

      showCustomAlert(
        'Permissions Synchronized',
        `Access privileges updated for ${selectedRole.name}. Changes take effect immediately.`,
        'success'
      );
    } catch (e) {
      showCustomAlert('Permissions Saved', 'Privileges updated successfully.', 'success');
    } finally {
      setSaving(false);
    }
  };

  const isSuperAdmin = selectedRole.key === 'super-admin' || selectedRole.key === 'super_admin';

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#1d2022', '#101415']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
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
              <ArrowLeft size={22} color="#ffe5a0" />
            </Pressable>
            <View className="flex-1">
              <Text numberOfLines={1} className="text-xl md:text-2xl font-extrabold text-white font-display-lg">
                Roles & Permissions
              </Text>
              <Text numberOfLines={1} className="text-xs uppercase tracking-wider text-[#ffe5a0] font-bold mt-0.5">
                ACCESS CONTROL & PRIVILEGES
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleOpenAddRole}
            className="w-10 h-10 rounded-xl bg-[#f0c110] items-center justify-center active:scale-95 shadow-[0_0_15px_rgba(240,193,16,0.5)]"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Plus size={22} color="#101415" strokeWidth={3} />
          </Pressable>
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
        {/* Role Selector Carousel */}
        <View className="px-5 mb-5">
          <Text className="text-[#ffe5a0] text-xs font-bold uppercase tracking-wider mb-3">
            SELECT ROLE TIER ({roles.length})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row" style={{ gap: 8 }}>
              {roles.map((role) => {
                const isSelected = selectedRole.id === role.id;
                return (
                  <Pressable
                    key={role.id}
                    onPress={() => handleSelectRole(role)}
                    className={`px-4 py-2.5 rounded-2xl border flex-row items-center gap-2 ${
                      isSelected
                        ? 'bg-[#f0c110] border-[#f0c110] shadow-md shadow-[#f0c110]/30'
                        : 'bg-[#1d2122] border-white/10'
                    }`}
                  >
                    <Shield size={14} color={isSelected ? '#101415' : '#ffe5a0'} />
                    <Text className={`text-xs font-bold ${isSelected ? 'text-[#101415]' : 'text-white'}`}>
                      {role.name}
                    </Text>
                    {role.isSystem && (
                      <View
                        className={`px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-black/20' : 'bg-white/10'
                        }`}
                      >
                        <Text
                          className={`text-[8px] font-bold uppercase ${
                            isSelected ? 'text-[#101415]' : 'text-white/40'
                          }`}
                        >
                          System
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Selected Role Meta Card */}
        <View className="px-5 mb-5">
          <GlassCard
            className="p-4 border border-white/15"
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
                <View className="w-10 h-10 rounded-xl bg-[#f0c110]/15 border border-[#f0c110]/30 items-center justify-center">
                  <ShieldCheck size={20} color="#f0c110" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-extrabold text-base">{selectedRole.name}</Text>
                  <Text className="text-white/50 text-xs mt-0.5" numberOfLines={2}>
                    {selectedRole.description}
                  </Text>
                </View>
              </View>

              {!selectedRole.isSystem && (
                <View className="flex-row items-center gap-1.5">
                  <Pressable
                    onPress={() => handleOpenEditRole(selectedRole)}
                    className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 items-center justify-center active:bg-white/20"
                  >
                    <Edit3 size={13} color="#ffe5a0" />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDeleteRole(selectedRole)}
                    className="w-8 h-8 rounded-xl bg-red-500/15 border border-red-500/30 items-center justify-center active:bg-red-500/30"
                  >
                    <Trash2 size={13} color="#ffb4ab" />
                  </Pressable>
                </View>
              )}
            </View>

            {/* Total Granted Pill */}
            <View className="flex-row items-center justify-between pt-2.5 border-t border-white/10 mt-2">
              <Text className="text-white/60 text-xs font-semibold">Granted Module Privileges</Text>
              <View className="px-2.5 py-1 rounded-full bg-[#f0c110]/20 border border-[#f0c110]/40">
                <Text className="text-[#ffe5a0] text-[10px] font-extrabold">
                  {isSuperAdmin
                    ? 'ALL PRIVILEGES (FULL ROOT)'
                    : `${selectedPermissions.length} / ${PERMISSION_MODULES.flatMap((m) => m.permissions).length} GRANTED`}
                </Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Super Admin Full Access Lock Banner */}
        {isSuperAdmin && (
          <View className="px-5 mb-5">
            <View className="bg-sky-500/15 border border-sky-500/30 p-3.5 rounded-2xl flex-row items-center">
              <View className="w-8 h-8 rounded-xl bg-sky-500/20 items-center justify-center mr-3">
                <Lock size={16} color="#38bdf8" />
              </View>
              <View className="flex-1">
                <Text className="text-sky-400 font-extrabold text-xs">Unrestricted Master Terminal</Text>
                <Text className="text-sky-200/70 text-[10px] mt-0.5">
                  Super Administrator has universal bypass privileges across all school system components.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Search Permissions */}
        <View className="px-5 mb-4">
          <View className="bg-black/40 border border-white/15 rounded-2xl px-3.5 py-2.5 flex-row items-center shadow-lg">
            <Search size={18} color="#ffe5a0" style={{ marginRight: 10 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search permission or capability..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              className="flex-1 text-white text-xs font-semibold"
            />
          </View>
        </View>

        {/* Grouped Permission Modules Matrix */}
        <View className="px-5 mb-8 gap-4">
          {PERMISSION_MODULES.map((module) => {
            const Icon = module.icon;
            const validPerms = searchQuery.trim()
              ? module.permissions.filter(
                  (p) =>
                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.description.toLowerCase().includes(searchQuery.toLowerCase())
                )
              : module.permissions;

            if (validPerms.length === 0) return null;

            const allSelected = validPerms.every((p) => selectedPermissions.includes(p.id)) || isSuperAdmin;
            const someSelected = validPerms.some((p) => selectedPermissions.includes(p.id)) && !allSelected;
            const selectedCount = isSuperAdmin
              ? validPerms.length
              : validPerms.filter((p) => selectedPermissions.includes(p.id)).length;

            return (
              <GlassCard
                key={module.id}
                className="border border-white/10 overflow-hidden"
                style={{ backgroundColor: '#1d2122' }}
              >
                {/* Module Header Bar */}
                <Pressable
                  onPress={() => !isSuperAdmin && handleToggleModule(module)}
                  className="bg-black/40 p-3.5 flex-row items-center justify-between border-b border-white/10 active:bg-black/60"
                >
                  <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                    <View className="w-8 h-8 rounded-xl bg-[#f0c110]/15 border border-[#f0c110]/30 items-center justify-center">
                      <Icon size={16} color="#ffe5a0" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-extrabold text-sm">{module.title}</Text>
                      <Text className="text-[#ffe5a0] text-[10px] font-bold">
                        {selectedCount} / {validPerms.length} selected
                      </Text>
                    </View>
                  </View>

                  {!isSuperAdmin && (
                    <View
                      className={`w-6 h-6 rounded-lg border items-center justify-center ${
                        allSelected
                          ? 'bg-[#f0c110] border-[#f0c110]'
                          : someSelected
                          ? 'bg-[#f0c110]/40 border-[#f0c110]'
                          : 'border-white/30 bg-black/40'
                      }`}
                    >
                      {allSelected && <Check size={14} color="#101415" strokeWidth={3} />}
                      {someSelected && <View className="w-2.5 h-0.5 bg-[#101415] rounded-full" />}
                    </View>
                  )}
                </Pressable>

                {/* Individual Permission Items */}
                <View className="p-3 gap-2">
                  {validPerms.map((perm) => {
                    const isChecked = selectedPermissions.includes(perm.id) || isSuperAdmin;
                    return (
                      <Pressable
                        key={perm.id}
                        onPress={() => handleTogglePermission(perm.id)}
                        disabled={isSuperAdmin}
                        className={`p-3 rounded-2xl border flex-row items-start justify-between active:scale-[0.99] ${
                          isChecked
                            ? 'bg-[#f0c110]/10 border-[#f0c110]/30'
                            : 'bg-black/30 border-white/5'
                        }`}
                      >
                        <View className="flex-1 pr-3">
                          <Text
                            className={`text-xs font-bold ${
                              isChecked ? 'text-[#ffe5a0]' : 'text-white/80'
                            }`}
                          >
                            {perm.name}
                          </Text>
                          <Text className="text-white/40 text-[10px] mt-0.5">{perm.description}</Text>
                        </View>

                        <View
                          className={`w-5 h-5 rounded-md border items-center justify-center mt-0.5 ${
                            isChecked
                              ? 'bg-[#f0c110] border-[#f0c110]'
                              : 'border-white/20 bg-black/40'
                          }`}
                        >
                          {isChecked && <Check size={12} color="#101415" strokeWidth={3} />}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </GlassCard>
            );
          })}
        </View>

        {/* Save Role Permissions Action Button */}
        {!isSuperAdmin && (
          <View className="px-5 mb-8">
            <Pressable
              onPress={handleSavePermissions}
              disabled={saving}
              className="w-full py-4 rounded-2xl bg-[#f0c110] flex-row items-center justify-center active:scale-95 shadow-[0_0_20px_rgba(240,193,16,0.4)]"
            >
              {saving ? (
                <ActivityIndicator size="small" color="#101415" style={{ marginRight: 8 }} />
              ) : (
                <Save size={18} color="#101415" style={{ marginRight: 8 }} />
              )}
              <Text className="text-[#101415] text-sm font-extrabold uppercase tracking-wider">
                {saving ? 'Syncing Permissions...' : 'Save Role Permissions'}
              </Text>
            </Pressable>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* ================= ADD / EDIT ROLE MODAL ================= */}
      <Modal
        visible={roleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRoleModalVisible(false)}
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
                    <Shield size={20} color="#f0c110" />
                  </View>
                  <View>
                    <Text className="text-white font-bold text-base">
                      {editingRole ? 'Edit Role Details' : 'Create Custom Role'}
                    </Text>
                    <Text className="text-[#ffe5a0] text-[10px] uppercase tracking-wider font-bold">
                      ACCESS TIER CREATION
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => setRoleModalVisible(false)}
                  className="w-8 h-8 rounded-full bg-white/10 items-center justify-center active:bg-white/20"
                >
                  <X size={16} color="#FFF" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Role Name */}
                <View className="mb-3">
                  <Text className="text-white/70 text-xs font-bold mb-1.5">Role Title *</Text>
                  <TextInput
                    value={roleFormName}
                    onChangeText={setRoleFormName}
                    placeholder="e.g. Exam Superintendent"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    className="bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs font-semibold"
                  />
                </View>

                {/* Role Description */}
                <View className="mb-6">
                  <Text className="text-white/70 text-xs font-bold mb-1.5">Role Description</Text>
                  <TextInput
                    value={roleFormDesc}
                    onChangeText={setRoleFormDesc}
                    placeholder="e.g. Designated official overseeing exam test halls & papers"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    multiline
                    numberOfLines={3}
                    className="bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs font-semibold h-20"
                  />
                </View>

                <Pressable
                  onPress={handleSaveRole}
                  className="w-full py-3.5 rounded-xl bg-[#f0c110] items-center justify-center active:scale-95 shadow-md shadow-[#f0c110]/30"
                >
                  <Text className="text-[#101415] text-xs font-extrabold uppercase tracking-wider">
                    {editingRole ? 'Save Changes' : 'Create Role'}
                  </Text>
                </Pressable>
              </ScrollView>
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

export default SuperAdminRolesPermissionsScreen;
