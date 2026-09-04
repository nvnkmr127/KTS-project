import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  GraduationCap, Search, Plus, Phone, Mail, 
  MapPin, Briefcase, Calendar, Trash2, Pencil, Eye, X, 
  CheckCircle2, AlertCircle, Award, Users, Filter
} from 'lucide-react-native';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { GlassCard } from '../../components/GlassCard';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useResponsive } from '../../utils/responsive';

export interface AlumniMember {
  id: string;
  name: string;
  passoutYear: string;
  graduatedClass: string;
  occupation: string;
  companyOrInstitute: string;
  phone: string;
  email: string;
  city: string;
  avatarColor: string;
}

const MOCK_ALUMNI: AlumniMember[] = [
  {
    id: 'alm_1',
    name: 'Priya Sharma',
    passoutYear: '2025',
    graduatedClass: 'Class 10 — Section A',
    occupation: 'Engineering Student',
    companyOrInstitute: 'IIT Hyderabad (Computer Science)',
    phone: '+91 98765 43210',
    email: 'priya.sharma@example.com',
    city: 'Hyderabad, TS',
    avatarColor: '#00f1a1'
  },
  {
    id: 'alm_2',
    name: 'Arjun Reddy',
    passoutYear: '2025',
    graduatedClass: 'Class 10 — Section B',
    occupation: 'Medical Student',
    companyOrInstitute: 'Osmania Medical College',
    phone: '+91 98480 11223',
    email: 'arjun.reddy@example.com',
    city: 'Hyderabad, TS',
    avatarColor: '#38bdf8'
  },
  {
    id: 'alm_3',
    name: 'Ananya Singh',
    passoutYear: '2024',
    graduatedClass: 'Class 10 — Section A',
    occupation: 'Software Engineer',
    companyOrInstitute: 'Microsoft India',
    phone: '+91 97001 22334',
    email: 'ananya.singh@example.com',
    city: 'Bengaluru, KA',
    avatarColor: '#c084fc'
  },
  {
    id: 'alm_4',
    name: 'Rohan Verma',
    passoutYear: '2024',
    graduatedClass: 'Class 10 — Section B',
    occupation: 'Commerce Student',
    companyOrInstitute: 'St. Francis College',
    phone: '+91 99887 76655',
    email: 'rohan.v@example.com',
    city: 'Secunderabad, TS',
    avatarColor: '#f59e0b'
  }
];

export const AlumniManagementScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';
  const { insets, isSmallPhone, isTablet, scrollBottomPadding, containerStyle } = useResponsive();
  const [alumniList, setAlumniList] = useState<AlumniMember[]>(MOCK_ALUMNI);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYearFilter, setSelectedYearFilter] = useState('All');

  useEffect(() => {
    const fetchAlumni = async () => {
      try {
        const res = await api.getResources('alumni');
        if (Array.isArray(res) && res.length > 0) {
          const mapped: AlumniMember[] = res.map((a: any) => ({
            id: String(a.id),
            name: a.name || `${a.first_name || ''} ${a.last_name || ''}`.trim() || 'Alumni Member',
            passoutYear: a.passout_year || a.year || '2025',
            graduatedClass: a.graduated_class || a.class_name || 'Class 10 — Section A',
            occupation: a.occupation || 'Professional',
            companyOrInstitute: a.company_institute || a.institute || 'University',
            phone: a.phone || a.mobile || '+91 98765 43210',
            email: a.email || 'alumni@example.com',
            city: a.city || 'Hyderabad, TS',
            avatarColor: '#00f1a1',
          }));
          setAlumniList(mapped);
        }
      } catch (err) {
        console.log('Error loading alumni:', err);
      }
    };
    fetchAlumni();
  }, []);

  // Modal States
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingAlumni, setEditingAlumni] = useState<AlumniMember | null>(null);
  const [viewingAlumni, setViewingAlumni] = useState<AlumniMember | null>(null);
  const [deletingAlumni, setDeletingAlumni] = useState<AlumniMember | null>(null);

  // Form States
  const [formName, setFormName] = useState('');
  const [formYear, setFormYear] = useState('2025');
  const [formClass, setFormClass] = useState('Class 10 — Section A');
  const [formOccupation, setFormOccupation] = useState('Engineering Student');
  const [formInstitute, setFormInstitute] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCity, setFormCity] = useState('Hyderabad');

  // Custom Toast State
  const [toastData, setToastData] = useState<{ visible: boolean; title: string; message: string; type?: 'success' | 'warning' }>({
    visible: false, title: '', message: '', type: 'success'
  });

  const showToast = (title: string, message: string, type: 'success' | 'warning' = 'success') => {
    setToastData({ visible: true, title, message, type });
  };

  const filteredAlumni = alumniList.filter(item => {
    const matchesYear = selectedYearFilter === 'All' || item.passoutYear === selectedYearFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.occupation.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.companyOrInstitute.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesYear && matchesSearch;
  });

  const handleOpenAddModal = () => {
    setEditingAlumni(null);
    setFormName('');
    setFormYear('2025');
    setFormClass('Class 10 — Section A');
    setFormOccupation('Engineering Student');
    setFormInstitute('IIT Hyderabad');
    setFormPhone('+91 98765 00112');
    setFormEmail('alumni.student@example.com');
    setFormCity('Hyderabad, TS');
    setShowAddEditModal(true);
  };

  const handleOpenEditModal = (alm: AlumniMember) => {
    setEditingAlumni(alm);
    setFormName(alm.name);
    setFormYear(alm.passoutYear);
    setFormClass(alm.graduatedClass);
    setFormOccupation(alm.occupation);
    setFormInstitute(alm.companyOrInstitute);
    setFormPhone(alm.phone);
    setFormEmail(alm.email);
    setFormCity(alm.city);
    setShowAddEditModal(true);
  };

  const handleSaveAlumni = () => {
    if (!formName.trim()) {
      showToast('Missing Name', 'Please enter alumni student name.', 'warning');
      return;
    }

    if (editingAlumni) {
      setAlumniList(prev => prev.map(a => a.id === editingAlumni.id ? {
        ...a,
        name: formName,
        passoutYear: formYear,
        graduatedClass: formClass,
        occupation: formOccupation,
        companyOrInstitute: formInstitute || 'Higher Studies',
        phone: formPhone || '+91 98765 00000',
        email: formEmail || 'alumni@example.com',
        city: formCity || 'Hyderabad'
      } : a));
      showToast('Alumni Updated', `${formName} profile updated successfully.`, 'success');
    } else {
      const newAlm: AlumniMember = {
        id: `alm_${Date.now()}`,
        name: formName,
        passoutYear: formYear,
        graduatedClass: formClass,
        occupation: formOccupation,
        companyOrInstitute: formInstitute || 'Higher Studies',
        phone: formPhone || '+91 98765 00000',
        email: formEmail || 'alumni@example.com',
        city: formCity || 'Hyderabad',
        avatarColor: '#00f1a1'
      };
      setAlumniList(prev => [newAlm, ...prev]);
      showToast('Alumni Registered', `${formName} added to alumni directory.`, 'success');
    }

    setShowAddEditModal(false);
  };

  const handleConfirmDeleteAlumni = () => {
    if (!deletingAlumni) return;
    const name = deletingAlumni.name;
    setAlumniList(prev => prev.filter(a => a.id !== deletingAlumni.id));
    setDeletingAlumni(null);
    showToast('Alumni Deleted', `${name} record removed from directory.`, 'warning');
  };

  const primaryColor = isSuperAdmin ? '#ffe5a0' : '#00f1a1';
  const primaryGold = isSuperAdmin ? '#f0c110' : '#00f1a1';
  const primaryTextClass = isSuperAdmin ? 'text-[#ffe5a0]' : 'text-[#00f1a1]';
  const primaryBtnClass = isSuperAdmin ? 'bg-[#f0c110]' : 'bg-[#00f1a1]';
  const primaryBadgeClass = isSuperAdmin ? 'bg-[#f0c110]/20 border border-[#f0c110]/40' : 'bg-[#00f1a1]/20 border border-[#00f1a1]/40';
  const primaryPillClass = isSuperAdmin ? 'bg-amber-500/15 border border-amber-500/30' : 'bg-emerald-500/15 border border-emerald-500/30';

  return (
    <View style={[styles.container, isSuperAdmin && { backgroundColor: '#101415' }]}>
      <LinearGradient
        colors={isSuperAdmin ? ['#1d2022', '#101415'] : ['#0d2a24', '#121414']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <AdminStaffHeader
        onBackPress={navigation?.canGoBack && navigation.canGoBack() ? () => navigation.goBack() : undefined}
        title="Alumni Directory"
        subtitle="Graduates, Higher Education & Career Tracking"
        icon={
          <View className={`w-10 h-10 rounded-xl items-center justify-center ${primaryBadgeClass}`}>
            <GraduationCap size={20} color={primaryColor} />
          </View>
        }
      />

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, containerStyle, { paddingBottom: scrollBottomPadding + 24 }]} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* Top Summary KPI Cards */}
        <View className="px-5 mb-5 flex-row flex-wrap justify-between" style={{ gap: 10 }}>
          <GlassCard intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/80">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/40 text-[10px] font-bold uppercase">Total Alumni</Text>
              <GraduationCap size={14} color={primaryColor} />
            </View>
            <Text className="text-white text-xl font-extrabold">{alumniList.length} Graduates</Text>
            <Text className={`${primaryTextClass} text-[10px] font-semibold mt-0.5`}>● 100% Tracked</Text>
          </GlassCard>

          <GlassCard intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/80">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/40 text-[10px] font-bold uppercase">Pass-out Batches</Text>
              <Calendar size={14} color="#38bdf8" />
            </View>
            <Text className="text-white text-xl font-extrabold">2024 - 2025</Text>
            <Text className="text-sky-400 text-[10px] font-semibold mt-0.5">● Class 10 Graduates</Text>
          </GlassCard>

          <GlassCard intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/80">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/40 text-[10px] font-bold uppercase">Higher Studies</Text>
              <Award size={14} color="#c084fc" />
            </View>
            <Text className="text-white text-xl font-extrabold">75% Enrolled</Text>
            <Text className="text-purple-400 text-[10px] font-semibold mt-0.5">● IIT / Premier Colleges</Text>
          </GlassCard>

          <GlassCard intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/80">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/40 text-[10px] font-bold uppercase">Employed / Jobs</Text>
              <Briefcase size={14} color="#f59e0b" />
            </View>
            <Text className="text-white text-xl font-extrabold">25% Working</Text>
            <Text className="text-amber-400 text-[10px] font-semibold mt-0.5">● Tech & Corporate</Text>
          </GlassCard>
        </View>

        {/* Search & Action Bar */}
        <View className="px-5 mb-5">
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-1 bg-[#101415] border border-white/15 rounded-2xl flex-row items-center px-3.5 py-2.5 mr-3 shadow-md">
              <Search size={16} color={primaryColor} style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Search alumni name, occupation, institute..."
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 text-white text-xs"
                style={{ paddingVertical: 0 }}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <X size={15} color="rgba(255, 255, 255, 0.5)" />
                </Pressable>
              )}
            </View>

            <Pressable
              onPress={handleOpenAddModal}
              className={`${primaryBtnClass} px-3.5 py-2.5 rounded-2xl flex-row items-center justify-center shadow-lg active:scale-95 flex-shrink-0`}
              style={{ minWidth: 105 }}
            >
              <Plus size={15} color="#101415" style={{ marginRight: 4 }} />
              <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: '#101415', fontSize: 12, fontWeight: '800', flexShrink: 0 }}>
                Add Alumni
              </Text>
            </Pressable>
          </View>

          {/* Passout Year Filter Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row" style={{ gap: 8 }}>
              {['All', '2025', '2024', '2023', '2022'].map((yr) => {
                const isSelected = selectedYearFilter === yr;
                return (
                  <Pressable
                    key={yr}
                    onPress={() => setSelectedYearFilter(yr)}
                    className={`px-3.5 py-1.5 rounded-xl border ${isSelected ? (isSuperAdmin ? 'bg-[#f0c110] border-[#f0c110]' : 'bg-[#00f1a1] border-[#00f1a1]') : 'bg-white/5 border-white/15'}`}
                  >
                    <Text className={`text-xs font-bold ${isSelected ? 'text-[#101415]' : 'text-white/70'}`}>
                      {yr === 'All' ? 'All Batches' : `Batch ${yr}`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Alumni Cards Directory */}
        <View className="px-5">
          <Text className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">Registered Alumni Graduates</Text>
          {filteredAlumni.map(alm => (
            <GlassCard key={alm.id} intensity="low" className="mb-4 p-4 border-white/10 bg-[#101415]/90">
              <View className="flex-row justify-between items-start pb-3 border-b border-white/10 mb-3">
                <View className="flex-row items-center flex-1 mr-2">
                  <View
                    className="w-11 h-11 rounded-2xl items-center justify-center mr-3 border border-white/20"
                    style={{ backgroundColor: `${isSuperAdmin ? '#f0c110' : alm.avatarColor}20` }}
                  >
                    <GraduationCap size={22} color={isSuperAdmin ? '#ffe5a0' : alm.avatarColor} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="text-white font-extrabold text-base mr-2">{alm.name}</Text>
                      <View className={`px-2 py-0.5 rounded-md ${primaryBadgeClass}`}>
                        <Text className={`${primaryTextClass} text-[9.5px] font-bold`}>Batch {alm.passoutYear}</Text>
                      </View>
                    </View>
                    <Text className="text-white/50 text-[11px] mt-0.5">{alm.graduatedClass} • {alm.city}</Text>
                  </View>
                </View>

                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <Pressable
                    onPress={() => handleOpenEditModal(alm)}
                    className="bg-white/5 border border-white/10 p-2 rounded-xl"
                  >
                    <Pencil size={14} color="rgba(255,255,255,0.7)" />
                  </Pressable>

                  <Pressable
                    onPress={() => setDeletingAlumni(alm)}
                    className="bg-rose-500/10 border border-rose-500/30 p-2 rounded-xl"
                  >
                    <Trash2 size={14} color="#ff516a" />
                  </Pressable>
                </View>
              </View>

              {/* Career & Higher Education Box */}
              <View className="bg-black/40 p-3 rounded-2xl mb-3 border border-white/5">
                <View className="flex-row items-center mb-1">
                  <Briefcase size={13} color={primaryColor} style={{ marginRight: 6 }} />
                  <Text className="text-white text-xs font-bold">{alm.occupation}</Text>
                </View>
                <Text className="text-white/60 text-[11px] ml-5">{alm.companyOrInstitute}</Text>
              </View>

              {/* Actions */}
              <View className="flex-row justify-between items-center" style={{ gap: 8 }}>
                <Pressable
                  onPress={() => setViewingAlumni(alm)}
                  className={`flex-1 ${primaryBadgeClass} py-2.5 rounded-xl flex-row items-center justify-center`}
                >
                  <Eye size={14} color={primaryColor} style={{ marginRight: 5 }} />
                  <Text className={`${primaryTextClass} text-xs font-bold`}>View Profile</Text>
                </Pressable>

                <Pressable
                  onPress={() => setViewingAlumni(alm)}
                  className="flex-1 bg-sky-500/15 border border-sky-500/40 py-2.5 rounded-xl flex-row items-center justify-center"
                >
                  <Phone size={14} color="#38bdf8" style={{ marginRight: 5 }} />
                  <Text className="text-sky-300 text-xs font-bold">Contact Info</Text>
                </Pressable>
              </View>
            </GlassCard>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* VIEW ALUMNI PROFILE MODAL */}
      <Modal visible={Boolean(viewingAlumni)} transparent animationType="slide" onRequestClose={() => setViewingAlumni(null)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className={`bg-[#101415] border-2 rounded-3xl w-full max-w-md p-5 ${isSuperAdmin ? 'border-[#f0c110]/40 shadow-[0_0_30px_rgba(240,193,16,0.3)]' : 'border-[#00f1a1]/40 shadow-[0_0_30px_rgba(0,241,161,0.3)]'}`}>
            <View className="flex-row justify-between items-center border-b border-white/10 pb-3 mb-4">
              <View className="flex-row items-center">
                <View className={`w-8 h-8 rounded-xl items-center justify-center mr-2.5 ${primaryBadgeClass}`}>
                  <GraduationCap size={16} color={primaryColor} />
                </View>
                <Text className="text-white font-bold text-base">{viewingAlumni?.name}</Text>
              </View>
              <Pressable onPress={() => setViewingAlumni(null)} className="w-7 h-7 rounded-full bg-white/10 items-center justify-center">
                <X size={14} color="#ffffff" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
              <View className="bg-white/5 border border-white/10 p-3.5 rounded-2xl mb-3">
                <Text className={`${primaryTextClass} text-xs font-bold mb-1`}>{viewingAlumni?.occupation}</Text>
                <Text className="text-white text-xs font-semibold">{viewingAlumni?.companyOrInstitute}</Text>
                <Text className="text-white/40 text-[10px] mt-1">Graduate Batch of {viewingAlumni?.passoutYear} ({viewingAlumni?.graduatedClass})</Text>
              </View>

              <View className="bg-black/40 border border-white/5 p-3.5 rounded-2xl mb-3" style={{ gap: 8 }}>
                <View className="flex-row items-center">
                  <Phone size={14} color={primaryColor} style={{ marginRight: 8 }} />
                  <Text className="text-white text-xs font-medium">{viewingAlumni?.phone}</Text>
                </View>
                <View className="flex-row items-center">
                  <Mail size={14} color="#38bdf8" style={{ marginRight: 8 }} />
                  <Text className="text-white text-xs font-medium">{viewingAlumni?.email}</Text>
                </View>
                <View className="flex-row items-center">
                  <MapPin size={14} color="#c084fc" style={{ marginRight: 8 }} />
                  <Text className="text-white text-xs font-medium">{viewingAlumni?.city}</Text>
                </View>
              </View>
            </ScrollView>

            <Pressable onPress={() => setViewingAlumni(null)} className={`w-full py-3 rounded-xl ${primaryBtnClass} items-center mt-2 shadow-lg`}>
              <Text className="text-[#101415] font-extrabold text-xs">Close Profile</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ADD / EDIT ALUMNI MODAL */}
      <Modal visible={showAddEditModal} transparent animationType="slide" onRequestClose={() => setShowAddEditModal(false)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className={`bg-[#101415] border-2 rounded-3xl w-full max-w-md p-5 ${isSuperAdmin ? 'border-[#f0c110]/40 shadow-[0_0_30px_rgba(240,193,16,0.3)]' : 'border-[#00f1a1]/40 shadow-[0_0_30px_rgba(0,241,161,0.3)]'}`}>
            <View className="flex-row justify-between items-center border-b border-white/10 pb-3 mb-4">
              <Text className="text-white font-bold text-base">{editingAlumni ? 'Edit Alumni Profile' : 'Register Alumni Member'}</Text>
              <Pressable onPress={() => setShowAddEditModal(false)} className="w-7 h-7 rounded-full bg-white/10 items-center justify-center">
                <X size={14} color="#ffffff" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
              <View className="mb-3">
                <Text className="text-white/70 text-xs font-bold mb-1">Full Name *</Text>
                <TextInput
                  value={formName}
                  onChangeText={setFormName}
                  placeholder="e.g. Priya Sharma"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                />
              </View>

              <View className="flex-row mb-3" style={{ gap: 10 }}>
                <View className="flex-1">
                  <Text className="text-white/70 text-xs font-bold mb-1">Passout Batch *</Text>
                  <TextInput
                    value={formYear}
                    onChangeText={setFormYear}
                    placeholder="2025"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-white/70 text-xs font-bold mb-1">Graduated Class</Text>
                  <TextInput
                    value={formClass}
                    onChangeText={setFormClass}
                    placeholder="Class 10A"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                  />
                </View>
              </View>

              <View className="mb-3">
                <Text className="text-white/70 text-xs font-bold mb-1">Occupation / Domain</Text>
                <TextInput
                  value={formOccupation}
                  onChangeText={setFormOccupation}
                  placeholder="Engineering Student, Doctor, Engineer..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                />
              </View>

              <View className="mb-3">
                <Text className="text-white/70 text-xs font-bold mb-1">Institute / Organization</Text>
                <TextInput
                  value={formInstitute}
                  onChangeText={setFormInstitute}
                  placeholder="IIT Hyderabad, Microsoft..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                />
              </View>

              <View className="flex-row mb-3" style={{ gap: 10 }}>
                <View className="flex-1">
                  <Text className="text-white/70 text-xs font-bold mb-1">Mobile Phone</Text>
                  <TextInput
                    value={formPhone}
                    onChangeText={setFormPhone}
                    placeholder="+91 98765 43210"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-white/70 text-xs font-bold mb-1">City Location</Text>
                  <TextInput
                    value={formCity}
                    onChangeText={setFormCity}
                    placeholder="Hyderabad"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                  />
                </View>
              </View>
            </ScrollView>

            <View className="flex-row border-t border-white/10 pt-3 mt-2" style={{ gap: 10 }}>
              <Pressable onPress={() => setShowAddEditModal(false)} className="flex-1 py-3 rounded-xl bg-white/10 items-center">
                <Text className="text-white font-bold text-xs">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSaveAlumni} className={`flex-1 py-3 rounded-xl ${primaryBtnClass} items-center shadow-lg`}>
                <Text className="text-[#101415] font-extrabold text-xs">
                  {editingAlumni ? 'Update Alumni' : 'Save Alumni'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* CONFIRM DELETE ALUMNI MODAL */}
      <Modal visible={Boolean(deletingAlumni)} transparent animationType="fade" onRequestClose={() => setDeletingAlumni(null)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className="bg-[#101415] border-2 border-rose-500/50 rounded-3xl w-full max-w-sm p-6 items-center shadow-[0_0_30px_rgba(255,81,106,0.3)]">
            <View className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/50 items-center justify-center mb-4">
              <Trash2 size={28} color="#ff516a" />
            </View>

            <Text className="text-white text-lg font-extrabold text-center mb-1">Delete Alumni Profile?</Text>
            <Text className="text-white/70 text-xs text-center mb-6 leading-relaxed px-2">
              Are you sure you want to remove "{deletingAlumni?.name}" from the alumni registry?
            </Text>

            <View className="flex-row w-full" style={{ gap: 10 }}>
              <Pressable onPress={() => setDeletingAlumni(null)} className="flex-1 py-3.5 rounded-xl bg-white/10 items-center">
                <Text className="text-white font-bold text-xs">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleConfirmDeleteAlumni} className="flex-1 py-3.5 rounded-xl bg-rose-500 items-center shadow-[0_0_12px_rgba(255,81,106,0.4)]">
                <Text className="text-white font-extrabold text-xs">Delete Record</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* CUSTOM TOAST MODAL */}
      <Modal visible={toastData.visible} transparent animationType="fade" onRequestClose={() => setToastData(prev => ({ ...prev, visible: false }))}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className={`bg-[#101415] border-2 rounded-3xl w-full max-w-sm p-6 items-center ${isSuperAdmin ? 'border-[#f0c110]/40 shadow-[0_0_30px_rgba(240,193,16,0.3)]' : 'border-[#00f1a1]/40 shadow-[0_0_30px_rgba(0,241,161,0.3)]'}`}>
            <View className={`w-14 h-14 rounded-full items-center justify-center mb-4 border ${toastData.type === 'warning' ? 'bg-amber-500/20 border-amber-500/40' : primaryBadgeClass}`}>
              {toastData.type === 'warning' ? (
                <AlertCircle size={28} color="#f59e0b" />
              ) : (
                <CheckCircle2 size={28} color={primaryColor} />
              )}
            </View>

            <Text className="text-white text-lg font-extrabold text-center mb-1">{toastData.title}</Text>
            <Text className="text-white/70 text-xs text-center mb-6 leading-relaxed px-2">{toastData.message}</Text>

            <Pressable
              onPress={() => setToastData(prev => ({ ...prev, visible: false }))}
              className={`w-full py-3.5 rounded-xl ${primaryBtnClass} items-center shadow-lg`}
            >
              <Text className="text-[#101415] font-extrabold text-sm">Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d2a24',
  },
  scrollContent: {
    paddingTop: 16,
  },
});

export default AlumniManagementScreen;
