import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform, Image, Modal, Keyboard } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Send,
  PlusCircle,
  Paperclip,
  Phone,
  Video
} from 'lucide-react-native';
import { useResponsive } from '../../utils/responsive';

export const MessagingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isSmallPhone, insets, headerPaddingTop } = useResponsive();
  const chatKey = route?.params?.chatKey || 'teacher_parent';
  const hasTabBar = route?.name === 'Messages';
  const [inputText, setInputText] = useState('');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  // Custom alert dialog state
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'video' | 'voice';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'video',
  });

  const showCustomAlert = (title: string, message: string, type: 'video' | 'voice') => {
    setCustomAlert({ visible: true, title, message, type });
  };

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const [messages, setMessages] = useState([
    {
      id: 'msg_1',
      senderRole: 'teacher',
      senderName: 'Ms. Priya',
      text: "Good morning, Mr. Ramesh. I wanted to update you on Aryan's progress in English class. He has shown great improvement in his creative writing!",
      time: '09:15 AM'
    },
    {
      id: 'msg_2',
      senderRole: 'parent',
      senderName: 'Ramesh',
      text: "That's wonderful to hear, Ms. Priya. We've been encouraging him to read more at home as well. Thank you for the update!",
      time: '09:18 AM'
    },
    {
      id: 'msg_3',
      senderRole: 'teacher',
      senderName: 'Ms. Priya',
      text: "You're welcome! Also, just a reminder about the science project submission this Friday. Does he need any additional resources from my end?",
      time: '09:20 AM'
    }
  ]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMsg = {
      id: `msg_${Math.random()}`,
      senderRole: 'parent',
      senderName: 'Ramesh',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    // Trigger minor simulated auto reply
    setTimeout(() => {
      const replyMsg = {
        id: `msg_${Math.random()}`,
        senderRole: 'teacher',
        senderName: 'Ms. Priya',
        text: "Understood, thank you for the details. I will review this during class prep and get back to you.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, replyMsg]);
    }, 1500);
  };

  const inputBottomMargin = isKeyboardVisible 
    ? 8 
    : (hasTabBar ? (insets.bottom + (isSmallPhone ? 72 : 80)) : Math.max(insets.bottom, 14));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
      style={styles.container}
    >
      <LinearGradient
        colors={['#0E0F26', '#121330']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Main Title Header Bar */}
      <View style={[styles.topTitleBar, { paddingTop: headerPaddingTop }]}>
        <Text className="text-white text-3xl font-bold font-headline-md">Messages</Text>
        <View className="w-9 h-9 rounded-full border border-white/20 overflow-hidden">
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMrIIqhz709VeW2BpRqLVg1j7U7Pl9daXfwRKA-2HDDgcA9W7mXSd5OKr4pnpdIm8PH7zmg2kpcIfjndCo00bTp-Axh-ozzk6NmCmBUgatneU-MIJXsqAP3jNupEJEVMnZddUdmfbtXx9Pf104uwZfzaiIwRgyJZ8fQhJHzGToBXPUzvkGYakj-ALyh-X-w-OuUIWQTLleEFRHfU4lEubjrHCKU1coc5G8ockGv2_JF5fyZw89gZymwweZDxq0LKQFld8hZ2gu1G6t' }}
            className="w-full h-full object-cover"
          />
        </View>
      </View>

      {/* Chat Navigation Header */}
      <View style={styles.header}>
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => navigation.goBack()} className="active:scale-95">
            <ChevronLeft size={24} color="#FFFFFF" />
          </Pressable>
          <View className="relative">
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwZ_Pd6kEU-CTZ_b_0P2sREtd4X1O5kPyhWb1ATzy01RBM275InEZNA_oUOAZEu3UdpaAdfZDQzlFOA8AvUipmWFGwaM-4nZQ0Zt0hM0SEmW0IjZTQsWSY96GTg2hwYfVLerDB2kJAJxoDJhFjJBLVR6T78Mg9UKWRQiQ0hBrvLsK_6WjW1eLgt_G12tuNoV74YKgkgOBCBKnCwIv4XObcPcioqpehGoR-7KYntlLrgQ8xaKKMxTd5j6-YGfCmPCHGljOy0bp7ox1N' }}
              className="w-10 h-10 rounded-full object-cover border border-white/20"
            />
            <View className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#121214]" />
          </View>
          <View>
            <Text className="text-white font-bold text-base leading-tight">Ms. Priya</Text>
            <Text className="text-green-400 text-sm font-semibold mt-0.5">Online</Text>
          </View>
        </View>

        <View className="flex-row gap-4 items-center mr-1">
          <Pressable 
            onPress={() => showCustomAlert("Video Call", "Starting video call with Ms. Priya...", 'video')}
            className="active:scale-90"
          >
            <Video size={22} color="#FFFFFF" />
          </Pressable>
          <Pressable 
            onPress={() => showCustomAlert("Voice Call", "Calling Ms. Priya...", 'voice')}
            className="active:scale-90"
          >
            <Phone size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* Message List */}
      <ScrollView 
        className="flex-1 px-5" 
        contentContainerStyle={[
          styles.messagesList,
          {
            paddingBottom: hasTabBar
              ? (Platform.OS === 'ios' ? 180 : 170)
              : (Platform.OS === 'ios' ? 90 : 80)
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center my-6">
          <View style={styles.glassCard} className="px-5 py-1.5 rounded-full border border-white/5">
            <Text className="text-white/60 text-xs font-semibold">Today</Text>
          </View>
        </View>

        {messages.map((msg) => {
          const isMe = msg.senderRole === 'parent';
          return (
            <View 
              key={msg.id}
              className={`mb-4 flex-row ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <View className="max-w-[85%]">
                <View 
                  style={isMe ? styles.outgoingBubble : styles.incomingBubble}
                  className="p-3.5"
                >
                  <Text className="text-white text-sm leading-normal font-medium">
                    {msg.text}
                  </Text>
                </View>
                <Text className={`text-white/40 text-[10px] font-medium mt-1.5 ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                  {msg.time}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Input Bar */}
      <View 
        style={[
          styles.inputBarContainer, 
          { paddingBottom: inputBottomMargin }
        ]}
      >
        <View className="flex-row items-center px-4">
          <View style={styles.inputWrapper} className="flex-1 flex-row items-center p-1 rounded-full border border-white/10">
            <Pressable className="p-2.5 active:scale-90">
              <PlusCircle size={22} color="rgba(255,255,255,0.5)" />
            </Pressable>
            <Pressable className="p-2.5 active:scale-90 mr-1">
              <Paperclip size={18} color="rgba(255,255,255,0.5)" />
            </Pressable>
            <TextInput
              placeholder="Type a message"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={inputText}
              onChangeText={setInputText}
              style={styles.textInput}
              className="flex-1 text-white text-sm px-2"
            />
          </View>
          <Pressable 
            onPress={handleSend}
            style={styles.sendButton}
            className="items-center justify-center active:scale-90"
          >
            <Send size={18} color="#FFFFFF" style={{ marginLeft: -1, marginTop: 1 }} />
          </Pressable>
        </View>
      </View>

      {/* Custom Dialog Alert Modal */}
      <Modal
        visible={customAlert.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
      >
        <View style={styles.alertOverlay}>
          <View 
            style={[styles.glassCard, styles.alertCard]}
            className="w-[85%] max-w-[340px] p-6 border border-white/10 items-center"
          >
            {/* Header Icon */}
            <View className={`w-12 h-12 rounded-2xl mb-4 items-center justify-center bg-[#5E5CE6]/15 border border-[#5E5CE6]/25`}>
              {customAlert.type === 'video' ? (
                <Video size={24} color="#818CF8" />
              ) : (
                <Phone size={24} color="#818CF8" />
              )}
            </View>

            {/* Title & Message */}
            <Text className="text-white text-lg font-bold font-headline-md text-center mb-2">
              {customAlert.title}
            </Text>
            <Text className="text-white/60 text-xs text-center leading-relaxed mb-6 px-1">
              {customAlert.message}
            </Text>

            {/* Action Button */}
            <Pressable 
              onPress={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
              style={styles.dismissBtn}
              className="w-full py-3.5 rounded-xl items-center active:scale-95 shadow-md shadow-[#5E5CE6]/30"
            >
              <Text className="text-white text-xs font-bold uppercase tracking-wider">Dismiss</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
  },
  topTitleBar: {
    paddingTop: Platform.OS === 'ios' ? 65 : 52,
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#121214',
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: '#121214',
    zIndex: 50,
  },
  messagesList: {
    paddingBottom: Platform.OS === 'ios' ? 180 : 170, // Make sure messages list can scroll above input bar
  },
  glassCard: {
    backgroundColor: '#1E1E22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  incomingBubble: {
    backgroundColor: '#1E1E22',
    borderRadius: 18,
  },
  outgoingBubble: {
    backgroundColor: '#25245E',
    borderRadius: 18,
    shadowColor: '#5E5CE6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  inputBarContainer: {
    paddingTop: 12,
    backgroundColor: 'transparent',
  },
  inputWrapper: {
    backgroundColor: '#1E1E22',
  },
  textInput: {
    height: 44,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#5E5CE6',
    shadowColor: '#5E5CE6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 15, 38, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertCard: {
    backgroundColor: '#1E1E22',
    borderRadius: 28,
    shadowColor: '#5E5CE6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: Platform.OS === 'android' ? 0 : 8,
  },
  dismissBtn: {
    backgroundColor: '#5E5CE6',
  },
});

export default MessagingScreen;
