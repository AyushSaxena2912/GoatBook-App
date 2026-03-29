import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Modal, FlatList, SafeAreaView, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { lightTheme } from '../theme';
import { ChevronDown, X, AlertCircle } from 'lucide-react-native';

const GSelect = ({ 
  label, 
  value, 
  options = [], 
  onSelect, 
  error, 
  required,
  placeholder = '',
  containerStyle
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

  const labelStyle = {
    position: 'absolute',
    left: 12,
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [14, -10],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.colors.textLight, error ? theme.colors.error : theme.colors.primary],
    }),
    backgroundColor: (value || modalVisible) ? theme.colors.surface : 'transparent',
    paddingHorizontal: (value || modalVisible) ? 4 : 0,
    zIndex: 1,
    fontWeight: (value || modalVisible) ? '700' : '500',
    maxWidth: '90%',
  };

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={() => setModalVisible(true)}
        style={[
          styles.inputWrapper, 
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          error && { borderColor: theme.colors.error, borderWidth: 2 },
          modalVisible && { borderColor: theme.colors.primary, borderWidth: 2 }
        ]}
      >
        <Animated.Text style={labelStyle} pointerEvents="none" numberOfLines={1} ellipsizeMode="tail">
          {label}{required && '*'}
        </Animated.Text>
        
        {value || modalVisible ? (
          <Text 
            style={[styles.valueText, { color: theme.colors.text }, !value && { color: theme.colors.textMuted }]} 
            numberOfLines={1}
          >
            {selectedOption?.label || placeholder}
          </Text>
        ) : <View style={{ flex: 1 }} />}

        <View style={styles.iconContainer}>
          {error ? (
            <AlertCircle size={20} color={theme.colors.error} />
          ) : (
            <ChevronDown size={20} color={theme.colors.textLight} />
          )}
        </View>
      </TouchableOpacity>

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
          <SafeAreaView style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Choose {label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={theme.colors.text} />
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
    height: 56,
  },
  valueText: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
    fontWeight: '500',
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
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
    fontSize: 16,
    fontWeight: '500',
  },
});

export default GSelect;
