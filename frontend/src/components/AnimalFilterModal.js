import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const AnimalFilterModal = ({ visible, onClose, onApply, animals = [], initialFilters }) => {
  const { theme, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  
  const defaultFilters = {
    sheds: [],
    status: [],
    gender: [],
    breeds: [],
    animalTypes: [],
    origins: [],
    timeAdded: 'All',
    weightCondition: 'Above',
    weightValue: '',
    weightMax: '',
    priceCondition: 'Above',
    priceValue: '',
    priceMax: ''
  };

  const [filters, setFilters] = useState(defaultFilters);

  // Extract unique options from the current animals list
  const uniqueOptions = useMemo(() => {
    const sheds = new Set();
    const breeds = new Set();
    const types = new Set();
    const origins = new Set();

    animals.forEach(a => {
      if (a.Location?.name) sheds.add(a.Location.name);
      if (a.Breed?.name) breeds.add(a.Breed.name);
      if (a.animalType) types.add(a.animalType);
      if (a.acquisitionMethod) origins.add(a.acquisitionMethod);
    });

    return {
      sheds: Array.from(sheds).sort(),
      breeds: Array.from(breeds).sort(),
      types: Array.from(types).sort(),
      origins: Array.from(origins).sort()
    };
  }, [animals]);

  useEffect(() => {
    if (visible) {
      setFilters(initialFilters ? { ...defaultFilters, ...initialFilters } : defaultFilters);
    }
  }, [visible, initialFilters]);

  const toggleArrayItem = (key, value) => {
    setFilters(prev => {
      const arr = prev[key] || [];
      if (arr.includes(value)) {
        return { ...prev, [key]: arr.filter(i => i !== value) };
      } else {
        return { ...prev, [key]: [...arr, value] };
      }
    });
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  const handleApply = () => {
    onApply(filters);
  };

  const renderChips = (title, key, options, isEnum = false) => {
    if (!options || options.length === 0) return null;
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
        <View style={styles.chipsContainer}>
          {options.map(opt => {
            const isSelected = (filters[key] || []).includes(opt);
            return (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.chip,
                  { backgroundColor: isDarkMode ? '#2C2C2C' : '#F3F4F6', borderColor: isSelected ? theme.colors.primary : 'transparent' },
                  isSelected && { backgroundColor: isDarkMode ? `${theme.colors.primary}20` : `${theme.colors.primary}15` }
                ]}
                onPress={() => toggleArrayItem(key, opt)}
              >
                <Text style={[
                  styles.chipText,
                  { color: isSelected ? theme.colors.primary : theme.colors.textMuted },
                  isSelected && styles.chipTextSelected
                ]}>{isEnum ? t('enums.' + opt.toLowerCase(), opt) : opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderTimeChips = () => {
    const options = ['All', 'Recently (24h)', 'Last 1 Week', 'Last 1 Month', 'Last 3 Months', 'Last 6 Months', 'Last 1 Year'];
    const optKeys = {'All': 'all', 'Recently (24h)': 'recently', 'Last 1 Week': 'last1Week', 'Last 1 Month': 'last1Month', 'Last 3 Months': 'last3Months', 'Last 6 Months': 'last6Months', 'Last 1 Year': 'last1Year'};
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('filterModal.timeAdded', 'Time Added')}</Text>
        <View style={styles.chipsContainer}>
          {options.map(opt => {
            const isSelected = filters.timeAdded === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.chip,
                  { backgroundColor: isDarkMode ? '#2C2C2C' : '#F3F4F6', borderColor: isSelected ? theme.colors.primary : 'transparent' },
                  isSelected && { backgroundColor: isDarkMode ? `${theme.colors.primary}20` : `${theme.colors.primary}15` }
                ]}
                onPress={() => setFilters(prev => ({ ...prev, timeAdded: opt }))}
              >
                <Text style={[
                  styles.chipText,
                  { color: isSelected ? theme.colors.primary : theme.colors.textMuted },
                  isSelected && styles.chipTextSelected
                ]}>{optKeys[opt] ? t('filterModal.' + optKeys[opt], opt) : opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderNumberInput = (title, conditionKey, valKey, maxValKey) => {
    const conditions = ['Above', 'Below', 'Between'];
    const condKeys = {'Above': 'above', 'Below': 'below', 'Between': 'between'};
    const selectedCondition = filters[conditionKey] || 'Above';
    
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
        <View style={[styles.conditionRow, { backgroundColor: isDarkMode ? '#2C2C2C' : '#F3F4F6' }]}>
          {conditions.map(cond => (
            <TouchableOpacity
              key={cond}
              style={[
                styles.conditionTab,
                selectedCondition === cond && { backgroundColor: theme.colors.primary }
              ]}
              onPress={() => setFilters(prev => ({ ...prev, [conditionKey]: cond }))}
            >
              <Text style={[
                styles.conditionTabText, 
                { color: selectedCondition === cond ? '#FFF' : theme.colors.textMuted }
              ]}>{condKeys[cond] ? t('filterModal.' + condKeys[cond], cond) : cond}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
            placeholder={selectedCondition === 'Between' ? t('filterModal.minValue', 'Min value') : t('filterModal.enterValue', 'Enter value')}
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="numeric"
            value={filters[valKey]}
            onChangeText={(text) => setFilters(prev => ({ ...prev, [valKey]: text }))}
          />
          {selectedCondition === 'Between' && (
            <>
              <Text style={{ color: theme.colors.textMuted, marginHorizontal: 10 }}>-</Text>
              <TextInput
                style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
                placeholder={t('filterModal.maxValue', 'Max value')}
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numeric"
                value={filters[maxValKey]}
                onChangeText={(text) => setFilters(prev => ({ ...prev, [maxValKey]: text }))}
              />
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent={true} statusBarTranslucent={true} navigationBarTranslucent={true} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF', paddingBottom: Platform.OS === 'ios' ? insets.bottom : 20, paddingTop: insets.top }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{t('filterModal.filters', 'Filters')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color={theme.colors.textMuted} size={24} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {renderChips(t('filterModal.animalShed', 'Animal Shed (Location)'), 'sheds', uniqueOptions.sheds)}
            {renderChips(t('filterModal.status', 'Status'), 'status', ['Live', 'Sold', 'Dead'], true)}
            {renderChips(t('filterModal.gender', 'Gender'), 'gender', ['Male', 'Female'], true)}
            {renderChips(t('filterModal.animalType', 'Animal Type'), 'animalTypes', uniqueOptions.types, true)}
            {renderChips(t('filterModal.breed', 'Breed'), 'breeds', uniqueOptions.breeds)}
            {renderChips(t('filterModal.origin', 'Origin'), 'origins', uniqueOptions.origins, true)}
            
            {renderTimeChips()}
            
            {renderNumberInput(t('filterModal.weight', 'Weight (kg)'), 'weightCondition', 'weightValue', 'weightMax')}
            {renderNumberInput(t('filterModal.netPrice', 'Net Price'), 'priceCondition', 'priceValue', 'priceMax')}

            <View style={{ height: 40 }} />
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
            <TouchableOpacity style={[styles.btn, styles.clearBtn, { borderColor: theme.colors.border }]} onPress={clearFilters}>
              <Text style={[styles.clearBtnText, { color: theme.colors.text }]}>{t('filterModal.clearAll', 'Clear All')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.applyBtn, { backgroundColor: theme.colors.primary }]} onPress={handleApply}>
              <Text style={styles.applyBtnText}>{t('filterModal.applyFilters', 'Apply Filters')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: '100%',
  },
  modalContent: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  closeBtn: {
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 14,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  chipTextSelected: {
    fontFamily: 'Inter-SemiBold',
  },
  conditionRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  conditionTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  conditionTabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    backgroundColor: '#F9FAFB', // Add subtle background to inputs
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16, // Reduced to normal padding, relies on modalContent padding for safe area
    borderTopWidth: 1,
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtn: {
    borderWidth: 1,
  },
  clearBtnText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  applyBtn: {
    shadowColor: '#F95003',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  applyBtnText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFF',
  }
});

export default AnimalFilterModal;
