import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Switch, TextInput, Modal, BackHandler } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Bell, Settings, Send, CheckCircle2, AlertTriangle, 
  MessageSquare, Smartphone, Volume2, Users, Calendar, DollarSign,
  ShieldCheck, History, Sliders, ChevronDown, Check
} from 'lucide-react-native';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { GlassCard } from '../../components/GlassCard';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useResponsive } from '../../utils/responsive';

export interface AlertLogItem {
  id: string;
  title: string;
  category: string;
  targetClass: string;
  recipientCount: number;
  channel: string;
  sentAt: string;
  status: 'Delivered' | 'Pending' | 'Failed';
}

const INITIAL_ALERT_LOGS: AlertLogItem[] = [
  { id: 'log_1', title: 'Term 2 Fee Payment Due Reminder', category: 'Fee Due', targetClass: 'Class 10-A', recipientCount: 42, channel: 'Push & SMS', sentAt: 'Today, 10:30 AM', status: 'Delivered' },
  { id: 'log_2', title: 'Overdue Fee Notice - 2nd Installment', category: 'Overdue', targetClass: 'Class 9-B', recipientCount: 15, channel: 'WhatsApp & SMS', sentAt: 'Yesterday, 04:15 PM', status: 'Delivered' },
  { id: 'log_3', title: 'Independence Day Event Notice', category: 'General', targetClass: 'All Classes', recipientCount: 520, channel: 'Push Notification', sentAt: '03 Aug 2026', status: 'Delivered' },
];

export const AdminAlertConfigurationScreen: React.FC<any> = ({ navigation: propNavigation }) => {
  const defaultNavigation = useNavigation<any>();
  const navigation = propNavigation || defaultNavigation;
  const { insets, isSmallPhone, isTablet, scrollBottomPadding, containerStyle } = useResponsive();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';

  // Automated Parent Fee Alert Toggles
  const [feeDueReminder, setFeeDueReminder] = useState<boolean>(true);
  const [feeOverdueNotice, setFeeOverdueNotice] = useState<boolean>(true);
  const [paymentConfirmationReceipt, setPaymentConfirmationReceipt] = useState<boolean>(true);
  const [absenceAlert, setAbsenceAlert] = useState<boolean>(true);
  const [examScheduleAlert, setExamScheduleAlert] = useState<boolean>(false);

  // Instant Alert Form States
  const [selectedTargetClass, setSelectedTargetClass] = useState<string>('All Classes');
  const [selectedTemplate, setSelectedTemplate] = useState<'Fee Due' | 'Fee Overdue' | 'Custom Notice'>('Fee Due');
  const [customMessageText, setCustomMessageText] = useState<string>(
    'Dear Parent, term 2 fee payment is due by 15th Aug 2026. Kindly clear the balance to avoid late fee charges.'
  );

  // Delivery Channel Selection
  const [sendPush, setSendPush] = useState<boolean>(true);
  const [sendSMS, setSendSMS] = useState<boolean>(true);
  const [sendWhatsApp, setSendWhatsApp] = useState<boolean>(false);

  // Class Selection Modal
  const [showClassDropdown, setShowClassDropdown] = useState<boolean>(false);
  const availableClasses = ['All Classes', 'Class 10-A', 'Class 10-B', 'Class 9-A', 'Class 9-B', 'Class 8-A', 'Class 7-B'];

  // Logs & Toast
  const [alertLogs, setAlertLogs] = useState<AlertLogItem[]>(INITIAL_ALERT_LOGS);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [toastData, setToastData] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false, title: '', message: ''
  });

  // Safe Hardware Back Button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (showClassDropdown) {
          setShowClassDropdown(false);
          return true;
        }
        if (navigation?.canGoBack && navigation.canGoBack()) {
          navigation.goBack();
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [showClassDropdown, navigation])
  );

  const showToast = (title: string, message: string) => {
    setToastData({ visible: true, title, message });
    setTimeout(() => setToastData(prev => ({ ...prev, visible: false })), 3200);
  };

  const handleSelectTemplate = (type: 'Fee Due' | 'Fee Overdue' | 'Custom Notice') => {
    setSelectedTemplate(type);
    if (type === 'Fee Due') {
      setCustomMessageText('Dear Parent, term 2 fee payment is due by 15th Aug 2026. Kindly clear the balance to avoid late fee charges.');
    } else if (type === 'Fee Overdue') {
      setCustomMessageText('URGENT NOTICE: Fee payment for your ward is overdue by 10 days. Please complete the online payment at the earliest.');
    } else {
      setCustomMessageText('');
    }
  };

  const handleSendInstantAlert = async () => {
    if (!customMessageText.trim()) {
      showToast('Missing Message', 'Please enter message content before sending.');
      return;
    }

    setIsSending(true);

    // Simulate sending delay & call backend endpoint
    setTimeout(async () => {
      const channels = [sendPush && 'Push', sendSMS && 'SMS', sendWhatsApp && 'WhatsApp'].filter(Boolean).join(' & ') || 'Push';
      const newLog: AlertLogItem = {
        id: `log_${Date.now()}`,
        title: selectedTemplate === 'Fee Due' ? 'Fee Payment Due Alert' : selectedTemplate === 'Fee Overdue' ? 'Overdue Fee Notice' : 'Custom Announcement',
        category: selectedTemplate,
        targetClass: selectedTargetClass,
        recipientCount: selectedTargetClass === 'All Classes' ? 480 : 42,
        channel: channels,
        sentAt: 'Just Now',
        status: 'Delivered',
      };

      setAlertLogs(prev => [newLog, ...prev]);
      setIsSending(false);

      try {
        await api.createResource('notifications', {
          title: newLog.title,
          message: customMessageText,
          target_class: selectedTargetClass,
          channels: channels,
        });
      } catch (err) {
        console.log('Error logging alert to backend:', err);
      }

      showToast('Alert Sent Successfully!', `Notification broadcasted to ${newLog.recipientCount} parents of ${selectedTargetClass}.`);
    }, 1000);
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
        style={StyleSheet.absoluteFillObject}
      />

      <AdminStaffHeader
        onBackPress={navigation?.canGoBack && navigation.canGoBack() ? () => navigation.goBack() : undefined}
        title="Alert & Notification Center"
        subtitle="Automated Reminders & Broadcast Console"
        icon={
          <View className={`w-10 h-10 rounded-xl items-center justify-center ${primaryBadgeClass}`}>
            <Bell size={20} color={primaryColor} />
          </View>
        }
      />

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, containerStyle, { paddingBottom: scrollBottomPadding + 24 }]} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* SECTION 1: AUTOMATED PARENT FEE ALERT SETTINGS */}
        <View className="px-5 mb-5">
          <GlassCard intensity="low" className="p-4 border-white/10 bg-[#101415]/95">
            <View className="flex-row items-center justify-between pb-3 border-b border-white/10 mb-4">
              <View className="flex-row items-center">
                <Sliders size={18} color={primaryColor} style={{ marginRight: 8 }} />
                <Text className="text-white font-extrabold text-base">Automated Parent Alert Rules</Text>
              </View>
              <View className={`px-2.5 py-1 rounded-xl ${primaryBadgeClass}`}>
                <Text className={`${primaryTextClass} text-[10px] font-extrabold uppercase`}>Auto-Sync Active</Text>
              </View>
            </View>

            {/* Rule 1: Fee Payment Due Reminder */}
            <View className="flex-row items-center justify-between py-3 border-b border-white/5">
              <View className="flex-1 mr-3">
                <Text className="text-white font-bold text-xs">Fee Payment Due Reminder</Text>
                <Text className="text-white/50 text-[10px] mt-0.5">Send automated SMS & Push notification 3 days prior to fee due date</Text>
              </View>
              <Switch
                value={feeDueReminder}
                onValueChange={setFeeDueReminder}
                trackColor={{ false: '#26292b', true: primaryGold }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Rule 2: Overdue Fee Warning Notice */}
            <View className="flex-row items-center justify-between py-3 border-b border-white/5">
              <View className="flex-1 mr-3">
                <Text className="text-white font-bold text-xs">Overdue Fee Warning Notice</Text>
                <Text className="text-white/50 text-[10px] mt-0.5">Send weekly automated warning alerts to parents for unpaid installments</Text>
              </View>
              <Switch
                value={feeOverdueNotice}
                onValueChange={setFeeOverdueNotice}
                trackColor={{ false: '#26292b', true: primaryGold }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Rule 3: Payment Receipt Confirmation */}
            <View className="flex-row items-center justify-between py-3 border-b border-white/5">
              <View className="flex-1 mr-3">
                <Text className="text-white font-bold text-xs">Instant Payment Receipt SMS</Text>
                <Text className="text-white/50 text-[10px] mt-0.5">Send instant payment confirmation receipt upon offline/online fee collection</Text>
              </View>
              <Switch
                value={paymentConfirmationReceipt}
                onValueChange={setPaymentConfirmationReceipt}
                trackColor={{ false: '#26292b', true: primaryGold }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Rule 4: Absence Alert */}
            <View className="flex-row items-center justify-between pt-3">
              <View className="flex-1 mr-3">
                <Text className="text-white font-bold text-xs">Student Absence Parent Alert</Text>
                <Text className="text-white/50 text-[10px] mt-0.5">Notify parents automatically at 10:00 AM if student is marked absent</Text>
              </View>
              <Switch
                value={absenceAlert}
                onValueChange={setAbsenceAlert}
                trackColor={{ false: '#26292b', true: primaryGold }}
                thumbColor="#ffffff"
              />
            </View>
          </GlassCard>
        </View>

        {/* SECTION 2: INSTANT PARENT ALERT BROADCAST DISPATCHER */}
        <View className="px-5 mb-5">
          <GlassCard intensity="low" className="p-4 border-white/10 bg-[#101415]/95">
            <View className="flex-row items-center justify-between pb-3 border-b border-white/10 mb-4">
              <View className="flex-row items-center">
                <Send size={18} color={primaryColor} style={{ marginRight: 8 }} />
                <Text className="text-white font-extrabold text-base">Send Instant Alert to Parents</Text>
              </View>
            </View>

            {/* Target Class Dropdown Selector */}
            <View className="mb-4">
              <Text className="text-white/70 text-xs font-bold mb-1.5">Target Recipient Class *</Text>
              <Pressable
                onPress={() => setShowClassDropdown(true)}
                className="bg-black/60 border border-white/15 rounded-2xl px-3.5 py-3 flex-row justify-between items-center"
              >
                <View className="flex-row items-center">
                  <Users size={16} color={primaryColor} style={{ marginRight: 8 }} />
                  <Text className="text-white font-bold text-xs">{selectedTargetClass}</Text>
                </View>
                <ChevronDown size={16} color="rgba(255,255,255,0.6)" />
              </Pressable>
            </View>

            {/* Template Selector Pills */}
            <View className="mb-4">
              <Text className="text-white/70 text-xs font-bold mb-2">Alert Category / Quick Template *</Text>
              <View className="flex-row" style={{ gap: 8 }}>
                {(['Fee Due', 'Fee Overdue', 'Custom Notice'] as const).map(t => {
                  const isSel = selectedTemplate === t;
                  return (
                    <Pressable
                      key={t}
                      onPress={() => handleSelectTemplate(t)}
                      className={`px-3 py-2 rounded-xl border flex-1 items-center ${
                        isSel ? (isSuperAdmin ? 'bg-[#f0c110] border-[#f0c110]' : 'bg-[#00f1a1] border-[#00f1a1]') : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <Text className={`text-xs font-extrabold ${isSel ? 'text-[#101415]' : 'text-white/70'}`}>{t}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Message Body Input */}
            <View className="mb-4">
              <Text className="text-white/70 text-xs font-bold mb-1.5">Alert Message Content *</Text>
              <TextInput
                value={customMessageText}
                onChangeText={setCustomMessageText}
                multiline
                numberOfLines={4}
                placeholder="Type alert message to parents..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                className="bg-black/60 border border-white/15 rounded-2xl text-white p-3 text-xs leading-relaxed"
                style={{ textAlignVertical: 'top' }}
              />
            </View>

            {/* Delivery Channels */}
            <View className="mb-5">
              <Text className="text-white/70 text-xs font-bold mb-2">Select Delivery Channels *</Text>
              <View className="flex-row justify-between" style={{ gap: 8 }}>
                <Pressable
                  onPress={() => setSendPush(!sendPush)}
                  className={`flex-1 p-2.5 rounded-xl border flex-row items-center justify-center ${
                    sendPush ? (isSuperAdmin ? 'bg-[#f0c110]/20 border-[#f0c110]' : 'bg-[#00f1a1]/20 border-[#00f1a1]') : 'bg-white/5 border-white/10'
                  }`}
                >
                  <Smartphone size={14} color={sendPush ? primaryColor : 'rgba(255,255,255,0.4)'} style={{ marginRight: 6 }} />
                  <Text className={`text-xs font-bold ${sendPush ? primaryTextClass : 'text-white/60'}`}>Push</Text>
                </Pressable>

                <Pressable
                  onPress={() => setSendSMS(!sendSMS)}
                  className={`flex-1 p-2.5 rounded-xl border flex-row items-center justify-center ${
                    sendSMS ? (isSuperAdmin ? 'bg-[#f0c110]/20 border-[#f0c110]' : 'bg-[#00f1a1]/20 border-[#00f1a1]') : 'bg-white/5 border-white/10'
                  }`}
                >
                  <MessageSquare size={14} color={sendSMS ? primaryColor : 'rgba(255,255,255,0.4)'} style={{ marginRight: 6 }} />
                  <Text className={`text-xs font-bold ${sendSMS ? primaryTextClass : 'text-white/60'}`}>SMS</Text>
                </Pressable>

                <Pressable
                  onPress={() => setSendWhatsApp(!sendWhatsApp)}
                  className={`flex-1 p-2.5 rounded-xl border flex-row items-center justify-center ${
                    sendWhatsApp ? (isSuperAdmin ? 'bg-[#f0c110]/20 border-[#f0c110]' : 'bg-[#00f1a1]/20 border-[#00f1a1]') : 'bg-white/5 border-white/10'
                  }`}
                >
                  <MessageSquare size={14} color={sendWhatsApp ? primaryColor : 'rgba(255,255,255,0.4)'} style={{ marginRight: 6 }} />
                  <Text className={`text-xs font-bold ${sendWhatsApp ? primaryTextClass : 'text-white/60'}`}>WhatsApp</Text>
                </Pressable>
              </View>
            </View>

            {/* Broadcast Action Button */}
            <Pressable
              onPress={handleSendInstantAlert}
              disabled={isSending}
              className={`py-3.5 rounded-2xl items-center flex-row justify-center shadow-lg ${
                isSending ? 'bg-white/20' : primaryBtnClass
              }`}
            >
              <Send size={16} color="#101415" style={{ marginRight: 6 }} />
              <Text className="text-[#101415] font-extrabold text-xs uppercase tracking-wider">
                {isSending ? 'Broadcasting Alert...' : 'Dispatch Alert to Parents'}
              </Text>
            </Pressable>
          </GlassCard>
        </View>

        {/* SECTION 3: RECENT SENT ALERTS LOGS */}
        <View className="px-5 mb-8">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white/60 text-xs font-bold uppercase tracking-wider">Alert Broadcast History ({alertLogs.length})</Text>
            <History size={14} color={primaryColor} />
          </View>

          {alertLogs.map(log => (
            <GlassCard key={log.id} intensity="low" className="mb-3 p-3.5 border-white/10 bg-[#101415]/90">
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 mr-2">
                  <Text className="text-white font-extrabold text-sm">{log.title}</Text>
                  <Text className={`${primaryTextClass} text-[10px] font-bold mt-0.5`}>{log.targetClass} • {log.recipientCount} Parents</Text>
                </View>
                <View className={`px-2 py-0.5 rounded-lg ${primaryBadgeClass}`}>
                  <Text className={`${primaryTextClass} text-[9px] font-black`}>{log.status}</Text>
                </View>
              </View>

              <View className="flex-row justify-between items-center pt-2 border-t border-white/5">
                <Text className="text-white/40 text-[10px]">Via {log.channel}</Text>
                <Text className="text-white/50 text-[10px] font-semibold">{log.sentAt}</Text>
              </View>
            </GlassCard>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* TARGET CLASS SELECTION MODAL */}
      {showClassDropdown && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setShowClassDropdown(false)}>
          <View className="flex-1 bg-black/85 justify-center items-center p-4">
            <View className={`w-full max-w-xs p-4 border rounded-3xl ${isSuperAdmin ? 'border-[#f0c110]/40 shadow-[0_0_30px_rgba(240,193,16,0.3)]' : 'border-[#00f1a1]/40 shadow-[0_0_30px_rgba(0,241,161,0.3)]'}`} style={{ backgroundColor: '#101415' }}>
              <Text className="text-white font-extrabold text-sm mb-3 text-center">Select Recipient Class</Text>
              
              {availableClasses.map(cls => {
                const isSelected = selectedTargetClass === cls;
                return (
                  <Pressable
                    key={cls}
                    onPress={() => {
                      setSelectedTargetClass(cls);
                      setShowClassDropdown(false);
                    }}
                    className={`py-3 px-3 rounded-xl mb-1.5 flex-row justify-between items-center ${
                      isSelected ? (isSuperAdmin ? 'bg-[#f0c110]/20 border border-[#f0c110]' : 'bg-[#00f1a1]/20 border border-[#00f1a1]') : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <Text className={`text-xs font-bold ${isSelected ? primaryTextClass : 'text-white'}`}>{cls}</Text>
                    {isSelected && <Check size={14} color={primaryColor} />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Modal>
      )}

      {/* TOAST NOTIFICATION */}
      {toastData.visible && (
        <View className={`absolute bottom-6 left-5 right-5 ${primaryBtnClass} p-3.5 rounded-2xl flex-row items-center justify-between shadow-lg`}>
          <View className="flex-1 mr-2">
            <Text className="text-[#101415] font-extrabold text-xs">{toastData.title}</Text>
            <Text className="text-[#101415]/80 text-[10px]">{toastData.message}</Text>
          </View>
          <CheckCircle2 size={20} color="#101415" />
        </View>
      )}

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

export default AdminAlertConfigurationScreen;
