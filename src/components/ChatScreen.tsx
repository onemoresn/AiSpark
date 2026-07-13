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
import { loadChatHistory, saveChatHistory, clearChatHistory } from '../lib/storage';
import { useLlama } from '../context/LlamaContext';
import { useVoice } from '../hooks/useVoice';
import { ParticleBackground } from './ParticleBackground';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { QuickActions } from './QuickActions';
import { SettingsModal } from './SettingsModal';
import { colors, spacing } from '../constants/theme';

export function ChatScreen() {
  const { isReady, modelName, isWeb } = useLlama();
  const {
    supported: voiceSupported,
    isListening,
    isSpeaking,
    transcript,
    voiceEnabled,
    setVoiceEnabled,
    availableVoices,
    voicePreference,
    selectVoice,
    selectVoiceStyle,
    previewVoice,
    toggleListening,
    speak,
    stopListening,
  } = useVoice();

  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    loadChatHistory().then((history) => {
      if (history.length > 0) setMessages(history);
    });
  }, []);

  useEffect(() => {
    if (isListening && transcript) {
      setInput(transcript);
    }
  }, [transcript, isListening]);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      stopListening();
      const userMsg = createUserMessage(trimmed);
      const updated = [...messages, userMsg];
      setMessages(updated);
      setInput('');
      setLoading(true);
      scrollToEnd();

      const assistantMsg = await generateInspireResponse(trimmed, messages);
      const final = [...updated, assistantMsg];
      setMessages(final);
      await saveChatHistory(final);
      setLoading(false);
      scrollToEnd();

      if (voiceEnabled) {
        await speak(assistantMsg.content);
      }
    },
    [messages, loading, scrollToEnd, stopListening, speak, voiceEnabled]
  );

  const handleClearChat = async () => {
    await clearChatHistory();
    setMessages([WELCOME_MESSAGE]);
  };

  const handleVoiceToggle = () => {
    toggleListening((text) => sendMessage(text));
  };

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
                    : isWeb
                      ? 'Your AI Assistant'
                      : isReady
                        ? `${modelName} · On-device`
                        : 'Your AI Assistant'}
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
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={scrollToEnd}
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

      <SettingsModal
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onClearChat={handleClearChat}
        voiceEnabled={voiceEnabled}
        onVoiceToggle={setVoiceEnabled}
        availableVoices={availableVoices}
        voicePreference={voicePreference}
        onSelectVoice={selectVoice}
        onSelectStyle={selectVoiceStyle}
        onPreviewVoice={previewVoice}
        isPreviewing={isSpeaking}
      />
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
