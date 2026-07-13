import React, { useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Text,
} from 'react-native';
import { colors, radii, spacing } from '../constants/theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  disabled?: boolean;
  loading?: boolean;
  isListening?: boolean;
  voiceSupported?: boolean;
  onToggleVoice?: () => void;
}

export function ChatInput({
  value,
  onChangeText,
  onSend,
  disabled,
  loading,
  isListening,
  voiceSupported,
  onToggleVoice,
}: Props) {
  const canSend = value.trim().length > 0 && !disabled && !loading;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isListening) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.25, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
    pulse.setValue(1);
  }, [isListening, pulse]);

  return (
    <View style={styles.container}>
      {voiceSupported && (
        <TouchableOpacity
          style={[styles.micButton, isListening && styles.micActive]}
          onPress={onToggleVoice}
          disabled={disabled || loading}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ scale: isListening ? pulse : 1 }] }}>
            <Text style={styles.micIcon}>{isListening ? '◉' : '🎤'}</Text>
          </Animated.View>
        </TouchableOpacity>
      )}

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={isListening ? 'Listening...' : "Share what's on your mind..."}
        placeholderTextColor={colors.textMuted}
        multiline
        maxLength={500}
        editable={!disabled && !loading && !isListening}
        onSubmitEditing={canSend ? onSend : undefined}
        blurOnSubmit={false}
      />

      <TouchableOpacity
        style={[styles.sendButton, !canSend && styles.sendDisabled]}
        onPress={onSend}
        disabled={!canSend}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.black} />
        ) : (
          <Text style={styles.sendArrow}>→</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.inputBg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micActive: {
    borderColor: colors.neonPurple,
    backgroundColor: colors.neonPurpleDim,
    shadowColor: colors.neonPurple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  micIcon: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.neonPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    opacity: 0.35,
  },
  sendArrow: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
  },
});
