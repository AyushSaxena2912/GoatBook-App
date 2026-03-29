import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, SHADOW } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import GInput from '../components/GInput';
import GButton from '../components/GButton';
import GSelect from '../components/GSelect';
import GDatePicker from '../components/GDatePicker';
import { Plus, X, Search, CheckCircle2 } from 'lucide-react-native';
import api from '../api';
import { useFocusEffect } from '@react-navigation/native';

const AddVaccinationScreen = ({ navigation, route }) => {
  const { isDarkMode, theme } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const existingRecord = route.params?.record;
  const isEditing = !!existingRecord;
  const mode = route.params?.mode || (isEditing ? 'single' : 'single');
  const isMass = mode === 'mass';

  const [date, setDate] = useState(existingRecord?.date || new Date().toISOString().split('T')[0]);
  const [vaccineId, setVaccineId] = useState(existingRecord?.vaccineId || '');
  const [daysBetween, setDaysBetween] = useState('0');
  const [validTill, setValidTill] = useState(existingRecord?.validTill || '');
  const [remark, setRemark] = useState(existingRecord?.remark || '');
  const [tagInput, setTagInput] = useState('');
  const [selectedAnimals, setSelectedAnimals] = useState(existingRecord?.animal ? [existingRecord.animal] : []);
  
  // UI Data
  const [vaccines, setVaccines] = useState([]);
  const [allAnimals, setAllAnimals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searching, setSearching] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchVaccines();
      fetchAnimals();
      
      if (!isEditing && route.params?.preSelectedAnimal) {
        setSelectedAnimals([route.params.preSelectedAnimal]);
      }
    }, [route.params, isEditing])
  );

  // Auto-fill daysBetween from selected vaccine
  useEffect(() => {
    if (vaccineId) {
      const selected = vaccines.find(v => v.value === vaccineId);
      if (selected) {
        setDaysBetween(selected.daysBetween.toString());
        
        // Auto-calculate validTill if daysBetween > 0
        if (selected.daysBetween > 0) {
          const baseDate = new Date(date);
          baseDate.setDate(baseDate.getDate() + selected.daysBetween);
          setValidTill(baseDate.toISOString().split('T')[0]);
        }
      }
    }
  }, [vaccineId, date, vaccines]);

  const fetchVaccines = async () => {
    try {
      const response = await api.get('/vaccines');
      setVaccines(response.data.map(v => ({ 
        label: v.name, 
        value: v.id, 
        daysBetween: v.daysBetween 
      })));
    } catch (error) {
      console.error('Fetch vaccines error:', error);
    }
  };

  const fetchAnimals = async () => {
    try {
      const response = await api.get('/animals');
      setAllAnimals(response.data);
    } catch (error) {
      console.error('Fetch animals error:', error);
    }
  };

  const handleAddAnimalByTag = () => {
    if (!tagInput.trim()) return;
    
    setSearching(true);
    const animal = allAnimals.find(a => a.tagNumber === tagInput.trim());

    if (animal) {
      if (!selectedAnimals.find(a => a.id === animal.id)) {
        if (!isMass) {
          setSelectedAnimals([animal]); // single mode only one
        } else {
          setSelectedAnimals([...selectedAnimals, animal]);
        }
        setTagInput('');
      } else {
        Alert.alert('Duplicate!', 'Animal already added to the list.');
      }
    } else {
      Alert.alert('Not Found!', `No animal with tag ${tagInput} found.`);
    }
    setSearching(false);
  };

  const removeAnimal = (id) => {
    setSelectedAnimals(selectedAnimals.filter(a => a.id !== id));
  };

  const handleSave = async () => {
    let currentSelected = [...selectedAnimals];

    // AUTO-ADD: If user typed a tag but forgot to click 'ADD', try to find it now
    if (tagInput.trim() && currentSelected.length === 0) {
      const animal = allAnimals.find(a => a.tagNumber === tagInput.trim());
      if (animal) {
        currentSelected = [animal];
        setSelectedAnimals(currentSelected); // Update state for UI
      }
    }

    if (!vaccineId || currentSelected.length === 0 || !date) {
      Alert.alert('Error', isEditing ? 'Please leave at least one animal' : 'Please fill all required fields and select at least one animal');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await api.put(`/vaccines/records/${existingRecord.id}`, {
          date,
          validTill: validTill || null,
          remark
        });
      } else {
        await api.post('/vaccines/records', {
          vaccineId,
          animalIds: currentSelected.map(a => a.id),
          date,
          validTill: validTill || null,
          remark,
          creationMode: isMass ? 'MASS' : 'SINGLE'
        });
      }
      setLoading(false);
      Alert.alert('Success', isEditing ? 'Vaccination record updated' : 'Vaccination recorded successfully', [
        { text: 'OK', onPress: () => navigation.navigate('VaccinationList') }
      ]);
    } catch (error) {
      setLoading(false);
      const msg = error.response?.data?.message || 'Failed to save record';
      Alert.alert('Error', msg);
    }
  };

  const handleDelete = async () => {
    Alert.alert('Delete Record', 'Are you sure you want to remove this vaccination record?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: async () => {
          try {
            setDeleting(true);
            await api.delete(`/vaccines/records/${existingRecord.id}`);
            setDeleting(false);
            navigation.navigate('VaccinationList');
          } catch (error) {
            setDeleting(false);
            Alert.alert('Error', 'Failed to delete record');
          }
        }
      }
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader 
        title={isEditing ? "Edit Vaccination" : (isMass ? "Add Mass Vaccination" : "Add Vaccination")} 
        onBack={() => navigation.goBack()} 
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formCard}>
            <GDatePicker 
              label="Date*" 
              value={date} 
              onDateChange={setDate}
              required
            />

            <GSelect 
              label="Vaccine Name*" 
              value={vaccineId} 
              onSelect={setVaccineId}
              options={vaccines}
              placeholder="Select vaccine..."
              required
              disabled={isEditing}
            />

            <View style={styles.inlineStats}>
              <View style={styles.statBox}>
                <Text style={[styles.statLabel, { color: theme.colors.textLight }]}>Given Every</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{daysBetween}</Text>
                </View>
                <Text style={[styles.statSuffix, { color: theme.colors.textLight }]}>Days</Text>
              </View>
            </View>

            <GDatePicker 
              label="Vaccine valid till" 
              value={validTill} 
              onDateChange={setValidTill}
              placeholder="Auto-calculated if cyclic"
            />

            <GInput 
              label="Remark" 
              value={remark} 
              onChangeText={setRemark} 
              placeholder="Add notes..."
              multiline
              style={{ minHeight: 60, paddingTop: 10, color: theme.colors.text }}
            />

            {!isEditing && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  {isMass ? "Animals to Vaccinate" : "Select Animal"}
                </Text>

                <View style={styles.tagInputRow}>
                  <GInput 
                    containerStyle={styles.tagInputBox}
                    value={tagInput} 
                    onChangeText={setTagInput} 
                    placeholder="Scan or Enter Tag Id*"
                    keyboardType="default"
                  />
                  <TouchableOpacity 
                    style={[styles.addTagBtn, { backgroundColor: theme.colors.primary }]} 
                    onPress={handleAddAnimalByTag}
                    disabled={searching}
                  >
                    {searching ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.addTagBtnText}>ADD</Text>}
                  </TouchableOpacity>
                </View>

                {selectedAnimals.length > 0 && (
                  <View style={styles.selectedContainer}>
                    {selectedAnimals.map(animal => (
                      <View key={animal.id} style={styles.animalChip}>
                        <CheckCircle2 size={16} color={theme.colors.success} />
                        <Text style={styles.chipText}>{animal.tagNumber}</Text>
                        <TouchableOpacity onPress={() => removeAnimal(animal.id)}>
                          <X size={16} color={theme.colors.textLight} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}

            {isEditing && (
              <View style={styles.editInfoSection}>
                <Text style={[styles.editInfoLabel, { color: theme.colors.textLight }]}>Animal Tag</Text>
                <View style={styles.editInfoValue}>
                  <CheckCircle2 size={16} color={theme.colors.success} />
                  <Text style={[styles.editTagText, { color: theme.colors.text }]}>{existingRecord?.animal?.tagNumber}</Text>
                </View>
              </View>
            )}

            {isMass && selectedAnimals.length === 0 && (
              <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>No animals selected. Add animals by tag number or scan.</Text>
            )}
          </View>

          <View style={styles.footer}>
            {isEditing ? (
              <View style={styles.buttonRow}>
                <View style={styles.halfBtn}>
                  <GButton 
                    title="DELETE" 
                    variant="outline"
                    onPress={handleDelete} 
                    loading={deleting}
                    containerStyle={{ borderColor: theme.colors.error }}
                    titleStyle={{ color: theme.colors.error }}
                  />
                </View>
                <View style={styles.halfBtn}>
                  <GButton 
                    title="SAVE" 
                    onPress={handleSave} 
                    loading={loading}
                  />
                </View>
              </View>
            ) : (
              <GButton 
                title="SAVE RECORD" 
                onPress={handleSave} 
                loading={loading}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  formCard: {
    paddingBottom: SPACING.md,
  },
  inlineStats: {
    marginBottom: SPACING.md,
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    backgroundColor: isDarkMode ? '#1A1A1A' : '#F8FAFC',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statLabel: {
    fontSize: 14,
    marginRight: 8,
    fontFamily: 'Montserrat_600SemiBold',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: isDarkMode ? theme.colors.primary + '33' : '#F1F5F9',
  },
  badgeText: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    color: theme.colors.primary,
  },
  statSuffix: {
    fontSize: 14,
    marginLeft: 8,
    fontFamily: 'Montserrat_600SemiBold',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat_600SemiBold',
    marginVertical: SPACING.lg,
    letterSpacing: -0.5,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInputBox: {
    flex: 1,
    marginRight: 10,
    marginBottom: 0,
  },
  addTagBtn: {
    height: 56,
    paddingHorizontal: 24,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTagBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
  },
  selectedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.md,
  },
  animalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: isDarkMode ? '#1A1A1A' : '#F0F9FF',
    borderColor: isDarkMode ? theme.colors.primary + '66' : theme.colors.border,
  },
  chipText: {
    marginHorizontal: 8,
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: isDarkMode ? theme.colors.white : theme.colors.primary,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
    fontFamily: 'Montserrat_500Medium',
  },
  footer: {
    marginTop: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfBtn: {
    width: '48%',
  },
  editInfoSection: {
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: isDarkMode ? theme.colors.surface : '#F8FAFC',
    borderColor: theme.colors.border,
  },
  editInfoLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  editInfoValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editTagText: {
    fontSize: 22,
    fontFamily: 'Montserrat_600SemiBold',
    marginLeft: 10,
  },
});

export default AddVaccinationScreen;
