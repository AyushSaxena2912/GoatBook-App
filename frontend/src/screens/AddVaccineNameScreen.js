import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import { COLORS, SPACING, SHADOW } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import GInput from '../components/GInput';
import GButton from '../components/GButton';
import GSelect from '../components/GSelect';
import api from '../api';
import { useFocusEffect } from '@react-navigation/native';
import { Syringe, Activity, Microscope, Info, ChevronDown } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AddVaccineNameScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(theme, insets), [theme, insets]);
  
  const editingVaccine = route.params?.vaccine;
  const isEditing = !!editingVaccine;
  
  // Form State
  const [name, setName] = useState(editingVaccine?.name || '');
  const [diseaseName, setDiseaseName] = useState(editingVaccine?.diseaseName || '');
  const [doseMl, setDoseMl] = useState(editingVaccine?.doseMl?.toString() || '');
  const [appRoute, setAppRoute] = useState(editingVaccine?.applicationRoute || 'Sub Cut S/c');
  
  // Calculate frequency based on daysBetween
  const getInitialFrequency = () => {
    if (!editingVaccine?.daysBetween) return { val: '', unit: 'Months' };
    const days = editingVaccine.daysBetween;
    if (days % 365 === 0) return { val: (days / 365).toString(), unit: 'Years' };
    if (days % 30 === 0) return { val: (days / 30).toString(), unit: 'Months' };
    return { val: days.toString(), unit: 'Days' };
  };

  const initialFreq = getInitialFrequency();
  const [frequencyValue, setFrequencyValue] = useState(initialFreq.val);
  const [frequencyUnit, setFrequencyUnit] = useState(initialFreq.unit);
  const [remark, setRemark] = useState(editingVaccine?.remark || '');
  
  const [loading, setLoading] = useState(false);
  const [vaccines, setVaccines] = useState([]);
  const [vaccinesLoading, setVaccinesLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleting, setDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchVaccines();
    }, [])
  );

  const fetchVaccines = async () => {
    try {
      setVaccinesLoading(true);
      const response = await api.get('/vaccines');
      setVaccines(response.data);
      setVaccinesLoading(false);
    } catch (error) {
      console.error('Fetch vaccines error:', error);
      setVaccinesLoading(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/vaccines/${editingVaccine.id}`);
      setDeleting(false);
      setShowDeleteModal(false);
      navigation.goBack();
    } catch (error) {
      setDeleting(false);
      setShowDeleteModal(false);
      const msg = error.response?.data?.message || 'Failed to delete vaccine';
      Alert.alert('Error', msg);
    }
  };

  const handleDelete = () => {
    if (editingVaccine.isDefault) {
      Alert.alert(
        'Protected Record',
        'This is a system default vaccine and cannot be deleted.',
        [{ text: 'OK' }]
      );
      return;
    }
    setShowDeleteModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Vaccine name is required');
      return;
    }

    let days = 0;
    const val = parseInt(frequencyValue);
    if (val > 0) {
      if (frequencyUnit === 'Days') days = val;
      else if (frequencyUnit === 'Months') days = val * 30;
      else if (frequencyUnit === 'Years') days = val * 365;
    }

    setLoading(true);
    try {
      const payload = {
        name,
        diseaseName,
        doseMl: doseMl ? parseFloat(doseMl) : null,
        applicationRoute: appRoute,
        daysBetween: days,
        remark
      };

      if (isEditing) {
        await api.put(`/vaccines/${editingVaccine.id}`, payload);
      } else {
        await api.post('/vaccines', payload);
      }
      
      setLoading(false);
      setSuccessMessage(isEditing ? 'Vaccine updated successfully' : 'Vaccine added to your catalog');
      setShowSuccessModal(true);
      
      if (!isEditing) {
        setName('');
        setDiseaseName('');
        setDoseMl('');
        setFrequencyValue('');
        setRemark('');
        fetchVaccines();
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save vaccine');
    }
  };

  const handleSuccessDone = () => {
    setShowSuccessModal(false);
    if (isEditing) {
      navigation.goBack();
    }
  };

  const routeOptions = [
    { label: 'Sub Cut S/c (Skin)', value: 'Sub Cut S/c' },
    { label: 'Intra Muscular I/M (Muscle)', value: 'Intra Muscular I/M' },
    { label: 'Oral (Mouth)', value: 'Oral' },
    { label: 'Intranasal (Nose)', value: 'Intranasal' },
  ];

  const unitOptions = [
    { label: 'Days', value: 'Days' },
    { label: 'Months', value: 'Months' },
    { label: 'Years', value: 'Years' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader title={isEditing ? "Edit Vaccine" : "Vaccine Catalog"} onBack={() => navigation.goBack()} leftAlign={true} />
      
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
              <Text style={styles.sectionTitle}>Basic Information</Text>
              <GInput 
                label="Vaccine Name*" 
                value={name} 
                onChangeText={setName} 
                placeholder="e.g. PPR, ET, FMD"
                containerStyle={{ marginBottom: 16 }}
              />
              <GInput 
                label="Name of Disease" 
                value={diseaseName} 
                onChangeText={setDiseaseName} 
                placeholder="Target disease"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dosage & Route</Text>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <GInput 
                    label="Dose (ml)" 
                    value={doseMl} 
                    onChangeText={setDoseMl} 
                    placeholder="e.g. 1.0"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={{ width: 16 }} />
                <View style={{ flex: 1.5 }}>
                  <GSelect 
                    label="App. Route" 
                    value={appRoute}
                    onSelect={setAppRoute}
                    options={routeOptions}
                    placeholder="Select Route"
                  />
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Booster Frequency</Text>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <GInput 
                    label="Given Every" 
                    value={frequencyValue} 
                    onChangeText={setFrequencyValue} 
                    placeholder="0"
                    keyboardType="number-pad"
                  />
                </View>
                <View style={{ width: 16 }} />
                <View style={{ flex: 1 }}>
                  <GSelect 
                    label="Unit" 
                    value={frequencyUnit}
                    onSelect={setFrequencyUnit}
                    options={unitOptions}
                  />
                </View>
              </View>
              <View style={[styles.infoBox, { backgroundColor: theme.colors.primary + '08', borderColor: theme.colors.primary + '20' }]}>
                <Info size={16} color={theme.colors.primary} />
                <Text style={[styles.infoText, { color: theme.colors.textLight }]}>
                  Set frequency to <Text style={{ fontWeight: 'bold' }}>0</Text> for one-time vaccinations. This interval helps calculate next due dates automatically.
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <GInput 
                label="Remark" 
                value={remark} 
                onChangeText={setRemark} 
                placeholder="Additional notes..."
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={{ height: 120 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Delete Confirmation Modal */}
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
            <Text style={styles.modalTitle}>Delete Vaccine</Text>
            <Text style={styles.modalMessage}>
              This will permanently remove this vaccine AND all vaccination journal entries that used it. This action cannot be undone.
              {"\n\n"}Are you sure?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowDeleteModal(false)} style={styles.modalBtn}>
                <Text style={styles.cancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDelete} style={styles.modalBtn} disabled={deleting}>
                {deleting ? (
                  <ActivityIndicator size="small" color={theme.colors.error} />
                ) : (
                  <Text style={styles.deleteText}>DELETE PERMANENTLY</Text>
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
                <Text style={styles.cancelText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Fixed Footer - Outside KeyboardAvoidingView */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {isEditing ? (
          <View style={styles.footerColumn}>
            <GButton 
              title="Update Vaccine" 
              onPress={handleSave} 
              loading={loading}
              containerStyle={{ marginBottom: 12 }}
            />
            {!editingVaccine.isDefault && (
              <TouchableOpacity 
                style={[styles.libDeleteBtn, { borderColor: theme.colors.error + '30' }]}
                onPress={handleDelete}
                disabled={loading || deleting}
              >
                <Text style={[styles.libDeleteBtnText, { color: theme.colors.error }]}>Delete from Catalog</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <GButton 
            title="Save to Catalog" 
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
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  libDeleteBtn: {
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
    marginBottom: 8,
  },
  libDeleteBtnText: {
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
  cancelText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#1A73E8',
    letterSpacing: 0.5,
  },
  deleteText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#1A73E8',
    letterSpacing: 0.5,
  },
});

export default AddVaccineNameScreen;
