import React, { useEffect, useRef, useState } from 'react';
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
  TextInput,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import {
  GEMINI_MODEL_IDS,
  GEMINI_MODELS,
  DEFAULT_GEMINI_MODEL,
  type GeminiModelId,
} from '../lib/llm/geminiConfig';
import {
  formatVoiceLabel,
  VOICE_STYLES,
  DEFAULT_VOICE_PREFERENCE,
  type SparkVoice,
  type VoicePreference,
} from '../lib/voice/voiceConfig';
import type { AppSettings } from '../lib/storage';
import { validateGeminiApiKey, type ApiKeyValidation } from '../lib/llm/geminiApi';
import { colors, radii, spacing } from '../constants/theme';


interface Props {
  visible: boolean;
  onClose: () => void;
  onClearChat: () => void;
  savedSettings: AppSettings;
  onSaveConfiguration: (settings: AppSettings) => Promise<void>;
  availableVoices?: SparkVoice[];
  onPreviewVoice?: (preference: VoicePreference) => void;
  isPreviewing?: boolean;
}

export function SettingsModal({
  visible,
  onClose,
  onClearChat,
  savedSettings,
  onSaveConfiguration,
  availableVoices = [],
  onPreviewVoice,
  isPreviewing,
}: Props) {
  const [draftApiKey, setDraftApiKey] = useState('');
  const [draftModelId, setDraftModelId] = useState<GeminiModelId>(DEFAULT_GEMINI_MODEL);
  const [draftVoiceEnabled, setDraftVoiceEnabled] = useState(true);
  const [draftVoiceId, setDraftVoiceId] = useState(DEFAULT_VOICE_PREFERENCE.voiceId);
  const [draftStyleId, setDraftStyleId] = useState(DEFAULT_VOICE_PREFERENCE.styleId);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyValidation | null>(null);
  const [testingApiKey, setTestingApiKey] = useState(false);
  const lastTestedKeyRef = useRef('');

  useEffect(() => {
    if (!visible) return;
    setDraftApiKey(savedSettings.apiKey);
    setDraftModelId(savedSettings.modelId);
    setDraftVoiceEnabled(savedSettings.voiceEnabled);
    setDraftVoiceId(savedSettings.voicePreference.voiceId);
    setDraftStyleId(savedSettings.voicePreference.styleId);
    setSaveMessage(null);
    setApiKeyStatus(null);
    lastTestedKeyRef.current = savedSettings.apiKey.trim();
  }, [visible, savedSettings]);

  useEffect(() => {
    if (!visible) return;

    const trimmed = draftApiKey.trim();
    if (trimmed.length < 20) {
      setApiKeyStatus(
        trimmed.length === 0
          ? null
          : {
              chatOk: false,
              voiceOk: false,
              status: 'empty',
              message: 'Keep typing — Gemini keys are longer than this.',
            }
      );
      setTestingApiKey(false);
      return;
    }

    if (trimmed === lastTestedKeyRef.current && apiKeyStatus?.status === 'ok') {
      return;
    }

    setTestingApiKey(true);
    setApiKeyStatus({
      chatOk: false,
      voiceOk: false,
      status: 'testing',
      message: 'Testing your API key…',
    });

    const timer = setTimeout(() => {
      validateGeminiApiKey(trimmed, draftModelId)
        .then((result) => {
          lastTestedKeyRef.current = trimmed;
          setApiKeyStatus(result);
        })
        .catch(() => {
          setApiKeyStatus({
            chatOk: false,
            voiceOk: false,
            status: 'fail',
            message: 'Could not test the API key. Check your connection.',
          });
        })
        .finally(() => setTestingApiKey(false));
    }, 700);

    return () => clearTimeout(timer);
  }, [draftApiKey, draftModelId, visible]);

  const activeStyle = VOICE_STYLES.find((s) => s.id === draftStyleId);
  const pickerValue = draftVoiceId;

  const draftVoicePreference: VoicePreference = {
    voiceId: draftVoiceId,
    styleId: draftStyleId,
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      await onSaveConfiguration({
        apiKey: draftApiKey.trim(),
        modelId: draftModelId,
        voiceEnabled: draftVoiceEnabled,
        voicePreference: draftVoicePreference,
      });
      setSaveMessage('Configuration saved.');
    } catch {
      setSaveMessage('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Settings</Text>

            <Text style={styles.sectionTitle}>Gemini API key</Text>
            <Text style={styles.hint}>
              Get a free key at Google AI Studio. Stored locally on your device.
            </Text>
            <TextInput
              style={styles.apiInput}
              value={draftApiKey}
              onChangeText={setDraftApiKey}
              placeholder="Paste your Gemini API key"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />

            {(testingApiKey || apiKeyStatus) && (
              <View style={styles.apiStatusRow}>
                {testingApiKey && (
                  <ActivityIndicator size="small" color={colors.neonPurple} />
                )}
                <Text
                  style={[
                    styles.apiStatusText,
                    apiKeyStatus?.status === 'ok' && styles.apiStatusOk,
                    apiKeyStatus?.status === 'partial' && styles.apiStatusPartial,
                    (apiKeyStatus?.status === 'fail' || apiKeyStatus?.status === 'empty') &&
                      styles.apiStatusFail,
                  ]}
                >
                  {apiKeyStatus?.message ?? 'Testing your API key…'}
                </Text>
              </View>
            )}

            {apiKeyStatus && apiKeyStatus.status !== 'empty' && apiKeyStatus.status !== 'testing' && (
              <View style={styles.apiChecklist}>
                <Text style={[styles.apiCheckItem, apiKeyStatus.chatOk && styles.apiCheckOk]}>
                  {apiKeyStatus.chatOk ? '✓' : '✗'} Chat API
                </Text>
                <Text style={[styles.apiCheckItem, apiKeyStatus.voiceOk && styles.apiCheckOk]}>
                  {apiKeyStatus.voiceOk ? '✓' : '✗'} Natural voice
                </Text>
              </View>
            )}

            <Text style={[styles.sectionTitle, styles.modelSection]}>AI model</Text>
            <Text style={styles.hint}>Powered by Google Gemini — fast cloud responses.</Text>

            {GEMINI_MODEL_IDS.map((id) => {
              const model = GEMINI_MODELS[id];
              const selected = draftModelId === id;
              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.modelRow, selected && styles.modelRowSelected]}
                  onPress={() => setDraftModelId(id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modelRowName}>{model.name}</Text>
                  <Text style={styles.modelRowMeta}>{model.description}</Text>
                </TouchableOpacity>
              );
            })}

            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.label}>Voice responses</Text>
                <Text style={styles.hintInline}>Spark speaks replies aloud</Text>
              </View>
              <Switch
                value={draftVoiceEnabled}
                onValueChange={setDraftVoiceEnabled}
                trackColor={{ false: colors.border, true: colors.neonPurpleDim }}
                thumbColor={draftVoiceEnabled ? colors.neonPurple : colors.textMuted}
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
                    onPress={() => {
                      setDraftStyleId(style.id);
                      setDraftVoiceId(style.voiceId);
                    }}
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
                onPress={() => onPreviewVoice?.(draftVoicePreference)}
                disabled={isPreviewing || testingApiKey || apiKeyStatus?.voiceOk === false}
                activeOpacity={0.7}
              >
                {isPreviewing ? (
                  <ActivityIndicator size="small" color={colors.neonPurple} />
                ) : (
                  <Text style={styles.previewText}>Preview</Text>
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>
              Natural Gemini voices — each voice sounds distinct. Requires a working API key.
            </Text>

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={pickerValue}
                onValueChange={(value) => setDraftVoiceId(value)}
                style={styles.picker}
                dropdownIconColor={colors.neonPurple}
                itemStyle={Platform.OS === 'ios' ? styles.pickerItemIOS : undefined}
              >
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
                Voice options could not be loaded. Spark will use the default voice.
              </Text>
            )}

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.black} />
              ) : (
                <Text style={styles.saveButtonText}>Save configuration</Text>
              )}
            </TouchableOpacity>

            {saveMessage && <Text style={styles.saveMessage}>{saveMessage}</Text>}

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
  apiInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  apiStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  apiStatusText: {
    flex: 1,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  apiStatusOk: {
    color: colors.neonPurpleBright,
  },
  apiStatusPartial: {
    color: '#E8B84A',
  },
  apiStatusFail: {
    color: '#FF6B8A',
  },
  apiChecklist: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  apiCheckItem: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  apiCheckOk: {
    color: colors.neonPurpleBright,
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
  saveButton: {
    backgroundColor: colors.neonPurple,
    borderRadius: radii.sm,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: colors.black,
    fontWeight: '700',
    fontSize: 16,
  },
  saveMessage: {
    fontSize: 13,
    color: colors.neonPurpleBright,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontWeight: '600',
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
