import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { COLORS, SPACING, SHADOW } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import GInput from '../components/GInput';
import GButton from '../components/GButton';
import GSelect from '../components/GSelect';
import GDatePicker from '../components/GDatePicker';
import { Scan, X, Search, CheckCircle2, Info, Calendar } from 'lucide-react-native';
import api from '../api';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AddVaccinationScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(theme, insets), [theme, insets]);
  
  const existingRecord = route.params?.record;
  const isEditing = !!existingRecord;

  // Form State
  const [date, setDate] = useState(existingRecord?.date ? new Date(existingRecord.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [vaccineId, setVaccineId] = useState(existingRecord?.vaccineId || '');
  const [nextDueDate, setNextDueDate] = useState(existingRecord?.nextDueDate ? new Date(existingRecord.nextDueDate).toISOString().split('T')[0] : '');
  const [remark, setRemark] = useState(existingRecord?.remark || '');
  const [tagNumber, setTagNumber] = useState('');
  const [animal, setAnimal] = useState(existingRecord?.animal || null);
  
  // UI Data
  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleting, setDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchVaccines();
    }, [])
  );

  // Auto-calculate next due date
  useEffect(() => {
    if (vaccineId && date) {
      const selected = vaccines.find(v => v.value === vaccineId);
      if (selected && selected.daysBetween > 0) {
        const baseDate = new Date(date);
        baseDate.setDate(baseDate.getDate() + selected.daysBetween);
        setNextDueDate(baseDate.toISOString().split('T')[0]);
      } else {
        setNextDueDate('');
      }
    }
  }, [vaccineId, date, vaccines]);

  const fetchVaccines = async () => {
    try {
      const response = await api.get('/vaccines');
      setVaccines(response.data.map(v => ({ 
        label: v.name, 
        value: v.id, 
        daysBetween: v.daysBetween,
        dose: v.doseMl,
        route: v.applicationRoute
      })));
    } catch (error) {
      console.error('Fetch vaccines error:', error);
    }
  };

  const handleSearchAnimal = async () => {
    if (!tagNumber.trim()) return;
    setSearching(true);
    try {
      const response = await api.get(`/animals/check-tag/${tagNumber.trim()}`);
      setAnimal(response.data);
    } catch (error) {
      Alert.alert('Not Found', 'No animal found with this Tag ID');
      setAnimal(null);
    } finally {
      setSearching(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/vaccines/records/${existingRecord.id}`);
      setDeleting(false);
      setShowDeleteModal(false);
      setSuccessMessage('Vaccination record deleted');
      setShowSuccessModal(true);
    } catch (error) {
      setDeleting(false);
      setShowDeleteModal(false);
      Alert.alert('Error', 'Failed to delete record');
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleSave = async () => {
    if (!animal || !vaccineId || !date) {
      Alert.alert('Validation', 'Please select an animal, vaccine, and date');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await api.put(`/vaccines/records/${existingRecord.id}`, {
          date,
          nextDueDate: nextDueDate || null,
          remark
        });
      } else {
        await api.post('/vaccines/records', {
          vaccineId,
          animalIds: [animal.id],
          date,
          nextDueDate: nextDueDate || null,
          remark,
          creationMode: 'SINGLE'
        });
      }
      setLoading(false);
      setSuccessMessage(isEditing ? 'Success! Record updated' : 'Success! Vaccination recorded');
      setShowSuccessModal(true);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save record');
    }
  };

  const handleSuccessDone = () => {
    setShowSuccessModal(false);
    navigation.goBack();
  };

  const selectedVaccine = vaccines.find(v => v.value === vaccineId);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader 
        title={isEditing ? "Edit Record" : "Add Vaccination"} 
        onBack={() => navigation.goBack()} 
        leftAlign={true}
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={{ flex: 1 }}>
          <ScrollView 
            contentContainerStyle={styles.content} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Identify Animal</Text>
              <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                  <GInput 
                    label="Scan/Enter Tag ID" 
                    value={tagNumber} 
                    onChangeText={setTagNumber}
                    rightIcon={tagNumber ? (
                      <TouchableOpacity onPress={() => {setTagNumber(''); setAnimal(null);}}>
                        <X size={18} color={theme.colors.textMuted} />
                      </TouchableOpacity>
                    ) : null}
                    disabled={isEditing}
                    editable={!isEditing}
                  />
                </View>
                {!isEditing && (
                  <TouchableOpacity 
                    style={[styles.findBtn, { backgroundColor: theme.colors.primary }]}
                    onPress={handleSearchAnimal}
                    disabled={searching}
                  >
                    {searching ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.findBtnText}>Find</Text>}
                  </TouchableOpacity>
                )}
              </View>

              {animal && (
                <View style={[styles.animalCard, { backgroundColor: theme.colors.primary + '08', borderColor: theme.colors.primary + '20' }]}>
                  <View style={styles.animalCardHeader}>
                    <Text style={[styles.animalTitle, { color: theme.colors.primary }]}>#{animal.tagNumber}</Text>
                    <Text style={[styles.animalBreed, { color: theme.colors.textLight }]}>{animal.breedName}</Text>
                  </View>
                  <Text style={[styles.animalMeta, { color: theme.colors.textLight }]}>
                    {animal.gender} • {animal.ageInMonths} Months • Current: {animal.currentLocationName}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Administration Details</Text>
              <GDatePicker 
                label="Vaccination Date*" 
                value={date} 
                onDateChange={setDate}
                containerStyle={{ marginBottom: 16 }}
              />
              
              <GSelect 
                label="Select Vaccine*" 
                value={vaccineId} 
                onSelect={setVaccineId}
                options={vaccines}
                placeholder="Choose from Catalog"
                disabled={isEditing}
              />

              {selectedVaccine && (
                <View style={[styles.detailsBox, { borderColor: theme.colors.border + '30' }]}>
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textLight }]}>Dose</Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>{selectedVaccine.dose || 0} ml</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textLight }]}>Route</Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>{selectedVaccine.route || 'N/A'}</Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Next Appointment</Text>
              <GDatePicker 
                label="Next Due Date" 
                value={nextDueDate} 
                onDateChange={setNextDueDate}
                placeholder="Auto-calculated"
              />
              <View style={[styles.infoBox, { backgroundColor: theme.colors.primary + '08', borderColor: theme.colors.primary + '20' }]}>
                <Info size={16} color={theme.colors.primary} />
                <Text style={[styles.infoText, { color: theme.colors.textLight }]}>
                  Setting a due date will trigger a notification {selectedVaccine?.daysBetween || ''} days after this administration.
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <GInput 
                label="Remarks (Optional)" 
                value={remark} 
                onChangeText={setRemark} 
                placeholder="Condition of animal, lot number, etc."
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={{ height: 120 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowDeleteModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Record</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to remove this vaccination record permanently? This action cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowDeleteModal(false)} style={styles.modalBtn}>
                <Text style={styles.modalCancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDelete} style={styles.modalBtn} disabled={deleting}>
                {deleting ? (
                  <ActivityIndicator size="small" color={theme.colors.error} />
                ) : (
                  <Text style={styles.modalDeleteText}>DELETE</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleSuccessDone}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={handleSuccessDone}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Success</Text>
            <Text style={styles.modalMessage}>{successMessage}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={handleSuccessDone} style={styles.modalBtn}>
                <Text style={styles.modalCancelText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Fixed Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {isEditing ? (
          <View style={styles.footerColumn}>
            <GButton 
              title="Update Record" 
              onPress={handleSave} 
              loading={loading}
              containerStyle={{ marginBottom: 12 }}
            />
            <TouchableOpacity 
              style={[styles.deleteOutlineBtn, { borderColor: theme.colors.error + '30' }]}
              onPress={handleDelete}
              disabled={loading || deleting}
            >
              <Text style={[styles.deleteOutlineBtnText, { color: theme.colors.error }]}>Delete Record</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <GButton 
            title="Save Vaccination" 
            onPress={handleSave} 
            loading={loading}
          />
        )}
      </View>
    </View>
  );
};

const getStyles = (theme, insets) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: 100,
  },
  section: {
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  findBtn: {
    height: 56,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  findBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  animalCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.2,
    borderStyle: 'dashed',
  },
  animalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  animalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  animalBreed: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  animalMeta: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  detailsBox: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  infoBox: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 14,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...SHADOW.large,
  },
  footerColumn: {
    width: '100%',
  },
  deleteOutlineBtn: {
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
    marginBottom: 8,
  },
  deleteOutlineBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
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
    gap: 20,
  },
  modalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  modalCancelText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#1A73E8',
    letterSpacing: 0.5,
  },
  modalDeleteText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#1A73E8',
    letterSpacing: 0.5,
  },
});

export default AddVaccinationScreen;
