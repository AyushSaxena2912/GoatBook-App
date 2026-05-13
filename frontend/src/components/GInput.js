import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, TextInput, Text, Animated, Platform, TouchableOpacity } from 'react-native';
import { Eye, EyeOff, HelpCircle } from 'lucide-react-native';
import { COLORS, SPACING, lightTheme } from '../theme';

import { useTheme } from '../theme/ThemeContext';

const GInput = ({ 
  label, 
  value, 
  onChangeText, 
  secureTextEntry, 
  error, 
  keyboardType, 
  required,
  placeholder,
  containerStyle,
  helpAction,
  leftIcon,
  rightIcon,
  ...props 
}) => {
  const { isDarkMode, theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: (isFocused || value) ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const labelContainerStyle = {
    position: 'absolute',
    left: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [leftIcon ? 46 : 12, 12],
    }),
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [14, -10],
    }),
    zIndex: 10,
    backgroundColor: (isFocused || value) ? theme.colors.background : 'transparent',
    paddingHorizontal: (isFocused || value) ? 10 : 0,
    maxWidth: (isFocused || value) ? '92%' : '90%',
    flexDirection: 'row',
    alignItems: 'center',
    pointerEvents: 'box-none',
    height: (isFocused || value) ? 20 : 'auto',
  };
  
  const labelTextStyle = {
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [15, 12],
    }),
    color: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.colors.textLight, error ? theme.colors.error : (isFocused ? theme.colors.primary : theme.colors.textLight)],
    }),
    fontFamily: (isFocused || value) ? theme.typography.semiBold : theme.typography.medium,
    letterSpacing: 0.3,
  };

  const inputRef = useRef(null);
  const isMultiline = props.multiline;

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity 
        activeOpacity={1}
        onPress={() => inputRef.current?.focus()}
        style={[
          styles.inputWrapper, 
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          isFocused && { borderColor: theme.colors.primary, borderWidth: 1.5 },
          error && { borderColor: theme.colors.error },
          isMultiline && { height: 'auto', minHeight: 80, alignItems: 'flex-start', paddingTop: 16 }
        ]}
      >
        {leftIcon && (
          <View style={styles.leftIconWrapper}>
            {leftIcon}
          </View>
        )}
        <TextInput
          ref={inputRef}
          style={StyleSheet.flatten([
            styles.input,
            isMultiline && { textAlignVertical: 'top', height: 'auto', minHeight: 60, marginTop: 8 },
            props.style,
            { 
              color: theme.colors.text, 
              fontFamily: theme.typography.medium,
              outlineStyle: Platform.OS === 'web' ? 'none' : undefined 
            },
          ])}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType={keyboardType}
          placeholder={(isFocused && !value) ? placeholder : ""} 
          placeholderTextColor={theme.colors.textMuted}
          cursorColor={theme.colors.primary}
          selectionColor={theme.colors.primary + '40'}
          {...props}
          secureTextEntry={secureTextEntry && !showPassword}
        />
        {rightIcon && (
          <View style={styles.rightIconWrapper}>
            {rightIcon}
          </View>
        )}
        {secureTextEntry && (
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            {showPassword ? (
              <EyeOff size={20} color={theme.colors.textMuted} />
            ) : (
              <Eye size={20} color={theme.colors.textMuted} />
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {label ? (
        <Animated.View style={labelContainerStyle}>
          <Animated.Text style={labelTextStyle} numberOfLines={1} ellipsizeMode="tail">
            {label}{required && '*'}
          </Animated.Text>
          {helpAction && (
            <Animated.View style={{
              marginLeft: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 3],
              }),
              transform: [{
                scale: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1.1, 0.85],
                })
              }],
              marginTop: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [2, 1],
              }),
            }}>
              <TouchableOpacity 
                onPress={helpAction}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <HelpCircle size={16} color={theme.colors.textMuted} strokeWidth={1.5} />
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
      ) : null}
      {error && <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 15,
    textAlignVertical: 'center',
    paddingTop: Platform.OS === 'android' ? 2 : 0,
    paddingBottom: 0,
    includeFontPadding: false,
    outlineWidth: 0,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  eyeIcon: {
    padding: 8,
  },
  leftIconWrapper: {
    paddingRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconWrapper: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GInput;
