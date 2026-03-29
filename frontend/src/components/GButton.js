import React from 'react';
import { StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { COLORS, SPACING } from '../theme';

import { useTheme } from '../theme/ThemeContext';

const GButton = ({ title, onPress, loading, containerStyle, titleStyle, variant = 'primary' }) => {
  const { theme } = useTheme();
  const isOutline = variant === 'outline';
  const isSecondary = variant === 'secondary';

  const buttonStyle = [
    styles.button,
    isOutline && { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.colors.primary },
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
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
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
