import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import type { Voice } from 'expo-speech';
import { useLlama } from '../context/LlamaContext';
import { MODELS, type ModelId } from '../lib/llm/modelConfig';
import {
  formatVoiceLabel,
  VOICE_STYLES,
  type VoicePreference,
} from '../lib/voice/voiceConfig';
import { colors, radii, spacing } from '../constants/theme';

const DEFAULT_VOICE_VALUE = 'default';

interface Props {
  visible: boolean;
  onClose: () => void;
  onClearChat: () => void;
  voiceEnabled?: boolean;
  onVoiceToggle?: (enabled: boolean) => void;
  availableVoices?: Voice[];
  voicePreference?: VoicePreference;
  onSelectVoice?: (voiceId: string | null) => void;
  onSelectStyle?: (pitch: number, rate: number) => void;
  onPreviewVoice?: () => void;
  isPreviewing?: boolean;
}

export function SettingsModal({
  visible,
  onClose,
  onClearChat,
  voiceEnabled = true,
  onVoiceToggle,
  availableVoices = [],
  voicePreference,
  onSelectVoice,
  onSelectStyle,
  onPreviewVoice,
  isPreviewing,
}: Props) {
  const { modelId, modelName, selectModel } = useLlama();
  const selectedVoiceId = voicePreference?.voiceId ?? null;
  const pickerValue = selectedVoiceId ?? DEFAULT_VOICE_VALUE;
  const activeStyle = VOICE_STYLES.find(
    (s) => s.pitch === voicePreference?.pitch && s.rate === voicePreference?.rate
  );

  const handleVoiceChange = (value: string) => {
    onSelectVoice?.(value === DEFAULT_VOICE_VALUE ? null : value);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Settings</Text>

            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.label}>Voice responses</Text>
                <Text style={styles.hintInline}>Spark speaks replies aloud</Text>
              </View>
              <Switch
                value={voiceEnabled}
                onValueChange={onVoiceToggle}
                trackColor={{ false: colors.border, true: colors.neonPurpleDim }}
                thumbColor={voiceEnabled ? colors.neonPurple : colors.textMuted}
              />
            </View>

            <Text style={styles.sectionTitle}>Voice style</Text>
            <Text style={styles.hint}>How Spark sounds when speaking</Text>
            <View style={styles.styleGrid}>
              {VOICE_STYLES.map((style) => {
                const selected = activeStyle?.id === style.id;
                return (
                  <TouchableOpacity
                    key={style.id}
                    style={[styles.styleChip, selected && styles.styleChipSelected]}
                    onPress={() => onSelectStyle?.(style.pitch, style.rate)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.styleLabel, selected && styles.styleLabelSelected]}>
                      {style.label}
                    </Text>
                    <Text style={styles.styleDesc}>{style.description}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.previewRow}>
              <Text style={styles.sectionTitle}>Voice</Text>
              <TouchableOpacity
                style={styles.previewButton}
                onPress={onPreviewVoice}
                disabled={isPreviewing}
                activeOpacity={0.7}
              >
                {isPreviewing ? (
                  <ActivityIndicator size="small" color={colors.neonPurple} />
                ) : (
                  <Text style={styles.previewText}>Preview</Text>
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>English voices available on your device</Text>

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={pickerValue}
                onValueChange={handleVoiceChange}
                style={styles.picker}
                dropdownIconColor={colors.neonPurple}
                itemStyle={Platform.OS === 'ios' ? styles.pickerItemIOS : undefined}
              >
                <Picker.Item
                  label="System default"
                  value={DEFAULT_VOICE_VALUE}
                  color={Platform.OS === 'android' ? colors.text : undefined}
                />
                {availableVoices.map((voice) => (
                  <Picker.Item
                    key={voice.identifier}
                    label={formatVoiceLabel(voice)}
                    value={voice.identifier}
                    color={Platform.OS === 'android' ? colors.text : undefined}
                  />
                ))}
              </Picker>
            </View>

            {availableVoices.length === 0 && (
              <Text style={styles.emptyVoices}>
                No extra English voices found. Spark will use the system default.
              </Text>
            )}

            <Text style={[styles.sectionTitle, styles.modelSection]}>On-device AI model</Text>
            <Text style={styles.hint}>Runs on your phone — free, private, unlimited.</Text>

            {(Object.keys(MODELS) as ModelId[]).map((id) => {
              const model = MODELS[id];
              const selected = modelId === id;
              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.modelRow, selected && styles.modelRowSelected]}
                  onPress={() => selectModel(id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modelRowName}>{model.name}</Text>
                  <Text style={styles.modelRowMeta}>
                    {model.sizeLabel} · {model.minRam}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <Text style={styles.currentModel}>Active model: {modelName}</Text>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                onClearChat();
                onClose();
              }}
            >
              <Text style={styles.secondaryButtonText}>Clear chat history</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  sheet: {
    backgroundColor: colors.backgroundElevated,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '88%',
    borderTopWidth: 1,
    borderColor: colors.neonPurpleDim,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.neonPurple,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowText: { flex: 1 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modelSection: {
    marginTop: spacing.lg,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    marginBottom: spacing.md,
  },
  hintInline: {
    fontSize: 13,
    color: colors.textMuted,
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  styleChip: {
    width: '47%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    padding: spacing.sm + 2,
    backgroundColor: colors.surface,
  },
  styleChipSelected: {
    borderColor: colors.neonPurple,
    backgroundColor: colors.neonPurpleDim,
  },
  styleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  styleLabelSelected: {
    color: colors.neonPurpleBright,
  },
  styleDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  previewButton: {
    borderWidth: 1,
    borderColor: colors.neonPurple,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    minWidth: 72,
    alignItems: 'center',
  },
  previewText: {
    color: colors.neonPurpleBright,
    fontWeight: '700',
    fontSize: 13,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  picker: {
    color: colors.text,
    backgroundColor: colors.surface,
    paddingHorizontal: Platform.OS === 'web' ? spacing.md : 0,
    paddingVertical: Platform.OS === 'web' ? spacing.sm : 0,
  },
  pickerItemIOS: {
    color: colors.text,
    fontSize: 16,
  },
  emptyVoices: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  modelRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  modelRowSelected: {
    borderColor: colors.neonPurple,
    backgroundColor: colors.neonPurpleDim,
  },
  modelRowName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  modelRowMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  currentModel: {
    fontSize: 13,
    color: colors.neonPurpleBright,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
  closeButton: {
    alignItems: 'center',
    padding: spacing.sm,
  },
  closeButtonText: {
    color: colors.textMuted,
    fontSize: 15,
  },
});
