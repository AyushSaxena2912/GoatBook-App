import React from 'react';
import { StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { COLORS, SPACING } from '../theme';

import { useTheme } from '../theme/ThemeContext';

const GButton = ({ title, label, onPress, loading, containerStyle, titleStyle, variant = 'primary', outline }) => {
  const { theme } = useTheme();
  const displayTitle = title || label;
  const isOutline = variant === 'outline' || outline;
  const isSecondary = variant === 'secondary';

  const buttonStyle = [
    styles.button,
    isOutline && { backgroundColor: theme.colors.surface, borderWidth: 1.5, borderColor: theme.colors.primary, elevation: 0, shadowOpacity: 0 },
    !isOutline && isSecondary && { backgroundColor: theme.colors.secondary },
    !isOutline && !isSecondary && { backgroundColor: theme.colors.primary },
    containerStyle,
    loading && styles.buttonDisabled
  ];

  const textStyle = [
    styles.text,
    isOutline ? { color: theme.colors.primary } : { color: theme.colors.white },
    { fontFamily: theme.typography.medium },
    titleStyle
  ];

  return (
    <TouchableOpacity 
      style={buttonStyle} 
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? theme.colors.primary : theme.colors.white} />
      ) : (
        <Text style={textStyle}>
          {displayTitle}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginVertical: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: 16,
    letterSpacing: 0.5,
    textTransform: 'none',
  },
});

export default GButton;
