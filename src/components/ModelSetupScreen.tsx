import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLlama } from '../context/LlamaContext';
import { MODELS, type ModelId } from '../lib/llm/modelConfig';
import { ParticleBackground } from './ParticleBackground';
import { colors, radii, spacing } from '../constants/theme';

export function ModelSetupScreen() {
  const { status, progress, error, modelId, downloadAndInit, selectModel, retry } = useLlama();

  const isDownloading = status === 'downloading';
  const isLoading = status === 'loading' || status === 'checking';
  const percent = Math.round(progress * 100);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ParticleBackground />

      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <Image
            source={require('../../assets/spark-robot-mascot.png')}
            style={styles.robot}
            resizeMode="contain"
          />

          <Text style={styles.brand}>Spark</Text>
          <Text style={styles.subtitle}>Download your on-device AI brain</Text>

          <View style={styles.card}>
            {(Object.keys(MODELS) as ModelId[]).map((id) => {
              const model = MODELS[id];
              const selected = modelId === id;
              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.modelOption, selected && styles.modelSelected]}
                  onPress={() => selectModel(id)}
                  disabled={isDownloading || isLoading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modelName}>{model.name}</Text>
                  <Text style={styles.modelDesc}>{model.description}</Text>
                  <Text style={styles.modelSize}>{model.sizeLabel} · {model.minRam}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {isDownloading && (
            <View style={styles.progressBox}>
              <Text style={styles.progressLabel}>Downloading {MODELS[modelId].name}…</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${percent}%` }]} />
              </View>
              <Text style={styles.progressPct}>{percent}%</Text>
            </View>
          )}

          {isLoading && (
            <View style={styles.progressBox}>
              <ActivityIndicator size="large" color={colors.neonPurple} />
              <Text style={styles.progressLabel}>
                {status === 'checking' ? 'Checking for model…' : 'Warming up Spark…'}
              </Text>
            </View>
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          {(status === 'needs_download' || status === 'error') && (
            <TouchableOpacity
              style={styles.button}
              onPress={status === 'error' ? retry : downloadAndInit}
            >
              <Text style={styles.buttonText}>
                {status === 'error' ? 'Try Again' : `Download ${MODELS[modelId].name}`}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  safe: { flex: 1 },
  content: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  robot: {
    width: 200,
    height: 220,
    marginTop: spacing.lg,
  },
  brand: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.neonPurple,
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  card: { width: '100%', marginBottom: spacing.md },
  modelOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  modelSelected: {
    borderColor: colors.neonPurple,
    backgroundColor: colors.neonPurpleDim,
  },
  modelName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  modelDesc: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  modelSize: {
    fontSize: 12,
    color: colors.neonPurple,
    marginTop: 4,
    fontWeight: '600',
  },
  progressBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.neonPurple,
    borderRadius: 4,
  },
  progressPct: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  error: {
    color: '#FF6B8A',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.neonPurple,
    borderRadius: radii.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  buttonText: {
    color: colors.black,
    fontSize: 17,
    fontWeight: '700',
  },
});
