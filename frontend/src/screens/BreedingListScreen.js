import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList, ScrollView, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import { useFocusEffect } from '@react-navigation/native';
import { Search, Plus, ChevronDown, ChevronUp, Edit2, Trash2, Calendar, Check } from 'lucide-react-native';
import { SPACING } from '../theme';
import api from '../api';
import DateTimePicker from '@react-native-community/datetimepicker';

const BIRTH_TYPES = [
  { label: 'Single', value: 'SINGLE', count: 1 },
  { label: 'Twin', value: 'TWIN', count: 2 },
  { label: 'Triplet', value: 'TRIPLET', count: 3 },
  { label: 'Quadruplet', value: 'QUADRUPLET', count: 4 },
];

const GENDERS = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
];

const BreedingListScreen = ({ navigation, route }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  
  const [searchTag, setSearchTag] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [animal, setAnimal] = useState(null);
  const [breedings, setBreedings] = useState([]);
  const [breedingsLoading, setBreedingsLoading] = useState(false);
  
  const [accordionOpen, setAccordionOpen] = useState(true);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Form State
  const [deliveryDate, setDeliveryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [birthType, setBirthType] = useState('SINGLE');
  const [kids, setKids] = useState([{ tag_number: '', gender: 'MALE', birth_weight: '', remark: '' }]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Dropdown states for modal
  const [showBirthTypeDropdown, setShowBirthTypeDropdown] = useState(false);
  const [activeGenderDropdown, setActiveGenderDropdown] = useState(null); // stores index of kid

  // Handle pre-filled search if navigating from Animal detail
  useEffect(() => {
    if (route.params?.prefillTag && !isSearching) {
      setSearchTag(route.params.prefillTag);
      handleSearch(route.params.prefillTag, route.params?.autoOpenAdd);
    }
  }, [route.params?.timestamp]);

  const handleSearch = async (tagToSearch = searchTag, shouldAutoOpen = false) => {
    if (!tagToSearch.trim()) {
      Alert.alert('Error', 'Please enter a Tag ID');
      return;
    }
    
    setIsSearching(true);
    setAnimal(null);
    setBreedings([]);
    
    try {
      // First find the animal by tag
      const res = await api.get(`/animals/check-tag/${tagToSearch.trim()}`);
      if (res.data && res.data.id) {
        setAnimal(res.data);
        fetchAnimalBreedings(res.data.id);
        if (shouldAutoOpen) {
          openAddModal();
        }
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

  const fetchAnimalBreedings = async (animalId) => {
    setBreedingsLoading(true);
    try {
      const res = await api.get(`/breedings/animal/${animalId}`);
      setBreedings(res.data);
      setAccordionOpen(true);
    } catch (err) {
      console.error('Fetch breedings error:', err);
    } finally {
      setBreedingsLoading(false);
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

  const openAddModal = () => {
    setIsEditing(false);
    setEditId(null);
    setDeliveryDate(new Date());
    setBirthType('SINGLE');
    setKids([{ tag_number: '', gender: 'MALE', birth_weight: '', remark: '' }]);
    setModalVisible(true);
  };

  const openEditModal = (item) => {
    setIsEditing(true);
    setEditId(item.id);
    setDeliveryDate(new Date(item.delivery_date));
    setBirthType(item.birth_type);
    
    // Parse kids details or create empty array based on birth type
    let parsedKids = [];
    if (item.kids_details && Array.isArray(item.kids_details)) {
      parsedKids = item.kids_details;
    }
    
    const expectedCount = BIRTH_TYPES.find(b => b.value === item.birth_type)?.count || 1;
    while (parsedKids.length < expectedCount) {
      parsedKids.push({ tag_number: '', gender: 'MALE', birth_weight: '', remark: '' });
    }
    
    setKids(parsedKids.slice(0, expectedCount));
    setModalVisible(true);
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Record',
      'Are you sure you want to delete this breeding record?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/breedings/${id}`);
              fetchAnimalBreedings(animal.id);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete record');
            }
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    if (!animal) return;
    
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
        await api.put(`/breedings/${editId}`, payload);
      } else {
        await api.post('/breedings', payload);
      }
      setModalVisible(false);
      fetchAnimalBreedings(animal.id);
    } catch (err) {
      console.error('Save breeding error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to save record');
    } finally {
      setIsSaving(false);
    }
  };

  const renderKidFields = (kid, index) => {
    const kidLabels = ['First', 'Second', 'Third', 'Fourth'];
    const labelPrefix = kidLabels[index] || `${index + 1}th`;

    // Calculate zIndex to ensure dropdowns overlap subsequent rows
    const sectionZIndex = 100 - (index * 10);

    return (
      <View key={index} style={[styles.kidSection, { zIndex: sectionZIndex }]}>
        <View style={[styles.row, { zIndex: sectionZIndex + 2 }]}>
          <View style={[styles.halfWidth, { zIndex: 1 }]}>
            <Text style={styles.inputLabel}>{labelPrefix} Kid Tag ID*</Text>
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
            <Text style={styles.inputLabel}>Gender*</Text>
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
            <Text style={styles.inputLabel}>Birth Wt</Text>
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
            <Text style={styles.inputLabel}>Remark</Text>
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
      <GHeader title="Add Breeding" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Search Section */}
        <View style={styles.searchSection}>
          <Text style={styles.searchLabel}>Scan / Enter Tag Id*</Text>
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
              {isSearching ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.addButtonText}>Add</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Accordion Section */}
        {animal && (
          <View style={styles.accordionContainer}>
            <TouchableOpacity 
              style={styles.accordionHeader}
              onPress={() => setAccordionOpen(!accordionOpen)}
            >
              <Text style={styles.accordionTitle}>Breeding/Delivery Records</Text>
              {accordionOpen ? <ChevronUp size={20} color={theme.colors.text} /> : <ChevronDown size={20} color={theme.colors.text} />}
            </TouchableOpacity>

            {accordionOpen && (
              <View style={[styles.accordionContent, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                
                <TouchableOpacity 
                  style={[styles.addNewRecordBtn, { backgroundColor: theme.colors.primary }]}
                  onPress={openAddModal}
                >
                  <Plus size={16} color="#FFF" />
                  <Text style={styles.addNewRecordText}>Add New Record</Text>
                </TouchableOpacity>

                {breedingsLoading ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 20 }} />
                ) : breedings.length === 0 ? (
                  <Text style={[styles.noRecordsText, { color: theme.colors.textMuted }]}>No Records Found</Text>
                ) : (
                  breedings.map((item, index) => (
                    <View key={item.id} style={[
                      styles.recordItem, 
                      { borderColor: theme.colors.border },
                      index === breedings.length - 1 && { borderBottomWidth: 0 }
                    ]}>
                      <View style={styles.recordDot} />
                      <View style={styles.recordContent}>
                        <Text style={[styles.recordDate, { color: theme.colors.text }]}>
                          {new Date(item.delivery_date).toLocaleDateString()}
                        </Text>
                        <Text style={[styles.recordType, { color: theme.colors.textMuted }]}>
                          {BIRTH_TYPES.find(b => b.value === item.birth_type)?.label || item.birth_type}
                        </Text>
                      </View>
                      <View style={styles.recordActions}>
                        <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionIcon}>
                          <Edit2 size={16} color={theme.colors.textMuted} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionIcon}>
                          <Trash2 size={16} color={theme.colors.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal Form */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContentWrapper}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
              
              <View style={[styles.modalHeader, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.modalTitle}>{isEditing ? 'Edit Breeding' : 'Add Breeding'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>X</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                <View style={styles.row}>
                  {/* Mother Tag ID */}
                  <View style={styles.halfWidth}>
                    <Text style={styles.inputLabel}>Mother Tag ID</Text>
                    <View style={[styles.inputContainer, { backgroundColor: theme.colors.background }]}>
                      <TextInput
                        style={[styles.input, { color: theme.colors.textMuted }]}
                        value={animal?.tag_number || searchTag || ''}
                        editable={false}
                      />
                    </View>
                  </View>

                  {/* Delivery Date */}
                  <View style={styles.halfWidth}>
                    <Text style={styles.inputLabel}>Delivery Date*</Text>
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
                </View>
                
                <View style={[styles.row, { zIndex: 999 }]}>
                  {/* Birth Type */}
                  <View style={[styles.halfWidth, { zIndex: 999 }]}>
                    <Text style={styles.inputLabel}>Birth Type</Text>
                    <TouchableOpacity 
                      style={styles.dropdownButton}
                      onPress={() => {
                        setShowBirthTypeDropdown(!showBirthTypeDropdown);
                        setActiveGenderDropdown(null);
                      }}
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

                {/* Dynamic Kid Fields */}
                {kids.map((kid, index) => renderKidFields(kid, index))}

                <TouchableOpacity 
                  style={[styles.saveButton, { backgroundColor: theme.colors.primary, opacity: isSaving ? 0.7 : 1 }]}
                  onPress={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.saveButtonText}>Save</Text>}
                </TouchableOpacity>
                <View style={{ height: 40 }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

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
  
  // Accordion
  accordionContainer: { marginTop: 10 },
  accordionHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 4
  },
  accordionTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: theme.colors.text },
  accordionContent: { 
    borderWidth: 1, borderRadius: 12, padding: 16, alignItems: 'center',
    minHeight: 150
  },
  addNewRecordBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20,
    marginBottom: 20, alignSelf: 'center'
  },
  addNewRecordText: { color: '#FFF', fontFamily: 'Inter_500Medium', fontSize: 13 },
  noRecordsText: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 10 },
  
  // Record List
  recordItem: { 
    flexDirection: 'row', alignItems: 'center', width: '100%',
    paddingVertical: 12, borderBottomWidth: 1
  },
  recordDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.text, marginRight: 12 },
  recordContent: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', paddingRight: 20 },
  recordDate: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  recordType: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  recordActions: { flexDirection: 'row', gap: 16 },
  actionIcon: { padding: 4 },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContentWrapper: { flex: 1, justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 12, overflow: 'hidden', maxHeight: '80%' },
  modalHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16 
  },
  modalTitle: { color: '#FFF', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  closeBtn: { padding: 4 },
  closeBtnText: { color: '#FFF', fontSize: 16, fontFamily: 'Inter_700Bold' },
  modalScroll: { padding: 16 },
  
  // Form
  row: { flexDirection: 'row', gap: 12, marginBottom: 16, zIndex: 1 },
  halfWidth: { flex: 1, zIndex: 1 },
  inputLabel: { fontSize: 12, color: theme.colors.textMuted, fontFamily: 'Inter_500Medium', marginBottom: 6 },
  dateButton: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8,
    paddingHorizontal: 12, height: 44 
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
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 4, zIndex: 999 
  },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  dropdownItemText: { fontSize: 14, color: theme.colors.text, fontFamily: 'Inter_400Regular' },
  
  inputContainer: { 
    borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8,
    paddingHorizontal: 12, height: 44, backgroundColor: theme.colors.surface
  },
  input: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: theme.colors.text },
  
  kidSection: { marginTop: 8, zIndex: 0 },
  saveButton: { 
    height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center',
    marginTop: 24 
  },
  saveButtonText: { color: '#FFF', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});

export default BreedingListScreen;
