import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { ChatMessage } from '../lib/inspire/types';
import {
  createUserMessage,
  generateInspireResponse,
  WELCOME_MESSAGE,
} from '../lib/chat/inspireChat';
import { loadChatHistory, saveChatHistory, clearChatHistory, getAppSettings, type AppSettings } from '../lib/storage';
import { MAX_CHAT_MESSAGES } from '../constants/chat';
import { useGemini } from '../context/GeminiContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useVoice } from '../hooks/useVoice';
import * as VoiceService from '../lib/voice/voiceService';
import { ParticleBackground } from './ParticleBackground';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { QuickActions } from './QuickActions';
import { SettingsModal } from './SettingsModal';
import { colors, spacing } from '../constants/theme';

function trimMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.slice(-MAX_CHAT_MESSAGES);
}

export function ChatScreen() {
  const { hasApiKey, modelName, providerName, saveConfiguration } = useGemini();
  const { isOnline } = useNetworkStatus();
  const {
    supported: voiceSupported,
    isListening,
    isSpeaking,
    isPreviewing,
    transcript,
    voiceEnabled,
    availableVoices,
    voicePreference,
    applyConfiguration,
    previewVoice,
    toggleListening,
    speak,
    stopListening,
  } = useVoice();

  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savedSettings, setSavedSettings] = useState<AppSettings | null>(null);
  const listRef = useRef<FlatList>(null);
  const loadingRef = useRef(false);
  const shouldScrollRef = useRef(true);

  useEffect(() => {
    let active = true;
    loadChatHistory().then((history) => {
      if (!active || history.length === 0) return;
      setMessages((current) => {
        const isFresh = current.length === 1 && current[0]?.id === 'welcome';
        return isFresh ? history : current;
      });
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (isListening && transcript) {
      setInput(transcript);
    }
  }, [transcript, isListening]);

  useEffect(() => {
    if (settingsOpen) {
      getAppSettings().then(setSavedSettings);
    }
  }, [settingsOpen]);

  const handleSaveConfiguration = async (settings: AppSettings) => {
    await saveConfiguration(settings);
    await applyConfiguration(settings.voiceEnabled, settings.voicePreference);
    setSavedSettings(settings);
  };

  const scrollToEnd = useCallback(() => {
    if (!shouldScrollRef.current) return;
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loadingRef.current) return;

      stopListening();
      VoiceService.primeAudioPlayback();
      shouldScrollRef.current = true;
      loadingRef.current = true;
      setLoading(true);
      setInput('');

      let historyForResponse: ChatMessage[] = [];
      let userMsg!: ChatMessage;

      setMessages((prev) => {
        historyForResponse = prev;
        userMsg = createUserMessage(trimmed);
        scrollToEnd();
        return trimMessages([...prev, userMsg]);
      });

      let assistantMsg: ChatMessage | null = null;

      try {
        assistantMsg = await generateInspireResponse(trimmed, historyForResponse);
        const final = trimMessages([...historyForResponse, userMsg, assistantMsg]);

        setMessages(final);
        await saveChatHistory(final);
        scrollToEnd();
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }

      if (voiceEnabled && assistantMsg) {
        void speak(assistantMsg.content, voicePreference);
      }
    },
    [scrollToEnd, stopListening, speak, voiceEnabled, voicePreference]
  );

  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;

  const handleClearChat = async () => {
    await clearChatHistory();
    setMessages([WELCOME_MESSAGE]);
  };

  const handleVoiceToggle = () => {
    toggleListening((text) => sendMessageRef.current(text));
  };

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => <MessageBubble message={item} />,
    []
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ParticleBackground />

      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require('../../assets/spark-robot-mascot.png')}
              style={styles.headerAvatar}
            />
            <View>
              <Text style={styles.headerTitle}>Spark</Text>
              <Text style={styles.headerSubtitle}>
                {isSpeaking
                  ? 'Speaking...'
                  : isListening
                    ? 'Listening...'
                    : !isOnline
                      ? 'Offline · cached quotes & local replies'
                      : hasApiKey
                        ? `${modelName} · Web + ${providerName}`
                        : 'Web answers · Add API key for chat AI'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setSettingsOpen(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.settingsIcon}>⚙</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.messageList}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={7}
          showsVerticalScrollIndicator={false}
        />

        {loading && (
          <View style={styles.typing}>
            <ActivityIndicator size="small" color={colors.neonPurple} />
            <Text style={styles.typingText}>Spark is thinking...</Text>
          </View>
        )}

        <QuickActions onSelect={sendMessage} disabled={loading || isListening} />
        <ChatInput
          value={input}
          onChangeText={setInput}
          onSend={() => sendMessage(input)}
          disabled={loading}
          loading={loading}
          isListening={isListening}
          voiceSupported={voiceSupported}
          onToggleVoice={handleVoiceToggle}
        />
      </KeyboardAvoidingView>

      {savedSettings && (
        <SettingsModal
          visible={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onClearChat={handleClearChat}
          savedSettings={savedSettings}
          onSaveConfiguration={handleSaveConfiguration}
          availableVoices={availableVoices}
          onPreviewVoice={previewVoice}
          isPreviewing={isPreviewing}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerSafe: {
    backgroundColor: colors.backgroundElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.neonPurpleDim,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.neonPurple,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  body: {
    flex: 1,
  },
  messageList: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  typing: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  typingText: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
