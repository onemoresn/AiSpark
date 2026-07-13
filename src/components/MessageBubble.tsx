import React, { memo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import type { ChatMessage } from '../lib/inspire/types';
import { colors, radii, spacing } from '../constants/theme';

interface Props {
  message: ChatMessage;
}

function MessageBubbleComponent({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      {!isUser && (
        <Image
          source={require('../../assets/spark-robot-mascot.png')}
          style={styles.avatar}
          resizeMode="cover"
        />
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.assistantText]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

export const MessageBubble = memo(MessageBubbleComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowAssistant: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: spacing.sm,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: colors.neonPurpleDim,
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderRadius: radii.md,
  },
  userBubble: {
    backgroundColor: colors.userBubble,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: colors.assistantBubble,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    fontSize: 16,
    lineHeight: 23,
  },
  userText: {
    color: colors.black,
    fontWeight: '500',
  },
  assistantText: {
    color: colors.text,
  },
});
