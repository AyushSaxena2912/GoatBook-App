import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Platform, Modal, KeyboardAvoidingView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import GButton from '../components/GButton';
import GSelect from '../components/GSelect';
import GInput from '../components/GInput';
import GDatePicker from '../components/GDatePicker';
import { Square, CheckSquare, Circle, CheckCircle2, Search, Users, Calendar } from 'lucide-react-native';
import { SPACING, SHADOW } from '../theme';
import api from '../api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MassVaccinationScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(theme, insets), [theme, insets]);
  
  // Data State
  const [vaccines, setVaccines] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Form State
  const [selectedVaccineId, setSelectedVaccineId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('ALL');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextDueDate, setNextDueDate] = useState('');
  const [remark, setRemark] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnimals, setSelectedAnimals] = useState(new Set());

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [vRes, aRes, lRes] = await Promise.all([
        api.get('/vaccines'),
        api.get('/animals'),
        api.get('/locations')
      ]);

      setVaccines(vRes.data.map(v => ({ 
        label: v.name, 
        value: v.id, 
        daysBetween: v.daysBetween,
        dose: v.doseMl,
        route: v.applicationRoute 
      })));
      
      setAnimals(aRes.data);
      
      const locOptions = [{ label: 'All Sheds', value: 'ALL' }];
      lRes.data.forEach(loc => {
        locOptions.push({ label: loc.name, value: loc.id });
      });
      setLocations(locOptions);
      
    } catch (error) {
      console.error('Fetch mass data error:', error);
      Alert.alert('Error', 'Failed to load farm data');
    } finally {
      setLoading(false);
    }
  };

  // Auto-calculate next due date
  useEffect(() => {
    if (selectedVaccineId && date) {
      const selected = vaccines.find(v => v.value === selectedVaccineId);
      if (selected && selected.daysBetween > 0) {
        const baseDate = new Date(date);
        baseDate.setDate(baseDate.getDate() + selected.daysBetween);
        setNextDueDate(baseDate.toISOString().split('T')[0]);
      } else {
        setNextDueDate('');
      }
    }
  }, [selectedVaccineId, date, vaccines]);

  const filteredAnimals = useMemo(() => {
    let result = animals;
    if (selectedLocationId !== 'ALL') {
      result = result.filter(a => a.location_id === selectedLocationId || a.locationId === selectedLocationId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a => 
        a.tagNumber?.toLowerCase().includes(q) || 
        (a.breeds?.name || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [animals, searchQuery, selectedLocationId]);

  const toggleAnimalSelection = (id) => {
    const newSelection = new Set(selectedAnimals);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedAnimals(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedAnimals.size === filteredAnimals.length) {
      setSelectedAnimals(new Set());
    } else {
      setSelectedAnimals(new Set(filteredAnimals.map(a => a.id)));
    }
  };

  const handleSubmit = async () => {
    if (selectedAnimals.size === 0) {
      Alert.alert('Validation', 'Please select at least one animal');
      return;
    }
    if (!selectedVaccineId) {
      Alert.alert('Validation', 'Please select a vaccine');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/vaccines/records', {
        vaccineId: selectedVaccineId,
        animalIds: Array.from(selectedAnimals),
        date: date,
        nextDueDate: nextDueDate || null,
        remark: remark,
        creationMode: 'MASS'
      });
      setSubmitting(false);
      setSuccessMessage(`Recorded vaccination for ${selectedAnimals.size} animals`);
      setShowSuccessModal(true);
    } catch (error) {
      setSubmitting(false);
      Alert.alert('Error', error.response?.data?.message || 'Failed to record mass vaccination');
    }
  };

  const handleSuccessDone = () => {
    setShowSuccessModal(false);
    navigation.goBack();
  };

  const renderAnimalItem = ({ item }) => {
    const isChecked = selectedAnimals.has(item.id);
    return (
      <TouchableOpacity 
        style={[styles.animalItem, { borderBottomColor: theme.colors.border + '30' }]} 
        onPress={() => toggleAnimalSelection(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.checkWrapper}>
          {isChecked ? (
            <CheckCircle2 color={theme.colors.primary} size={24} fill={theme.colors.primary + '20'} />
          ) : (
            <Circle color={theme.colors.textMuted} size={24} />
          )}
        </View>
        <View style={styles.animalInfo}>
          <View style={styles.infoTop}>
            <Text style={[styles.tagId, { color: theme.colors.text }]}>Tag ID: {item.tagNumber}</Text>
            <Text style={[styles.breedName, { color: theme.colors.textLight }]}>{item.breeds?.name || 'Sirohi'}</Text>
          </View>
          <View style={styles.infoBottom}>
            <Text style={[styles.metaText, { color: theme.colors.textLight }]}>{item.gender || 'Male'}</Text>
            <Text style={[styles.metaText, { color: theme.colors.primary, fontWeight: '600' }]}>
              {item.locations?.name || 'Unassigned'}
            </Text>
            <Text style={[styles.metaText, { color: theme.colors.textLight }]}>
              {item.currentWeight || item.birthWeight || 0}kg
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const isAllSelected = filteredAnimals.length > 0 && selectedAnimals.size === filteredAnimals.length;

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader title="Mass Vaccination" onBack={() => navigation.goBack()} leftAlign={true} />

      <View style={{ flex: 1 }}>
        <FlatList 
          data={filteredAnimals}
          renderItem={renderAnimalItem}
          keyExtractor={item => item.id}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.headerArea}>
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Vaccine Selection</Text>
                <GSelect 
                  label="Vaccine to Administer*" 
                  placeholder="Select from catalog"
                  value={selectedVaccineId}
                  onSelect={setSelectedVaccineId}
                  options={vaccines}
                  containerStyle={{ marginBottom: 20 }}
                />
                
                <View style={[styles.gridRow, { marginTop: 10 }]}>
                  <View style={{ flex: 1 }}>
                    <GSelect 
                      label="Filter by Shed" 
                      value={selectedLocationId}
                      onSelect={(id) => {
                        setSelectedLocationId(id);
                        setSelectedAnimals(new Set());
                      }}
                      options={locations}
                    />
                  </View>
                  <View style={{ width: 12 }} />
                  <View style={{ flex: 1 }}>
                    <GDatePicker label="Admin Date" value={date} onDateChange={setDate} />
                  </View>
                </View>

                <GDatePicker 
                  label="Booster Due (Optional)" 
                  value={nextDueDate} 
                  onDateChange={setNextDueDate} 
                  placeholder="Auto-calculated" 
                  containerStyle={{ marginTop: 12 }}
                />
              </View>

              <View style={[styles.listHeader, { borderBottomColor: theme.colors.border + '30' }]}>
                <View>
                  <Text style={styles.sectionTitle}>Target Animals</Text>
                  <Text style={[styles.listSub, { color: theme.colors.textLight }]}>{filteredAnimals.length} goats available</Text>
                </View>
                <TouchableOpacity 
                  style={styles.selectAllBtn} 
                  onPress={handleSelectAll}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.selectAllText, { color: isAllSelected ? theme.colors.primary : theme.colors.textMuted }]}>
                    {isAllSelected ? "Deselect" : "Select All"}
                  </Text>
                  {isAllSelected ? (
                    <CheckCircle2 color={theme.colors.primary} size={20} fill={theme.colors.primary + '20'} />
                  ) : (
                    <Square color={theme.colors.textMuted} size={20} />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.searchRow}>
                <GInput 
                  placeholder="Search Tag ID..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  containerStyle={{ marginVertical: 0 }}
                />
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Users size={48} color={theme.colors.textMuted + '40'} strokeWidth={1.5} />
              <Text style={[styles.emptyText, { color: theme.colors.textLight }]}>
                No animals found matching criteria.
              </Text>
            </View>
          }
        />
      </View>

      <Modal visible={showSuccessModal} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleSuccessDone}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Success</Text>
            <Text style={styles.modalMessage}>{successMessage}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={handleSuccessDone} style={styles.modalBtn}>
                <Text style={styles.modalOkText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <GInput 
            label="Operational Remark"
            placeholder="Additional notes..." 
            value={remark} 
            onChangeText={setRemark}
            containerStyle={{ marginBottom: 12 }}
          />
          <GButton 
            title={selectedAnimals.size > 0 ? `Vaccinate ${selectedAnimals.size} Animals` : 'Select Animals'}
            onPress={handleSubmit}
            loading={submitting}
            disabled={selectedAnimals.size === 0 || !selectedVaccineId}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const getStyles = (theme, insets) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerArea: {
    padding: SPACING.lg,
    paddingBottom: 0,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
    marginBottom: 16,
    paddingLeft: 4,
    color: theme.colors.primary,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  listSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
    paddingLeft: 4,
  },
  searchRow: {
    marginBottom: 16,
  },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary + '08',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  selectAllText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  listContent: {
    paddingBottom: 240, 
  },
  animalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
  },
  checkWrapper: {
    marginRight: 16,
  },
  animalInfo: {
    flex: 1,
  },
  infoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tagId: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  breedName: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  infoBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
  footer: {
    padding: SPACING.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...SHADOW.large,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 24,
    ...SHADOW.large,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: theme.colors.textLight,
    lineHeight: 22,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  modalOkText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#1A73E8',
    letterSpacing: 0.5,
  },
});

export default MassVaccinationScreen;
