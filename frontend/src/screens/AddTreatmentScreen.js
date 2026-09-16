import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { SPACING, SHADOW } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import GInput from '../components/GInput';
import GButton from '../components/GButton';
import GDatePicker from '../components/GDatePicker';
import GAlert from '../components/GAlert';
import { Search, X, CheckCircle2, Info } from 'lucide-react-native';
import api from '../api';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AddTreatmentScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => getStyles(theme, isDarkMode, insets), [theme, isDarkMode, insets]);

  const preSelectedAnimal = route.params?.preSelectedAnimal || null;
  const existingRecord = route.params?.record || null;
  const isEditing = !!existingRecord;

  const [tagNumber, setTagNumber] = useState(existingRecord?.animal?.tag_number || existingRecord?.animal?.tagNumber || preSelectedAnimal?.tag_number || preSelectedAnimal?.tagNumber || route.params?.tagNumber || '');
  const [animal, setAnimal] = useState(existingRecord?.animal || preSelectedAnimal || null);
  const [searching, setSearching] = useState(false);
  const [isNotFound, setIsNotFound] = useState(false);

  // Form Fields
  const [treatmentDate, setTreatmentDate] = useState(
    existingRecord?.date
      ? new Date(existingRecord.date).toISOString().split('T')[0]
      : existingRecord?.treatment_date
        ? new Date(existingRecord.treatment_date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
  );
  const [type, setType] = useState(existingRecord?.treatment_type || existingRecord?.disease_name || existingRecord?.type || '');
  const [medicineName, setMedicineName] = useState(existingRecord?.medicine_name || '');
  const [dosage, setDosage] = useState(existingRecord?.dosage || '');
  const [cost, setCost] = useState(existingRecord?.cost ? existingRecord.cost.toString() : '');
  const [remark, setRemark] = useState(existingRecord?.remark || '');

  // UI state
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleTagSearch = async (tagToSearch) => {
    const raw = (tagToSearch !== undefined ? tagToSearch : tagNumber || '').trim();
    if (!raw) {
      setAnimal(null);
      setIsNotFound(false);
      return;
    }
    const cleaned = raw.replace(/^#+/, '').trim();
    setSearching(true);
    setIsNotFound(false);
    try {
      let response;
      try {
        response = await api.get(`/animals/check-tag/${encodeURIComponent(cleaned)}`);
      } catch (e) {
        if (cleaned !== raw) {
          response = await api.get(`/animals/check-tag/${encodeURIComponent(raw)}`);
        } else {
          throw e;
        }
      }
      if (response && response.data && response.data.id) {
        setAnimal(response.data);
        setIsNotFound(false);
      } else {
        setAnimal(null);
        setIsNotFound(true);
      }
    } catch (error) {
      setAnimal(null);
      setIsNotFound(true);
    } finally {
      setSearching(false);
    }
  };

  const handleSave = async () => {
    const currentTag = tagNumber.trim() || animal?.tag_number || animal?.tagNumber;
    if (!animal && !currentTag) {
      Alert.alert('Validation', 'Please enter a valid animal Tag ID first.');
      return;
    }
    if (!treatmentDate) {
      Alert.alert('Validation', 'Please select a treatment date.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        animal_id: animal?.id || null,
        tag_number: currentTag || null,
        date: new Date(treatmentDate).toISOString(),
        treatment_type: type || 'General Treatment',
        disease_name: type || null,
        medicine_name: medicineName || null,
        dosage: dosage || null,
        cost: cost ? parseFloat(cost) : null,
        remark: remark || null,
      };

      if (isEditing) {
        await api.put(`/treatments/${existingRecord.id}`, payload);
        setSuccessMessage('Treatment record updated successfully');
      } else {
        await api.post('/treatments', payload);
        setSuccessMessage('Treatment record added successfully');
      }
      setSuccessVisible(true);
    } catch (error) {
      console.error('Save treatment error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save treatment record');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/treatments/${existingRecord.id}`);
      setDeleting(false);
      setShowDeleteModal(false);
      setSuccessMessage('Treatment record deleted');
      setSuccessVisible(true);
    } catch (error) {
      setDeleting(false);
      setShowDeleteModal(false);
      Alert.alert('Error', 'Failed to delete record');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader
        title={isEditing ? t('farmActivities.editTreatment', 'Edit Treatment') : t('farmActivities.addTreatment', 'Add Treatment')}
        onBack={() => navigation.goBack()}
        leftAlign={true}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          
          {/* Tag Search Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('farmActivities.identifyAnimal', 'Identify Animal*')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <GInput
                  label={t('farmActivities.scanEnterTagId', 'Scan/Enter Tag ID')}
                  value={tagNumber}
                  onChangeText={(text) => {
                    setTagNumber(text);
                    setIsNotFound(false);
                    if (!text.trim()) setAnimal(null);
                  }}
                  onSubmitEditing={() => handleTagSearch()}
                  returnKeyType="search"
                  placeholder="Enter Tag ID (e.g. BB11)"
                  disabled={isEditing || !!preSelectedAnimal}
                  editable={!isEditing && !preSelectedAnimal}
                  autoCapitalize="characters"
                  rightIcon={
                    tagNumber && !isEditing && !preSelectedAnimal ? (
                      <TouchableOpacity onPress={() => { setTagNumber(''); setAnimal(null); setIsNotFound(false); }} style={{ padding: 4 }}>
                        <X size={18} color={theme.colors.textMuted} />
                      </TouchableOpacity>
                    ) : null
                  }
                />
              </View>
              {!isEditing && !preSelectedAnimal && (
                <TouchableOpacity
                  style={[styles.searchBtn, { backgroundColor: theme.colors.primary, opacity: searching ? 0.7 : 1 }]}
                  onPress={() => handleTagSearch()}
                  disabled={searching}
                  activeOpacity={0.8}
                >
                  {searching ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Search size={16} color="#FFF" />
                      <Text style={styles.searchBtnText}>{t('common.search', 'Search')}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {isNotFound && (
              <View style={styles.notFoundContainer}>
                <Text style={styles.notFoundText}>Animal not found</Text>
              </View>
            )}

            {animal && (
              <View style={[styles.animalCard, { backgroundColor: theme.colors.primary + '08', borderColor: theme.colors.primary + '20' }]}>
                <View style={styles.animalCardHeader}>
                  <Text style={[styles.animalTitle, { color: theme.colors.primary }]}>#{animal.tag_number || animal.tagNumber}</Text>
                  {animal.breedName || animal.breed?.name ? (
                    <Text style={[styles.animalBreed, { color: theme.colors.textLight }]}>{animal.breedName || animal.breed?.name}</Text>
                  ) : null}
                </View>
                {animal.gender && (
                  <Text style={[styles.animalMeta, { color: theme.colors.textLight }]}>
                    Gender: {animal.gender}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Treatment Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('farmActivities.treatmentDetails', 'Treatment Details')}</Text>
            
            <GDatePicker
              label={t('farmActivities.treatmentDate', 'Treatment Date*')}
              value={treatmentDate}
              onDateChange={setTreatmentDate}
              containerStyle={{ marginBottom: 16 }}
            />

            <GInput
              label={t('farmActivities.diseaseType', 'Disease / Symptom / Type')}
              value={type}
              onChangeText={setType}
              placeholder="e.g. Fever, Foot Rot, Deworming"
              containerStyle={{ marginBottom: 16 }}
            />

            <GInput
              label={t('farmActivities.medicineName', 'Medicine Name')}
              value={medicineName}
              onChangeText={setMedicineName}
              placeholder="e.g. Paracetamol, Albendazole"
              containerStyle={{ marginBottom: 16 }}
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <GInput
                  label={t('farmActivities.dosage', 'Dosage')}
                  value={dosage}
                  onChangeText={setDosage}
                  placeholder="e.g. 5ml, 2 tablets"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <GInput
                  label={t('farmActivities.cost', 'Cost (₹)')}
                  value={cost}
                  onChangeText={setCost}
                  keyboardType="numeric"
                  placeholder="0.00"
                />
              </View>
            </View>

            <GInput
              label={t('farmActivities.remarks', 'Remarks / Vet Notes')}
              value={remark}
              onChangeText={setRemark}
              placeholder="Enter notes or doctor remarks"
              multiline
              numberOfLines={3}
              containerStyle={{ marginTop: 16 }}
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer Actions */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {isEditing ? (
          <View style={styles.footerColumn}>
            <GButton
              title={t('common.updateRecord', 'Update Treatment')}
              onPress={handleSave}
              loading={loading}
              containerStyle={{ marginBottom: 12 }}
            />
            <TouchableOpacity
              style={[styles.deleteOutlineBtn, { borderColor: theme.colors.error + '40' }]}
              onPress={() => setShowDeleteModal(true)}
              disabled={loading || deleting}
            >
              <Text style={[styles.deleteOutlineBtnText, { color: theme.colors.error }]}>{t('common.deleteRecord', 'Delete Record')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <GButton
            title={t('common.saveRecord', 'Save Treatment Record')}
            onPress={handleSave}
            loading={loading}
          />
        )}
      </View>

      {/* Delete Confirm Modal */}
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
              Are you sure you want to delete this treatment record permanently?
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

      <GAlert
        visible={successVisible}
        title="Success!"
        message={successMessage}
        type="success"
        confirmText="OK"
        onClose={() => {
          setSuccessVisible(false);
          navigation.goBack();
        }}
      />
    </View>
  );
};

const getStyles = (theme, isDarkMode, insets) =>
  StyleSheet.create({
    container: { flex: 1 },
    content: { padding: SPACING.lg, paddingBottom: 100 },
    section: { marginBottom: 24 },
    sectionTitle: {
      fontSize: 13,
      fontFamily: 'Inter_700Bold',
      letterSpacing: 0.5,
      marginBottom: 16,
      color: theme.colors.primary,
    },
    notFoundContainer: {
      padding: 12,
      backgroundColor: theme.colors.error + '10',
      borderColor: theme.colors.error,
      borderWidth: 1,
      borderRadius: 8,
      marginTop: 12,
      alignItems: 'center',
    },
    notFoundText: {
      color: theme.colors.error,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 14,
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
      marginBottom: 4,
    },
    animalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
    animalBreed: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
    animalMeta: { fontSize: 13, fontFamily: 'Inter_400Regular' },
    row: { flexDirection: 'row' },
    searchBtn: {
      height: 52,
      paddingHorizontal: 18,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    searchBtnText: {
      color: '#FFF',
      fontFamily: 'Inter_600SemiBold',
      fontSize: 14,
    },
    footer: {
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.md,
      backgroundColor: theme.colors.background,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      ...SHADOW.large,
    },
    footerColumn: { width: '100%' },
    deleteOutlineBtn: {
      height: 50,
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
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
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
    modalBtn: { paddingVertical: 8, paddingHorizontal: 4 },
    modalCancelText: {
      fontSize: 14,
      fontFamily: 'Inter_700Bold',
      color: '#1A73E8',
    },
    modalDeleteText: {
      fontSize: 14,
      fontFamily: 'Inter_700Bold',
      color: theme.colors.error,
    },
  });

export default AddTreatmentScreen;
