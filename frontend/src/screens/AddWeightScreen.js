import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, Platform, Alert, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { COLORS, SPACING, SHADOW } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import GInput from '../components/GInput';
import GButton from '../components/GButton';
import GDatePicker from '../components/GDatePicker';
import { Scan, Info } from 'lucide-react-native';
import api from '../api';
import { useFocusEffect } from '@react-navigation/native';
import GAlert from '../components/GAlert';

const AddWeightScreen = ({ route, navigation }) => {
  const { isDarkMode, theme } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const existingRecord = route.params?.record;
  const isEditing = !!existingRecord;

  const initialTag = route.params?.tagNumber || '';
  const [tagNumber, setTagNumber] = useState(initialTag);
  const [weight, setWeight] = useState(existingRecord?.weight?.toString() || '');
  const [height, setHeight] = useState(existingRecord?.height?.toString() || '');
  const [date, setDate] = useState(existingRecord?.date ? new Date(existingRecord.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [remark, setRemark] = useState(existingRecord?.remark || '');
  const [animalInfo, setAnimalInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingAnimal, setFetchingAnimal] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (initialTag) {
      fetchAnimalDetails(initialTag);
    }
  }, [initialTag]);

  const fetchAnimalDetails = async (tag) => {
    if (!tag) return;
    try {
      setFetchingAnimal(true);
      const response = await api.get(`/animals?tagNumber=${tag}`);
      if (response.data && response.data.length > 0) {
        setAnimalInfo(response.data[0]);
      } else {
        setAnimalInfo(null);
      }
    } catch (error) {
      console.error('Fetch animal details error:', error);
      setAnimalInfo(null);
    } finally {
      setFetchingAnimal(false);
    }
  };

  const handleTagChange = (text) => {
    setTagNumber(text);
    if (text.length >= 3) {
      fetchAnimalDetails(text);
    } else {
      setAnimalInfo(null);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/weights/${existingRecord.id}`);
      setDeleting(false);
      setShowDeleteModal(false);
      setSuccessMessage('Weight record deleted successfully');
      setSuccessVisible(true);
    } catch (error) {
      setDeleting(false);
      setShowDeleteModal(false);
      Alert.alert('Error', 'Failed to delete record');
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleSubmit = async () => {
    if ((!tagNumber && !isEditing) || !weight) {
      Alert.alert('Required', 'Please enter both Tag ID and Weight');
      return;
    }

    try {
      setLoading(true);
      
      if (isEditing) {
        await api.put(`/weights/${existingRecord.id}`, {
          weight: parseFloat(weight),
          height: height ? parseFloat(height) : null,
          date,
          remark
        });
        setSuccessMessage('Weight record updated successfully');
        setSuccessVisible(true);
      } else {
        // Explicit validation check to ensure tag exists
        const checkRes = await api.get(`/animals?tagNumber=${tagNumber}`);
        if (!checkRes.data || checkRes.data.length === 0) {
          Alert.alert('Invalid Tag ID', 'The scanned Tag ID does not exist in our system. Please check and try again.');
          setLoading(false);
          return;
        }

        await api.post('/weights', {
          tagNumber,
          weight: parseFloat(weight),
          height: height ? parseFloat(height) : null,
          date,
          remark
        });
        setSuccessMessage(`Weight record for Tag ${tagNumber} has been saved successfully.`);
        setSuccessVisible(true);
      }
    } catch (error) {
      console.error('Add/Edit weight error:', error);
      const msg = error.response?.data?.message || 'Failed to save weight record';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader 
        title={isEditing ? "Edit Weight" : "Add Weight"} 
        onBack={() => navigation.goBack()} 
        leftAlign={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <GInput 
                label="Tag ID" 
                value={tagNumber} 
                onChangeText={handleTagChange} 
                placeholder="2912"
                required
                disabled={isEditing}
                editable={!isEditing}
              />
            </View>
          </View>

          {fetchingAnimal && (
            <View style={styles.infoBox}>
              <Text style={[styles.infoText, { color: theme.colors.textMuted }]}>Fetching animal details...</Text>
            </View>
          )}

          {animalInfo && (
            <View style={styles.animalDetailCard}>
               <View style={styles.detailRow}>
                <Info size={16} color={theme.colors.primary} />
                <Text style={[styles.detailLabel, { color: theme.colors.textLight }]}>Breed: </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>{animalInfo.breed?.name || animalInfo.Breed?.name}</Text>
              </View>
              <View style={styles.detailRow}>
                <Info size={16} color={theme.colors.primary} />
                <Text style={[styles.detailLabel, { color: theme.colors.textLight }]}>Gender: </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>{animalInfo.gender}</Text>
              </View>
            </View>
          )}

          <View style={styles.row}>
            <GDatePicker 
              label="Date" 
              value={date} 
              onDateChange={setDate}
              placeholder="09-09-2025"
              required
            />
          </View>

          <View style={styles.row}>
            <GInput 
              label="Weight" 
              value={weight} 
              onChangeText={setWeight} 
              keyboardType="decimal-pad"
              placeholder="55"
              required
            />
          </View>

          <View style={styles.row}>
            <GInput 
              label="Height" 
              value={height} 
              onChangeText={setHeight} 
              keyboardType="decimal-pad"
              placeholder="5"
            />
          </View>

          <View style={styles.row}>
            <GInput 
              label="Remark" 
              value={remark} 
              onChangeText={setRemark} 
              placeholder="New!"
              multiline
              numberOfLines={3}
              style={{ color: theme.colors.text }}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {isEditing ? (
          <View style={{ width: '100%' }}>
            <GButton 
              title="Update Record" 
              onPress={handleSubmit} 
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
            title="Submit Record" 
            onPress={handleSubmit} 
            loading={loading}
          />
        )}
      </View>

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
              Are you sure you want to remove this weight record permanently? This action cannot be undone.
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
        confirmText="Excellent"
        onClose={() => {
          setSuccessVisible(false);
          navigation.goBack();
        }}
      />
    </View>
  );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 20,
  },
  formCard: {
    paddingBottom: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  flex: {
    flex: 1,
  },
  infoBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#1A1A1A' : '#F8FAFC',
  },
  infoText: {
    fontSize: 14,
    fontFamily: theme.typography.regular,
  },
  animalDetailCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: theme.typography.medium,
    marginLeft: 10,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: theme.typography.semiBold,
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    paddingBottom: Platform.OS === 'ios' ? 30 : SPACING.lg,
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
    fontFamily: theme.typography.semiBold,
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
    fontFamily: theme.typography.bold,
    color: theme.colors.text,
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 15,
    fontFamily: theme.typography.regular,
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
    fontFamily: theme.typography.bold,
    color: '#1A73E8',
    letterSpacing: 0.5,
  },
  modalDeleteText: {
    fontSize: 14,
    fontFamily: theme.typography.bold,
    color: theme.colors.error,
    letterSpacing: 0.5,
  },
});
export default AddWeightScreen;
