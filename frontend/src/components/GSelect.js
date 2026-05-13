import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Modal, FlatList, SafeAreaView, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { lightTheme } from '../theme';
import { ChevronDown, X, AlertCircle, HelpCircle } from 'lucide-react-native';

const GSelect = ({ 
  label, 
  value, 
  options = [], 
  onSelect, 
  error, 
  required,
  placeholder = '',
  containerStyle,
  helpAction,
  rightIcon,
  disabled = false
}) => {
  const { isDarkMode, theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: (value || modalVisible) ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, modalVisible]);

  const labelContainerStyle = {
    position: 'absolute',
    left: 12,
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [14, -10],
    }),
    zIndex: 10,
    backgroundColor: (value || modalVisible) ? theme.colors.background : 'transparent',
    paddingHorizontal: (value || modalVisible) ? 10 : 0,
    maxWidth: (value || modalVisible) ? '92%' : '90%',
    flexDirection: 'row',
    alignItems: 'center',
    pointerEvents: 'box-none',
    height: (value || modalVisible) ? 20 : 'auto',
  };

  const labelTextStyle = {
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [15, 12],
    }),
    color: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.colors.textLight, error ? theme.colors.error : (modalVisible ? theme.colors.primary : theme.colors.textLight)],
    }),
    fontFamily: (value || modalVisible) ? theme.typography.semiBold : (theme.typography.medium || 'System'),
    letterSpacing: 0.3,
  };

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={() => !disabled && setModalVisible(true)}
        style={[
          styles.inputWrapper, 
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          error && { borderColor: theme.colors.error },
          modalVisible && { borderColor: theme.colors.primary },
          disabled && { opacity: 0.6, backgroundColor: isDarkMode ? '#111' : '#F3F4F6' }
        ]}
      >
        <Text 
          style={[
            styles.valueText, 
            { 
              color: value ? theme.colors.text : theme.colors.textMuted,
              opacity: (value || modalVisible) ? 1 : 0 
            }
          ]} 
          numberOfLines={1}
        >
          {selectedOption?.label || placeholder}
        </Text>

        <View style={styles.iconContainer}>
          {rightIcon && (
            <View style={{ marginRight: 8 }}>
              {rightIcon}
            </View>
          )}
          {error ? (
            <AlertCircle size={20} color={theme.colors.error} />
          ) : (
            <ChevronDown size={20} color={theme.colors.textMuted} />
          )}
        </View>
      </TouchableOpacity>

      <Animated.View style={labelContainerStyle}>
        <Animated.Text 
          style={labelTextStyle} 
          numberOfLines={1} 
          ellipsizeMode="tail"
        >
          {label}{required && '*'}
        </Animated.Text>
        {helpAction && (
          <Animated.View style={{
            marginLeft: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [5, 2],
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

      {error ? (
        <View style={styles.errorContainer}>
           <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        </View>
      ) : null}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          <SafeAreaView style={[styles.modalContent, { backgroundColor: theme.colors.surface, pointerEvents: 'box-none' }]}>
            <View style={[styles.modalHeader, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.white }]}>Select {label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={24} color={theme.colors.white} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.optionItem,
                    { borderBottomColor: theme.colors.border },
                    item.value === value && { backgroundColor: isDarkMode ? '#1E293B' : '#FFF1EA' }
                  ]}
                  onPress={() => {
                    onSelect(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    { color: theme.colors.text },
                    item.value === value && { color: theme.colors.primary, fontWeight: '600' }
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>
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
  valueText: {
    fontSize: 15,
    flex: 1,
    marginRight: 8,
    fontWeight: '500',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
    paddingRight: 4,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '70%',
    ...lightTheme.shadow.lg,
  },
  modalHeader: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  listContainer: {
    paddingBottom: 40,
  },
  optionItem: {
    padding: 20,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
  },
});

export default GSelect;
