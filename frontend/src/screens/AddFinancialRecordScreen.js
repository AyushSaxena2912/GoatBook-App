import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, KeyboardAvoidingView, Platform, Alert, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import GInput from '../components/GInput';
import GButton from '../components/GButton';
import GSelect from '../components/GSelect';
import api from '../api';
import { Camera, ImageIcon, Trash2, X, Calendar } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadToCloudinary as cloudinaryUpload } from '../utils/cloudinary';
import DateTimePicker from '@react-native-community/datetimepicker';

const AddFinancialRecordScreen = ({ navigation, route }) => {
  const { isDarkMode, theme } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const isEditing = !!route.params?.record;
  const existingRecord = route.params?.record;

  const [date, setDate] = useState(isEditing ? new Date(existingRecord.date) : new Date());
  const [category, setCategory] = useState(isEditing ? existingRecord.category : '');
  const [type, setType] = useState(isEditing ? existingRecord.type : 'EXPENSE'); // 'INCOME' or 'EXPENSE'
  const [amount, setAmount] = useState(isEditing ? parseFloat(existingRecord.amount).toString() : '');
  const [description, setDescription] = useState(isEditing ? existingRecord.description || '' : '');
  const [receiptPhoto, setReceiptPhoto] = useState(isEditing ? existingRecord.receipt_url || null : null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);

  const categories = [
    { label: 'Electricity', value: 'Electricity' },
    { label: 'Farm Tools', value: 'Farm Tools' },
    { label: 'Feed', value: 'Feed' },
    { label: 'Health Supplement', value: 'Health Supplement' },
    { label: 'Insurance', value: 'Insurance' },
    { label: 'Internet', value: 'Internet' },
    { label: 'Maintenance', value: 'Maintenance' },
    { label: 'Meat', value: 'Meat' },
    { label: 'Milk', value: 'Milk' },
    { label: 'Rent', value: 'Rent' },
    { label: 'Salary', value: 'Salary' },
    { label: 'Service', value: 'Service' },
    { label: 'Software/Hardware', value: 'Software/Hardware' },
    { label: 'Transportation', value: 'Transportation' },
    { label: 'Water Bill', value: 'Water Bill' },
    { label: 'Others', value: 'Others' },
  ];

  const pickImage = async () => {
    setShowImagePicker(false);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setReceiptPhoto(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    setShowImagePicker(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera permissions to make this work!');
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setReceiptPhoto(result.assets[0].uri);
    }
  };

  const uploadToCloudinary = async (imageUri) => {
    if (!imageUri || imageUri.startsWith('http')) return imageUri;
    try {
      setUploading(true);
      const uploadedImageUrl = await cloudinaryUpload(imageUri);
      setUploading(false);
      return uploadedImageUrl;
    } catch (error) {
      setUploading(false);
      console.error('Upload error:', error);
      Alert.alert('Upload Error', 'Failed to upload receipt photo.');
      throw error;
    }
  };

  const handleSave = async () => {
    if (!category || !amount || isNaN(parseFloat(amount))) {
      Alert.alert('Validation Error', 'Please select a category and enter a valid numeric amount.');
      return;
    }

    setLoading(true);
    try {
      let receiptUrl = receiptPhoto;
      if (receiptPhoto && !receiptPhoto.startsWith('http')) {
        receiptUrl = await uploadToCloudinary(receiptPhoto);
      }

      const payload = {
        date: date.toISOString(),
        category,
        type,
        amount: parseFloat(amount),
        description: description || null,
        receipt_url: receiptUrl,
      };

      if (isEditing) {
        await api.put(`/finances/${existingRecord.id}`, payload);
        Alert.alert('Success', 'Record updated successfully');
      } else {
        await api.post('/finances', payload);
        Alert.alert('Success', 'Record created successfully');
      }
      setLoading(false);
      navigation.goBack();
    } catch (error) {
      setLoading(false);
      console.error('Error saving transaction record:', error);
      Alert.alert('Error', 'Failed to save transaction record.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader 
        title={isEditing ? 'Edit Record' : 'Add Record'} 
        onBack={() => navigation.goBack()} 
        leftAlign
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Date Selector */}
          <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
            <Calendar size={18} color={theme.colors.textLight} />
            <View style={styles.dateLabelContainer}>
              <Text style={styles.dateLabel}>Date*</Text>
              <Text style={[styles.dateVal, { color: theme.colors.text }]}>{date.toLocaleDateString()}</Text>
            </View>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}

          <View style={styles.gap} />

          {/* Category Dropdown */}
          <GSelect 
            label="Select Category*" 
            value={category} 
            onSelect={setCategory}
            options={categories}
            required
          />

          <View style={styles.gap} />

          {/* Transaction Type Radio Buttons */}
          <Text style={styles.fieldLabel}>Transaction Type*</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity style={styles.radioOption} onPress={() => setType('INCOME')}>
              <View style={[styles.radio, type === 'INCOME' && styles.radioActive]}>
                {type === 'INCOME' && <View style={styles.radioInner} />}
              </View>
              <Text style={[styles.radioLabel, { color: theme.colors.text }]}>Income</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.radioOption} onPress={() => setType('EXPENSE')}>
              <View style={[styles.radio, type === 'EXPENSE' && styles.radioActive]}>
                {type === 'EXPENSE' && <View style={styles.radioInner} />}
              </View>
              <Text style={[styles.radioLabel, { color: theme.colors.text }]}>Expense</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.gap} />

          {/* Amount input */}
          <GInput 
            label="Amount*" 
            value={amount} 
            onChangeText={setAmount} 
            placeholder="e.g. 500"
            keyboardType="numeric"
            required 
          />

          <View style={styles.gap} />

          {/* Description input */}
          <GInput 
            label="Remark/Description" 
            value={description} 
            onChangeText={setDescription} 
            placeholder="Describe the transaction..."
          />

          <View style={styles.gap} />

          {/* Receipt Image Upload */}
          <Text style={styles.fieldLabel}>Upload Document/Take Photo</Text>
          <TouchableOpacity 
            style={[styles.uploadBox, { borderColor: theme.colors.border }]} 
            onPress={() => setShowImagePicker(true)}
          >
            {receiptPhoto ? (
              <Image source={{ uri: receiptPhoto }} style={styles.receiptImage} />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Camera size={24} color={theme.colors.textLight} />
                <Text style={styles.uploadPlaceholderText}>Upload Document/Take Photo</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Save Button */}
      <View style={[styles.footer, { paddingBottom: Platform.OS === 'ios' ? 34 : 24 }]}>
        <GButton 
          title={uploading ? 'Uploading receipt...' : (isEditing ? 'Save Changes' : 'SAVE')} 
          onPress={handleSave}
          loading={loading}
          disabled={uploading}
        />
      </View>

      {/* Image Picker Modal */}
      <Modal visible={showImagePicker} transparent={true} animationType="fade" onRequestClose={() => setShowImagePicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowImagePicker(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Upload Document</Text>
              <TouchableOpacity onPress={() => setShowImagePicker(false)}>
                <X size={24} color={theme.colors.textLight} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalOptions}>
              <TouchableOpacity style={styles.modalOption} onPress={takePhoto}>
                <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Camera size={24} color={theme.colors.primary} />
                </View>
                <Text style={[styles.optionText, { color: theme.colors.text }]}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalOption} onPress={pickImage}>
                <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '15' }]}>
                  <ImageIcon size={24} color={theme.colors.primary} />
                </View>
                <Text style={[styles.optionText, { color: theme.colors.text }]}>Choose From Gallery</Text>
              </TouchableOpacity>

              {receiptPhoto && (
                <TouchableOpacity style={styles.modalOption} onPress={() => { setReceiptPhoto(null); setShowImagePicker(false); }}>
                  <View style={[styles.iconCircle, { backgroundColor: '#EF4444' + '15' }]}>
                    <Trash2 size={24} color="#EF4444" />
                  </View>
                  <Text style={[styles.optionText, { color: '#EF4444' }]}>Remove Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { padding: 16, flexGrow: 1 },
  gap: { height: 16 },
  fieldLabel: { fontSize: 13, color: theme.colors.textLight, fontFamily: 'Inter_600SemiBold', marginBottom: 8 },
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1.5, borderBottomColor: theme.colors.border, paddingBottom: 10, paddingTop: 4 },
  dateLabelContainer: { flex: 1 },
  dateLabel: { fontSize: 11, color: theme.colors.textMuted, fontFamily: 'Inter_500Medium' },
  dateVal: { fontSize: 15, fontFamily: 'Inter_500Medium', marginTop: 2 },
  radioGroup: { flexDirection: 'row', gap: 24, marginTop: 4 },
  radioOption: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.colors.border, justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: theme.colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary },
  radioLabel: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  uploadBox: { height: 140, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 4, overflow: 'hidden' },
  uploadPlaceholder: { alignItems: 'center', gap: 6 },
  uploadPlaceholderText: { fontSize: 13, color: theme.colors.textLight, fontFamily: 'Inter_500Medium' },
  receiptImage: { width: '100%', height: '100%' },
  footer: { paddingHorizontal: 16, backgroundColor: theme.colors.background },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  modalOptions: { flexDirection: 'row', justifyContent: 'space-around' },
  modalOption: { alignItems: 'center', gap: 8 },
  iconCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  optionText: { fontSize: 12, fontFamily: 'Inter_500Medium' }
});

export default AddFinancialRecordScreen;
