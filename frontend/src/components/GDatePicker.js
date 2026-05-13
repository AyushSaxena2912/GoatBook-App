import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, Animated, TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../theme/ThemeContext';
import { lightTheme } from '../theme';
import { Calendar } from 'lucide-react-native';

const GDatePicker = ({ label, value, onDateChange, required, placeholder = 'Select Date', containerStyle, error }) => {
  const { isDarkMode, theme } = useTheme();
  const [show, setShow] = useState(false);
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  // Default date for picker if value is null or invalid
  const isValid = value && !isNaN(new Date(value).getTime());
  const dateValue = isValid ? new Date(value) : new Date();

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: (value || show) ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, show]);

  const onChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    
    if (event.type === 'set') {
      const currentDate = selectedDate || dateValue;
      if (currentDate && !isNaN(currentDate.getTime())) {
        onDateChange(currentDate.toISOString().split('T')[0]);
      }
    } else if (event.type === 'dismissed') {
      setShow(false);
    }
    
    if (Platform.OS === 'ios' && event.type === 'set') {
      // For iOS, we might want to keep it open or close on a specific button
      // But typically for this UI, we close it or let the user decide.
    }
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'Invalid Date') return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const labelContainerStyle = {
    position: 'absolute',
    left: 12,
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [14, -10],
    }),
    zIndex: 10,
    backgroundColor: (value || show) ? theme.colors.background : 'transparent',
    paddingHorizontal: (value || show) ? 10 : 0,
    maxWidth: (value || show) ? '92%' : '90%',
    flexDirection: 'row',
    alignItems: 'center',
    pointerEvents: 'none',
    height: (value || show) ? 20 : 'auto',
  };

  const labelTextStyle = {
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [15, 12],
    }),
    color: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.colors.textLight, error ? theme.colors.error : (show ? theme.colors.primary : theme.colors.textLight)],
    }),
    fontFamily: (value || show) ? theme.typography.semiBold : theme.typography.medium,
    letterSpacing: 0.3,
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity 
        style={[
          styles.inputWrapper,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          error && { borderColor: theme.colors.error, borderWidth: 1.5 },
          show && { borderColor: theme.colors.primary, borderWidth: 1.5 }
        ]} 
        onPress={() => {
          setShow(true);
        }}
        activeOpacity={0.7}
      >
        <Text 
          style={[
            styles.valueText, 
            { 
              color: value ? theme.colors.text : theme.colors.textMuted,
              opacity: (value || show) ? 1 : 0 
            }, 
          ]}
          numberOfLines={1}
        >
          {value ? formatDate(value) : placeholder}
        </Text>

        <Calendar size={20} color={theme.colors.textMuted} />
      </TouchableOpacity>

      <Animated.View style={labelContainerStyle}>
        <Animated.Text style={labelTextStyle} numberOfLines={1} ellipsizeMode="tail">
          {label}{required && '*'}
        </Animated.Text>
      </Animated.View>

      {error ? (
        <View style={styles.errorContainer}>
           <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        </View>
      ) : null}

      {show && Platform.OS !== 'web' && (
        <DateTimePicker
          testID="dateTimePicker"
          value={dateValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChange}
          maximumDate={new Date()} // Can't be born in the future
        />
      )}
      
      {Platform.OS === 'web' && (
        <TextInput
          style={[StyleSheet.absoluteFill, { 
            opacity: 0, 
            height: 56, 
            zIndex: 10,
            cursor: 'pointer'
          }]}
          type="date"
          value={value}
          onChange={(e) => {
            onDateChange(e.target.value);
            setShow(false);
          }}
          onFocus={() => setShow(true)}
          onBlur={() => setShow(false)}
        />
      )}
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
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 52,
  },
  valueText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
    paddingRight: 4,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
  },
  webPickerContainer: {
    marginTop: 8,
    width: '100%',
  },
  webInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  }
});

export default GDatePicker;
