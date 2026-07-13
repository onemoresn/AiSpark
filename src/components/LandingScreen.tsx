import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ParticleBackground } from './ParticleBackground';
import { colors, radii, spacing } from '../constants/theme';

const { width } = Dimensions.get('window');

interface Props {
  onGetStarted: () => void;
}

export function LandingScreen({ onGetStarted }: Props) {
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ParticleBackground />

      <View style={styles.glow} />

      <SafeAreaView style={styles.safe}>
        <View style={styles.hero}>
          <Image
            source={require('../../assets/spark-robot-mascot.png')}
            style={styles.robot}
            resizeMode="contain"
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.brand}>Spark</Text>
          <Text style={styles.subtitle}>Your AI Assistant</Text>
          <Text style={styles.tagline}>Warm support to lift your spirit every day.</Text>

          <TouchableOpacity style={styles.cta} onPress={onGetStarted} activeOpacity={0.85}>
            <Text style={styles.ctaText}>Get Started</Text>
            <View style={styles.ctaArrow}>
              <Text style={styles.arrowIcon}>→</Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  safe: {
    flex: 1,
    justifyContent: 'space-between',
  },
  glow: {
    position: 'absolute',
    top: '12%',
    alignSelf: 'center',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: colors.neonPurpleGlow,
    opacity: 0.5,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xl,
  },
  robot: {
    width: width * 0.75,
    height: width * 0.85,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  brand: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.neonPurple,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.xs,
  },
  tagline: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neonPurple,
    borderRadius: radii.full,
    paddingVertical: spacing.md,
    paddingLeft: spacing.xl,
    paddingRight: spacing.sm,
    shadowColor: colors.neonPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
  },
  ctaArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowIcon: {
    fontSize: 20,
    color: colors.neonPurple,
    fontWeight: '700',
  },
});
