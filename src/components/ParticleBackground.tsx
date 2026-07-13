import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors } from '../constants/theme';

const { width, height } = Dimensions.get('window');
const PARTICLE_COUNT = 14;

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  size: number;
}

function createParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    x: new Animated.Value(Math.random() * width),
    y: new Animated.Value(Math.random() * height),
    opacity: new Animated.Value(Math.random() * 0.5 + 0.2),
    scale: new Animated.Value(Math.random() * 0.6 + 0.4),
    size: Math.random() * 4 + 2,
  }));
}

export function ParticleBackground() {
  const particles = useRef(createParticles()).current;

  useEffect(() => {
    const animations = particles.map((p) => {
      const driftY = Animated.loop(
        Animated.sequence([
          Animated.timing(p.y, {
            toValue: Math.random() * height,
            duration: 4000 + Math.random() * 6000,
            useNativeDriver: true,
          }),
          Animated.timing(p.y, {
            toValue: Math.random() * height,
            duration: 4000 + Math.random() * 6000,
            useNativeDriver: true,
          }),
        ])
      );

      const driftX = Animated.loop(
        Animated.sequence([
          Animated.timing(p.x, {
            toValue: Math.random() * width,
            duration: 5000 + Math.random() * 5000,
            useNativeDriver: true,
          }),
          Animated.timing(p.x, {
            toValue: Math.random() * width,
            duration: 5000 + Math.random() * 5000,
            useNativeDriver: true,
          }),
        ])
      );

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(p.opacity, {
            toValue: 0.8,
            duration: 1500 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(p.opacity, {
            toValue: 0.15,
            duration: 1500 + Math.random() * 1000,
            useNativeDriver: true,
          }),
        ])
      );

      return Animated.parallel([driftY, driftX, pulse]);
    });

    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [particles]);

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              opacity: p.opacity,
              transform: [{ translateX: p.x }, { translateY: p.y }, { scale: p.scale }],
            },
          ]}
        />
      ))}
      <View style={styles.gridOverlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    backgroundColor: colors.neonPurple,
    shadowColor: colors.neonPurple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: width * 0.55,
    height: height * 0.35,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: colors.neonPurpleDim,
    opacity: 0.4,
  },
});
