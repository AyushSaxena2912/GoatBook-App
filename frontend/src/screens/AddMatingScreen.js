import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import { Search, ChevronDown, Calendar, CheckCircle, Tag } from 'lucide-react-native';
import { SPACING } from '../theme';
import api from '../api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';



const AddMatingScreen = ({ navigation, route }) => {
  const { theme, isDarkMode } = useTheme();
  const { t } = useTranslation();

  const MATING_STATUSES = [
  { label: t('enums.not_successful', 'Not Successful'), value: 'NOT_SUCCESSFUL' },
  { label: t('enums.pregnant', 'Pregnant'), value: 'PREGNANT' },
  { label: t('enums.miscarriage', 'Miscarriage'), value: 'MISCARRIAGE' },
];


  const MATING_TYPES = [
  { label: t('enums.natural', 'Natural'), value: 'NATURAL' },
  { label: t('enums.ai', 'Artificial Insemination'), value: 'AI' },
  { label: t('enums.et', 'Embryo Transplant'), value: 'ET' },
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
  const [matingDate, setMatingDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [matingType, setMatingType] = useState('NATURAL');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  
  const [maleTagId, setMaleTagId] = useState('');
  const [maleBreed, setMaleBreed] = useState('');
  const [remark, setRemark] = useState('');
  
  const [semenId, setSemenId] = useState('');
  const [dose, setDose] = useState('');
  const [technician, setTechnician] = useState('');
  const [time, setTime] = useState('');
  const [embryoId, setEmbryoId] = useState('');
  
  // Edit specific fields
  const [status, setStatus] = useState('NOT_SUCCESSFUL');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(new Date());
  const [showExpectedDatePicker, setShowExpectedDatePicker] = useState(false);
  const [miscarriageDate, setMiscarriageDate] = useState(new Date());
  const [showMiscarriageDatePicker, setShowMiscarriageDatePicker] = useState(false);
  const [miscarriageReason, setMiscarriageReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isEditing && editItem) {
      setMatingDate(new Date(editItem.mating_date));
      setMatingType(editItem.mating_type);
      setMaleTagId(editItem.male_tag_id || '');
      setMaleBreed(editItem.male_breed || '');
      setRemark(editItem.remark || '');
      setSemenId(editItem.semen_id || '');
      setDose(editItem.dose || '');
      setTechnician(editItem.technician || '');
      setTime(editItem.time || '');
      setEmbryoId(editItem.embryo_id || '');
      
      setStatus(editItem.status || 'NOT_SUCCESSFUL');
      if (editItem.expected_delivery_date) setExpectedDeliveryDate(new Date(editItem.expected_delivery_date));
      if (editItem.miscarriage_date) setMiscarriageDate(new Date(editItem.miscarriage_date));
      setMiscarriageReason(editItem.miscarriage_reason || '');
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

  const handleSave = async () => {
    if (!animal) {
      Alert.alert('Error', 'Please scan or enter a valid animal Tag ID first.');
      return;
    }
    
    setIsSaving(true);
    
    const payload = {
      animal_id: animal.id,
      mating_date: matingDate.toISOString(),
      mating_type: matingType,
      remark,
      male_tag_id: matingType === 'NATURAL' ? maleTagId : null,
      male_breed: matingType === 'NATURAL' ? maleBreed : null,
      semen_id: matingType === 'AI' ? semenId : null,
      dose: matingType === 'AI' ? dose : null,
      technician: (matingType === 'AI' || matingType === 'ET') ? technician : null,
      time: (matingType === 'AI' || matingType === 'ET') ? time : null,
      embryo_id: matingType === 'ET' ? embryoId : null,
    };

    if (isEditing) {
      payload.status = status;
      if (status === 'PREGNANT') {
        payload.expected_delivery_date = expectedDeliveryDate.toISOString();
      }
      if (status === 'MISCARRIAGE') {
        payload.miscarriage_date = miscarriageDate.toISOString();
        payload.miscarriage_reason = miscarriageReason;
      }
    } else {
      payload.status = 'NOT_SUCCESSFUL'; // Initial default
    }

    try {
      if (isEditing) {
        await api.put(`/matings/${editItem.id}`, payload);
      } else {
        await api.post('/matings', payload);
      }
      navigation.goBack();
    } catch (err) {
      console.error('Save mating error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to save record');
    } finally {
      setIsSaving(false);
    }
  };

  const calculateDate = (days) => {
    const result = new Date(matingDate);
    result.setDate(result.getDate() + days);
    return result.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader title={isEditing ? t('farmActivities.editMating', 'Edit Mating Record') : t('farmActivities.addMating', 'Add Mating Record')} onBack={() => navigation.goBack()} />

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

          <View style={[styles.row, { zIndex: 9, marginTop: 16 }]}>
            {/* Mating Date */}
            <View style={styles.halfWidth}>
              <Text style={styles.inputLabel}>{t('farmActivities.matingDate', 'Mating Date*')}</Text>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>{matingDate.toLocaleDateString()}</Text>
                <Calendar size={16} color={theme.colors.textMuted} />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={matingDate}
                  mode="date"
                  display="default"
                  onChange={(e, d) => {
                    setShowDatePicker(false);
                    if (d) setMatingDate(d);
                  }}
                />
              )}
            </View>
            
            {/* Mating Type */}
            <View style={[styles.halfWidth, { zIndex: 999 }]}>
              <Text style={styles.inputLabel}>{t('farmActivities.matingType', 'Mating Type*')}</Text>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => setShowTypeDropdown(!showTypeDropdown)}
              >
                <Text style={styles.dropdownText}>
                  {MATING_TYPES.find(b => b.value === matingType)?.label || 'Select'}
                </Text>
                <ChevronDown size={16} color={theme.colors.textMuted} />
              </TouchableOpacity>
              
              {showTypeDropdown && (
                <View style={[styles.dropdownMenu, { zIndex: 1000 }]}>
                  {MATING_TYPES.map((b) => (
                    <TouchableOpacity 
                      key={b.value} 
                      style={styles.dropdownItem}
                      onPress={() => {
                        setMatingType(b.value);
                        setShowTypeDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{b.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Dynamic Fields based on Type */}
          <View style={{ zIndex: 1, marginTop: 8 }}>
            {matingType === 'NATURAL' && (
              <>
                <View style={styles.fullWidthField}>
                  <Text style={styles.inputLabel}>{t('farmActivities.maleTagId', 'Male Tag ID')}</Text>
                  <View style={styles.inputContainer}>
                    <TextInput style={styles.input} value={maleTagId} onChangeText={setMaleTagId} />
                  </View>
                </View>
                <View style={styles.fullWidthField}>
                  <Text style={styles.inputLabel}>{t('farmActivities.maleBreed', 'Male Breed')}</Text>
                  <View style={styles.inputContainer}>
                    <TextInput style={styles.input} value={maleBreed} onChangeText={setMaleBreed} />
                  </View>
                </View>
              </>
            )}

            {matingType === 'AI' && (
              <>
                <View style={styles.fullWidthField}>
                  <Text style={styles.inputLabel}>{t('farmActivities.semen', 'Semen')}</Text>
                  <View style={styles.inputContainer}>
                    <TextInput style={styles.input} value={semenId} onChangeText={setSemenId} />
                  </View>
                </View>
                <View style={styles.fullWidthField}>
                  <Text style={styles.inputLabel}>Dose</Text>
                  <View style={styles.inputContainer}>
                    <TextInput style={styles.input} value={dose} onChangeText={setDose} />
                  </View>
                </View>
                <View style={styles.fullWidthField}>
                  <Text style={styles.inputLabel}>{t('farmActivities.technician', 'Technician/Medical Professional')}</Text>
                  <View style={styles.inputContainer}>
                    <TextInput style={styles.input} value={technician} onChangeText={setTechnician} />
                  </View>
                </View>
                <View style={styles.fullWidthField}>
                  <Text style={styles.inputLabel}>{t('farmActivities.time', 'Time')}</Text>
                  <View style={styles.inputContainer}>
                    <TextInput style={styles.input} value={time} onChangeText={setTime} />
                  </View>
                </View>
              </>
            )}

            {matingType === 'ET' && (
              <>
                <View style={styles.fullWidthField}>
                  <Text style={styles.inputLabel}>{t('farmActivities.embryo', 'Embryo')}</Text>
                  <View style={styles.inputContainer}>
                    <TextInput style={styles.input} value={embryoId} onChangeText={setEmbryoId} />
                  </View>
                </View>
                <View style={styles.fullWidthField}>
                  <Text style={styles.inputLabel}>{t('farmActivities.technician', 'Technician/Medical Professional')}</Text>
                  <View style={styles.inputContainer}>
                    <TextInput style={styles.input} value={technician} onChangeText={setTechnician} />
                  </View>
                </View>
                <View style={styles.fullWidthField}>
                  <Text style={styles.inputLabel}>{t('farmActivities.time', 'Time')}</Text>
                  <View style={styles.inputContainer}>
                    <TextInput style={styles.input} value={time} onChangeText={setTime} />
                  </View>
                </View>
              </>
            )}

            <View style={styles.fullWidthField}>
              <Text style={styles.inputLabel}>{t('farmActivities.notes', 'Remark')}</Text>
              <View style={styles.inputContainer}>
                <TextInput style={styles.input} value={remark} onChangeText={setRemark} placeholder="Notes" placeholderTextColor={theme.colors.textMuted}/>
              </View>
            </View>
          </View>

          {/* Edit Mode Only: Status Fields */}
          {isEditing && (
            <View style={styles.statusSection}>
              <Text style={styles.inputLabel}>{t('farmActivities.matingStatus', 'Mating Status')}</Text>
              <View style={styles.radioGroup}>
                {MATING_STATUSES.map(s => (
                  <TouchableOpacity key={s.value} style={styles.radioOption} onPress={() => setStatus(s.value)}>
                    <View style={[styles.radioCircle, { borderColor: status === s.value ? theme.colors.primary : theme.colors.border }]}>
                      {status === s.value && <View style={[styles.radioDot, { backgroundColor: theme.colors.primary }]} />}
                    </View>
                    <Text style={styles.radioLabel}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {status === 'PREGNANT' && (
                <View style={styles.fullWidthField}>
                  <Text style={styles.inputLabel}>{t('farmActivities.expectedDelivery', 'Expected Delivery Due Date*')}</Text>
                  <TouchableOpacity 
                    style={styles.dateButton}
                    onPress={() => setShowExpectedDatePicker(true)}
                  >
                    <Text style={styles.dateText}>{expectedDeliveryDate.toLocaleDateString()}</Text>
                    <Calendar size={16} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                  {showExpectedDatePicker && (
                    <DateTimePicker
                      value={expectedDeliveryDate}
                      mode="date"
                      display="default"
                      onChange={(e, d) => {
                        setShowExpectedDatePicker(false);
                        if (d) setExpectedDeliveryDate(d);
                      }}
                    />
                  )}
                </View>
              )}

              {status === 'MISCARRIAGE' && (
                <>
                  <View style={styles.fullWidthField}>
                    <Text style={styles.inputLabel}>{t('farmActivities.miscarriageDate', 'Miscarriage Date*')}</Text>
                    <TouchableOpacity 
                      style={styles.dateButton}
                      onPress={() => setShowMiscarriageDatePicker(true)}
                    >
                      <Text style={styles.dateText}>{miscarriageDate.toLocaleDateString()}</Text>
                      <Calendar size={16} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                    {showMiscarriageDatePicker && (
                      <DateTimePicker
                        value={miscarriageDate}
                        mode="date"
                        display="default"
                        onChange={(e, d) => {
                          setShowMiscarriageDatePicker(false);
                          if (d) setMiscarriageDate(d);
                        }}
                      />
                    )}
                  </View>
                  <View style={styles.fullWidthField}>
                    <Text style={styles.inputLabel}>{t('farmActivities.miscarriageReason', 'Miscarriage Reason')}</Text>
                    <View style={styles.inputContainer}>
                      <TextInput style={styles.input} value={miscarriageReason} onChangeText={setMiscarriageReason} />
                    </View>
                  </View>
                </>
              )}
            </View>
          )}

          {/* Heat/Estrus Helper Box */}
          <View style={styles.estrusBox}>
            <View style={styles.estrusHeader}>
              <Text style={styles.estrusTitle}>{t('farmActivities.heatEstrusDate', 'Heat/Estrus Detection Date')}</Text>
            </View>
            <View style={styles.estrusBody}>
              <View style={styles.estrusItem}>
                <Text style={styles.estrusDays}>{t('farmActivities.days21', '21 Days')}</Text>
                <Text style={styles.estrusDate}>{calculateDate(21)}</Text>
              </View>
              <View style={styles.estrusDivider} />
              <View style={styles.estrusItem}>
                <Text style={styles.estrusDays}>{t('farmActivities.days45', '45 Days')}</Text>
                <Text style={styles.estrusDate}>{calculateDate(45)}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: theme.colors.primary, opacity: isSaving ? 0.7 : 1 }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.saveButtonText}>{t('common.save', 'Save')}</Text>}
          </TouchableOpacity>
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
  fullWidthField: { marginBottom: 16 },
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
  
  // Status Edit Section
  statusSection: { marginTop: 10, marginBottom: 20, padding: 12, backgroundColor: theme.colors.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border },
  radioGroup: { marginBottom: 16, gap: 12 },
  radioOption: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radioCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  radioDot: { width: 8, height: 8, borderRadius: 4 },
  radioLabel: { fontSize: 14, fontFamily: 'Inter_500Medium', color: theme.colors.text },

  // Heat/Estrus Helper Box
  estrusBox: { 
    marginTop: 10, borderWidth: 1, borderColor: theme.colors.primary, 
    borderRadius: 8, overflow: 'hidden' 
  },
  estrusHeader: { backgroundColor: theme.colors.primary, padding: 8, alignItems: 'center' },
  estrusTitle: { color: '#FFF', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  estrusBody: { flexDirection: 'row', backgroundColor: theme.colors.surface, padding: 12 },
  estrusItem: { flex: 1, alignItems: 'center' },
  estrusDivider: { width: 1, backgroundColor: theme.colors.border },
  estrusDays: { fontSize: 12, color: theme.colors.textMuted, fontFamily: 'Inter_500Medium', marginBottom: 4 },
  estrusDate: { fontSize: 13, color: theme.colors.text, fontFamily: 'Inter_600SemiBold' },

  saveButton: { 
    height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center',
    marginTop: 24 
  },
  saveButtonText: { color: '#FFF', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});

export default AddMatingScreen;
