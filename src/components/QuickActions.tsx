import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../constants/theme';

const ACTIONS = [
  { label: "Today's weather", message: "What does today look like?" },
  { label: 'News headlines', message: "What's happening in the news today?" },
  { label: 'Inspire me', message: 'I could use some encouragement right now.' },
];

interface Props {
  onSelect: (message: string) => void;
  disabled?: boolean;
}

export function QuickActions({ onSelect, disabled }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {ACTIONS.map((action) => (
        <TouchableOpacity
          key={action.label}
          style={[styles.chip, disabled && styles.chipDisabled]}
          onPress={() => onSelect(action.message)}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text style={styles.chipText}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    alignItems: 'center',
  },
  chip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.neonPurpleDim,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  chipDisabled: {
    opacity: 0.5,
  },
  chipText: {
    color: colors.neonPurpleBright,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
});
