import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import { Search, ChevronDown, Calendar, CheckCircle, Tag } from 'lucide-react-native';
import { SPACING } from '../theme';
import api from '../api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';



const AddBreedingScreen = ({ navigation, route }) => {
  const { theme, isDarkMode } = useTheme();
  const { t } = useTranslation();

  const GENDERS = [
  { label: t('enums.male', 'Male'), value: 'MALE' },
  { label: t('enums.female', 'Female'), value: 'FEMALE' },
];


  const BIRTH_TYPES = [
  { label: t('enums.single', 'Single'), value: 'SINGLE', count: 1 },
  { label: t('enums.twin', 'Twin'), value: 'TWIN', count: 2 },
  { label: t('enums.triplet', 'Triplet'), value: 'TRIPLET', count: 3 },
  { label: t('enums.quadruplet', 'Quadruplet'), value: 'QUADRUPLET', count: 4 },
];

  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  
  const preSelectedAnimal = route.params?.preSelectedAnimal || null;
  const editItem = route.params?.editItem || null;
  const isEditing = !!editItem;

  // Search/Animal State
  const [searchTag, setSearchTag] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [animal, setAnimal] = useState(preSelectedAnimal);
  
  // Form State
  const [deliveryDate, setDeliveryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [birthType, setBirthType] = useState('SINGLE');
  const [kids, setKids] = useState([{ tag_number: '', gender: 'MALE', birth_weight: '', remark: '' }]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Dropdown states for form
  const [showBirthTypeDropdown, setShowBirthTypeDropdown] = useState(false);
  const [activeGenderDropdown, setActiveGenderDropdown] = useState(null);

  useEffect(() => {
    if (isEditing && editItem) {
      setDeliveryDate(new Date(editItem.delivery_date));
      setBirthType(editItem.birth_type);
      
      // Parse kids details or create empty array based on birth type
      let parsedKids = [];
      if (editItem.kids_details && Array.isArray(editItem.kids_details)) {
        parsedKids = editItem.kids_details;
      }
      
      const expectedCount = BIRTH_TYPES.find(b => b.value === editItem.birth_type)?.count || 1;
      while (parsedKids.length < expectedCount) {
        parsedKids.push({ tag_number: '', gender: 'MALE', birth_weight: '', remark: '' });
      }
      
      setKids(parsedKids.slice(0, expectedCount));
    }
  }, [isEditing, editItem]);

  const handleSearch = async () => {
    if (!searchTag.trim()) {
      Alert.alert('Error', 'Please enter a Tag ID');
      return;
    }
    
    setIsSearching(true);
    setAnimal(null);
    
    try {
      const res = await api.get(`/animals/check-tag/${searchTag.trim()}`);
      if (res.data && res.data.id) {
        setAnimal(res.data);
      } else {
        Alert.alert('Not Found', 'No animal found with this Tag ID');
      }
    } catch (err) {
      console.error('Search error:', err);
      Alert.alert('Error', 'Failed to search animal. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleBirthTypeChange = (val) => {
    setBirthType(val);
    const count = BIRTH_TYPES.find(b => b.value === val)?.count || 1;
    
    // Adjust kids array length
    let newKids = [...kids];
    if (newKids.length < count) {
      while (newKids.length < count) {
        newKids.push({ tag_number: '', gender: 'MALE', birth_weight: '', remark: '' });
      }
    } else if (newKids.length > count) {
      newKids = newKids.slice(0, count);
    }
    setKids(newKids);
    setShowBirthTypeDropdown(false);
  };

  const updateKid = (index, field, value) => {
    const newKids = [...kids];
    newKids[index][field] = value;
    setKids(newKids);
  };

  const handleSave = async () => {
    if (!animal) {
      Alert.alert('Error', 'Please scan or enter a valid animal Tag ID first.');
      return;
    }
    
    // Validate kids
    for (let i = 0; i < kids.length; i++) {
      if (!kids[i].tag_number.trim()) {
        Alert.alert('Validation', `Please enter a Tag ID for kid ${i + 1}`);
        return;
      }
    }

    setIsSaving(true);
    
    // Calculate num_male and num_female
    let num_male = 0;
    let num_female = 0;
    kids.forEach(k => {
      if (k.gender === 'MALE') num_male++;
      if (k.gender === 'FEMALE') num_female++;
    });

    const payload = {
      animal_id: animal.id,
      delivery_date: deliveryDate.toISOString(),
      birth_type: birthType,
      num_male,
      num_female,
      kids: kids
    };

    try {
      if (isEditing) {
        await api.put(`/breedings/${editItem.id}`, payload);
      } else {
        await api.post('/breedings', payload);
      }
      navigation.goBack();
    } catch (err) {
      console.error('Save breeding error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to save record');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t('common.confirmDelete', 'Confirm Delete?'),
      'Are you sure you want to delete this breeding/delivery record?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            setIsSaving(true);
            try {
              await api.delete(`/breedings/${editItem.id}`);
              navigation.goBack();
            } catch (err) {
              console.error('Delete breeding error:', err);
              Alert.alert('Error', 'Failed to delete record');
            } finally {
              setIsSaving(false);
            }
          } 
        }
      ]
    );
  };

  const renderKidFields = (kid, index) => {
    const kidLabels = [t('farmActivities.first', 'First'), t('farmActivities.second', 'Second'), t('farmActivities.third', 'Third'), t('farmActivities.fourth', 'Fourth')];
    const labelPrefix = kidLabels[index] || `${index + 1}th`;

    // Calculate zIndex to ensure dropdowns overlap subsequent rows
    const sectionZIndex = 100 - (index * 10);

    return (
      <View key={index} style={[styles.kidSection, { zIndex: sectionZIndex }]}>
        <View style={[styles.row, { zIndex: sectionZIndex + 2 }]}>
          <View style={[styles.halfWidth, { zIndex: 1 }]}>
            <Text style={styles.inputLabel}>{labelPrefix} {t('farmActivities.kidTagId', 'Kid Tag ID*').replace('*', '')}*</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={kid.tag_number}
                onChangeText={(val) => updateKid(index, 'tag_number', val)}
                placeholder="Enter Tag"
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>
          </View>
          
          <View style={[styles.halfWidth, { zIndex: 999 }]}>
            <Text style={styles.inputLabel}>{t('farmActivities.gender', 'Gender*')}</Text>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => setActiveGenderDropdown(activeGenderDropdown === index ? null : index)}
            >
              <Text style={styles.dropdownText}>
                {GENDERS.find(g => g.value === kid.gender)?.label || 'Select'}
              </Text>
              <ChevronDown size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>
            
            {activeGenderDropdown === index && (
              <View style={styles.dropdownMenu}>
                {GENDERS.map((g) => (
                  <TouchableOpacity 
                    key={g.value} 
                    style={styles.dropdownItem}
                    onPress={() => {
                      updateKid(index, 'gender', g.value);
                      setActiveGenderDropdown(null);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{g.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={[styles.row, { zIndex: sectionZIndex + 1 }]}>
          <View style={styles.halfWidth}>
            <Text style={styles.inputLabel}>{t('farmActivities.birthWt', 'Birth Wt')}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={kid.birth_weight}
                onChangeText={(val) => updateKid(index, 'birth_weight', val)}
                placeholder="0.0"
                keyboardType="numeric"
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>
          </View>
          
          <View style={styles.halfWidth}>
            <Text style={styles.inputLabel}>{t('farmActivities.notes', 'Remark')}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={kid.remark}
                onChangeText={(val) => updateKid(index, 'remark', val)}
                placeholder="Notes"
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader title={isEditing ? t('farmActivities.editBreeding', 'Edit Breeding Record') : t('farmActivities.addBreeding', 'Add Breeding Record')} onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Search Section */}
          {!preSelectedAnimal ? (
            <View style={styles.searchSection}>
              <Text style={styles.searchLabel}>{t('farmActivities.scanEnterTagId', 'Scan / Enter Tag Id*')}</Text>
              <View style={styles.searchRow}>
                <View style={[styles.searchInputContainer, { borderColor: theme.colors.border }]}>
                  <TextInput
                    style={[styles.searchInput, { color: theme.colors.text }]}
                    value={searchTag}
                    onChangeText={setSearchTag}
                    placeholder="2012"
                    placeholderTextColor={theme.colors.textMuted}
                    onSubmitEditing={() => handleSearch()}
                  />
                  <Search size={20} color={theme.colors.textMuted} />
                </View>
                <TouchableOpacity 
                  style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => handleSearch()}
                  disabled={isSearching}
                >
                  {isSearching ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.addButtonText}>{t('common.search', 'Search')}</Text>}
                </TouchableOpacity>
              </View>

              {animal && (
                <View style={[styles.animalFound, { backgroundColor: theme.colors.primary + '12', borderColor: theme.colors.primary + '40' }]}>
                  <CheckCircle size={16} color={theme.colors.primary} />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={[styles.animalFoundTag, { color: theme.colors.text }]}>
                      Tag: {animal.tagNumber || animal.tag_number}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.tagSection, { backgroundColor: theme.colors.primary + '12', borderColor: theme.colors.primary + '40' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Tag size={16} color={theme.colors.primary} />
                <Text style={[styles.animalFoundTag, { color: theme.colors.text, marginLeft: 8 }]}>
                  {t('farmActivities.motherTagId', 'Mother Tag ID')}: {animal?.tag_number || animal?.tagNumber}
                </Text>
              </View>
            </View>
          )}

          <View style={[styles.row, { zIndex: 10, marginTop: 16 }]}>
            {/* Delivery Date */}
            <View style={styles.halfWidth}>
              <Text style={styles.inputLabel}>{t('farmActivities.deliveryDate', 'Delivery Date*')}</Text>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>{deliveryDate.toLocaleDateString()}</Text>
                <Calendar size={16} color={theme.colors.textMuted} />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={deliveryDate}
                  mode="date"
                  display="default"
                  onChange={(e, d) => {
                    setShowDatePicker(false);
                    if (d) setDeliveryDate(d);
                  }}
                />
              )}
            </View>
            
            {/* Birth Type */}
            <View style={[styles.halfWidth, { zIndex: 999 }]}>
              <Text style={styles.inputLabel}>{t('farmActivities.birthType', 'Birth Type')}</Text>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => setShowBirthTypeDropdown(!showBirthTypeDropdown)}
              >
                <Text style={styles.dropdownText}>
                  {BIRTH_TYPES.find(b => b.value === birthType)?.label || 'Select'}
                </Text>
                <ChevronDown size={16} color={theme.colors.textMuted} />
              </TouchableOpacity>
              
              {showBirthTypeDropdown && (
                <View style={[styles.dropdownMenu, { zIndex: 1000 }]}>
                  {BIRTH_TYPES.map((b) => (
                    <TouchableOpacity 
                      key={b.value} 
                      style={styles.dropdownItem}
                      onPress={() => handleBirthTypeChange(b.value)}
                    >
                      <Text style={styles.dropdownItemText}>{b.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Dynamic Kids Fields */}
          <View style={{ zIndex: 1, marginTop: 8 }}>
            {kids.map((kid, index) => renderKidFields(kid, index))}
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: theme.colors.primary, opacity: isSaving ? 0.7 : 1 }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.saveButtonText}>{t('common.save', 'Save')}</Text>}
          </TouchableOpacity>

          {isEditing && (
            <TouchableOpacity 
              style={[styles.deleteButton, { borderColor: '#EF4444', borderWidth: 1.5, marginTop: 12 }]}
              onPress={handleDelete}
              disabled={isSaving}
            >
              <Text style={[styles.deleteButtonText, { color: '#EF4444' }]}>{t('common.delete', 'Delete')}</Text>
            </TouchableOpacity>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

    </View>
  );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: SPACING.md },
  
  // Search
  searchSection: { marginBottom: 24 },
  searchLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: theme.colors.textMuted, marginBottom: 8 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  searchInputContainer: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', 
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, height: 48,
    backgroundColor: theme.colors.surface
  },
  searchInput: { flex: 1, fontSize: 16, fontFamily: 'Inter_400Regular' },
  addButton: { 
    height: 48, paddingHorizontal: 24, borderRadius: 8, 
    justifyContent: 'center', alignItems: 'center' 
  },
  addButtonText: { color: '#FFF', fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  
  tagSection: {
    padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16
  },
  animalFound: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    borderRadius: 8, borderWidth: 1, marginTop: 12
  },
  animalFoundTag: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  
  // Form
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  halfWidth: { flex: 1 },
  inputLabel: { fontSize: 12, color: theme.colors.textMuted, fontFamily: 'Inter_500Medium', marginBottom: 6 },
  dateButton: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8,
    paddingHorizontal: 12, height: 44, backgroundColor: theme.colors.surface
  },
  dateText: { fontSize: 14, color: theme.colors.text, fontFamily: 'Inter_400Regular' },
  dropdownButton: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8,
    paddingHorizontal: 12, height: 44, backgroundColor: theme.colors.surface
  },
  dropdownText: { fontSize: 14, color: theme.colors.text, fontFamily: 'Inter_400Regular' },
  dropdownMenu: { 
    position: 'absolute', top: 65, left: 0, right: 0, 
    backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 5
  },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  dropdownItemText: { fontSize: 14, color: theme.colors.text, fontFamily: 'Inter_400Regular' },
  
  inputContainer: { 
    borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8,
    paddingHorizontal: 12, height: 44, backgroundColor: theme.colors.surface
  },
  input: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: theme.colors.text },
  
  kidSection: {
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },

  saveButton: { 
    height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center',
    marginTop: 24 
  },
  saveButtonText: { color: '#FFF', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  deleteButton: { 
    height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'transparent'
  },
  deleteButtonText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});

export default AddBreedingScreen;
