import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, KeyboardAvoidingView, Platform, Alert, TouchableOpacity, Modal, TextInput, FlatList, SafeAreaView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import GInput from '../components/GInput';
import GButton from '../components/GButton';
import api from '../api';
import { Camera, ImageIcon, Trash2, X, Calendar, ChevronDown, Search, Plus, Check } from 'lucide-react-native';
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
  const [type, setType] = useState(isEditing ? existingRecord.type : 'EXPENSE');
  const [amount, setAmount] = useState(isEditing ? parseFloat(existingRecord.amount).toString() : '');
  const [description, setDescription] = useState(isEditing ? existingRecord.description || '' : '');
  const [receiptPhoto, setReceiptPhoto] = useState(isEditing ? existingRecord.receipt_url || null : null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);

  // Category picker states
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  const expenseCategories = [
    'Animal Purchase',
    'Feed & Fodder',
    'Veterinary & Medicines',
    'Labor Charges',
    'Electricity & Water',
    'Fuel & Transportation',
    'Farm Maintenance & Repairs',
    'Equipment & Machinery',
    'Agriculture & Fodder Production',
    'Administration & Communication',
    'Software & Technology',
    'Marketing & Promotion',
    'Loan, Insurance & Bank Charges',
    'Training & Exposure Visits',
    'Tags / RFID / Animal ID',
    'Miscellaneous Expenses',
  ];

  const incomeCategories = [
    'Goat Sales',
    'Milk Sales',
    'Manure Sales',
    'Breeding Services',
    'Training & Exposure Visits',
    'Consultancy Services',
    'Fodder & Crop Sales',
    'Other Income',
  ];

  const allCategories = type === 'INCOME' ? incomeCategories : expenseCategories;

  const filteredCategories = allCategories.filter(cat =>
    cat.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const handleSelectCategory = (cat) => {
    setCategory(cat);
    setShowCategoryPicker(false);
    setCategorySearch('');
    setShowCustomInput(false);
    setCustomCategory('');
  };

  const handleCustomCategorySubmit = () => {
    if (customCategory.trim()) {
      setCategory(customCategory.trim());
      setShowCategoryPicker(false);
      setCategorySearch('');
      setShowCustomInput(false);
      setCustomCategory('');
    }
  };

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
      const serverMsg = error.response?.data?.message || error.message || 'Unknown error';
      console.error('Error saving transaction record:', serverMsg, error.response?.status);
      Alert.alert('Error', `Failed to save: ${serverMsg}`);
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

          {/* Transaction Type Radio Buttons - FIRST so categories change dynamically */}
          <Text style={styles.fieldLabel}>Transaction Type*</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity style={[styles.radioChip, type === 'EXPENSE' && styles.radioChipActive]} onPress={() => { setType('EXPENSE'); setCategory(''); }}>
              <Text style={[styles.radioChipText, type === 'EXPENSE' && styles.radioChipTextActive]}>💸 Expense</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.radioChip, type === 'INCOME' && styles.radioChipActiveGreen]} onPress={() => { setType('INCOME'); setCategory(''); }}>
              <Text style={[styles.radioChipText, type === 'INCOME' && styles.radioChipTextActive]}>💰 Income</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.gap} />

          {/* Category Selector - Custom with type-your-own */}
          <Text style={styles.fieldLabel}>Category*</Text>
          <TouchableOpacity 
            style={[styles.categorySelector, { borderColor: category ? theme.colors.primary : theme.colors.border }]}
            onPress={() => setShowCategoryPicker(true)}
          >
            <Text style={[styles.categorySelectorText, { color: category ? theme.colors.text : theme.colors.textMuted }]}>
              {category || 'Select or type a category...'}
            </Text>
            <ChevronDown size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.gap} />

          {/* Amount input */}
          <GInput 
            label="Amount (₹)*" 
            value={amount} 
            onChangeText={setAmount} 
            placeholder="e.g. 5000"
            keyboardType="numeric"
            required 
          />

          <View style={styles.gap} />

          {/* Description input */}
          <GInput 
            label="Remark / Description" 
            value={description} 
            onChangeText={setDescription} 
            placeholder="Describe the transaction..."
          />

          <View style={styles.gap} />

          {/* Receipt Image Upload */}
          <Text style={styles.fieldLabel}>Upload Bill / Receipt</Text>
          <TouchableOpacity 
            style={[styles.uploadBox, { borderColor: theme.colors.border }]} 
            onPress={() => setShowImagePicker(true)}
          >
            {receiptPhoto ? (
              <Image source={{ uri: receiptPhoto }} style={styles.receiptImage} />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Camera size={24} color={theme.colors.textLight} />
                <Text style={styles.uploadPlaceholderText}>Tap to upload or take photo</Text>
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

      {/* ===== Category Picker Modal ===== */}
      <Modal visible={showCategoryPicker} transparent animationType="slide" onRequestClose={() => { setShowCategoryPicker(false); setShowCustomInput(false); setCategorySearch(''); }}>
        <View style={styles.catModalOverlay}>
          <SafeAreaView style={[styles.catModalContent, { backgroundColor: theme.colors.surface }]}>
            {/* Header */}
            <View style={[styles.catModalHeader, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.catModalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => { setShowCategoryPicker(false); setShowCustomInput(false); setCategorySearch(''); }} style={styles.catModalClose}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={[styles.catSearchContainer, { backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5' }]}>
              <Search size={18} color={theme.colors.textMuted} />
              <TextInput
                style={[styles.catSearchInput, { color: theme.colors.text }]}
                placeholder="Search categories..."
                placeholderTextColor={theme.colors.textMuted}
                value={categorySearch}
                onChangeText={setCategorySearch}
              />
            </View>

            {/* Add Custom Category Button */}
            {!showCustomInput ? (
              <TouchableOpacity style={[styles.addCustomBtn, { borderColor: theme.colors.primary }]} onPress={() => setShowCustomInput(true)}>
                <Plus size={18} color={theme.colors.primary} />
                <Text style={[styles.addCustomBtnText, { color: theme.colors.primary }]}>Add Custom Category</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.customInputRow}>
                <TextInput
                  style={[styles.customInput, { color: theme.colors.text, borderColor: theme.colors.primary }]}
                  placeholder="Type custom category..."
                  placeholderTextColor={theme.colors.textMuted}
                  value={customCategory}
                  onChangeText={setCustomCategory}
                  autoFocus
                />
                <TouchableOpacity style={[styles.customSubmitBtn, { backgroundColor: theme.colors.primary }]} onPress={handleCustomCategorySubmit}>
                  <Check size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {/* Category List */}
            <FlatList
              data={filteredCategories}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.catOption, { borderBottomColor: theme.colors.border }, item === category && { backgroundColor: isDarkMode ? '#1E293B' : '#FFF1EA' }]}
                  onPress={() => handleSelectCategory(item)}
                >
                  <Text style={[styles.catOptionText, { color: theme.colors.text }, item === category && { color: theme.colors.primary, fontFamily: 'Inter_700Bold' }]}>
                    {item}
                  </Text>
                  {item === category && <Check size={18} color={theme.colors.primary} />}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.catEmpty}>
                  <Text style={{ color: theme.colors.textMuted, fontFamily: 'Inter_500Medium' }}>No matching categories. Use "Add Custom Category" above.</Text>
                </View>
              }
            />
          </SafeAreaView>
        </View>
      </Modal>

      {/* Image Picker Modal */}
      <Modal visible={showImagePicker} transparent={true} animationType="fade" onRequestClose={() => setShowImagePicker(false)}>
        <TouchableOpacity style={styles.imgModalOverlay} activeOpacity={1} onPress={() => setShowImagePicker(false)}>
          <View style={[styles.imgModalContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.imgModalHeader}>
              <Text style={[styles.imgModalTitle, { color: theme.colors.text }]}>Upload Document</Text>
              <TouchableOpacity onPress={() => setShowImagePicker(false)}>
                <X size={24} color={theme.colors.textLight} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.imgModalOptions}>
              <TouchableOpacity style={styles.imgModalOption} onPress={takePhoto}>
                <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Camera size={24} color={theme.colors.primary} />
                </View>
                <Text style={[styles.optionText, { color: theme.colors.text }]}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.imgModalOption} onPress={pickImage}>
                <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '15' }]}>
                  <ImageIcon size={24} color={theme.colors.primary} />
                </View>
                <Text style={[styles.optionText, { color: theme.colors.text }]}>Gallery</Text>
              </TouchableOpacity>

              {receiptPhoto && (
                <TouchableOpacity style={styles.imgModalOption} onPress={() => { setReceiptPhoto(null); setShowImagePicker(false); }}>
                  <View style={[styles.iconCircle, { backgroundColor: '#EF444415' }]}>
                    <Trash2 size={24} color="#EF4444" />
                  </View>
                  <Text style={[styles.optionText, { color: '#EF4444' }]}>Remove</Text>
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

  // Date
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1.5, borderBottomColor: theme.colors.border, paddingBottom: 10, paddingTop: 4 },
  dateLabelContainer: { flex: 1 },
  dateLabel: { fontSize: 11, color: theme.colors.textMuted, fontFamily: 'Inter_500Medium' },
  dateVal: { fontSize: 15, fontFamily: 'Inter_500Medium', marginTop: 2 },

  // Type chips
  radioGroup: { flexDirection: 'row', gap: 12, marginTop: 4 },
  radioChip: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: theme.colors.border, alignItems: 'center', backgroundColor: theme.colors.surface },
  radioChipActive: { borderColor: '#EF4444', backgroundColor: '#EF444410' },
  radioChipActiveGreen: { borderColor: '#10B981', backgroundColor: '#10B98110' },
  radioChipText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: theme.colors.textLight },
  radioChipTextActive: { color: theme.colors.text },

  // Category selector
  categorySelector: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, height: 52, backgroundColor: theme.colors.surface },
  categorySelectorText: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium' },

  // Upload
  uploadBox: { height: 140, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 4, overflow: 'hidden' },
  uploadPlaceholder: { alignItems: 'center', gap: 6 },
  uploadPlaceholderText: { fontSize: 13, color: theme.colors.textLight, fontFamily: 'Inter_500Medium' },
  receiptImage: { width: '100%', height: '100%' },

  // Footer
  footer: { paddingHorizontal: 16, backgroundColor: theme.colors.background },

  // Category Modal
  catModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  catModalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '75%' },
  catModalHeader: { padding: 16, alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  catModalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff' },
  catModalClose: { position: 'absolute', right: 16, top: 16 },
  catSearchContainer: { flexDirection: 'row', alignItems: 'center', margin: 12, borderRadius: 10, paddingHorizontal: 12, height: 44, gap: 8 },
  catSearchInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium' },
  addCustomBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 12, marginBottom: 8, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 12 },
  addCustomBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  customInputRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginBottom: 8, gap: 8 },
  customInput: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, height: 46, fontSize: 15, fontFamily: 'Inter_500Medium' },
  customSubmitBtn: { width: 46, height: 46, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  catOption: { paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catOptionText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  catEmpty: { padding: 24, alignItems: 'center' },

  // Image Modal
  imgModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  imgModalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  imgModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  imgModalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  imgModalOptions: { flexDirection: 'row', justifyContent: 'space-around' },
  imgModalOption: { alignItems: 'center', gap: 8 },
  iconCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  optionText: { fontSize: 12, fontFamily: 'Inter_500Medium' }
});

export default AddFinancialRecordScreen;
