import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList, ScrollView, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import { useFocusEffect } from '@react-navigation/native';
import { Search, Plus, ChevronDown, ChevronUp, Edit2, Trash2, Calendar, Check, Activity } from 'lucide-react-native';
import { SPACING } from '../theme';
import api from '../api';
import DateTimePicker from '@react-native-community/datetimepicker';

const MATING_TYPES = [
  { label: 'Natural', value: 'NATURAL' },
  { label: 'Artificial Insemination', value: 'AI' },
  { label: 'Embryo Transplant', value: 'ET' },
];

const MATING_STATUSES = [
  { label: 'Not Successful', value: 'NOT_SUCCESSFUL' },
  { label: 'Pregnant', value: 'PREGNANT' },
  { label: 'Miscarriage', value: 'MISCARRIAGE' },
];

const MatingListScreen = ({ navigation, route }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  
  const [searchTag, setSearchTag] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [animal, setAnimal] = useState(null);
  const [matings, setMatings] = useState([]);
  const [matingsLoading, setMatingsLoading] = useState(false);
  
  const [accordionOpen, setAccordionOpen] = useState(true);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  
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
  
  // Handle pre-filled search if navigating from Animal detail
  useEffect(() => {
    if (route.params?.prefillTag && !isSearching) {
      setSearchTag(route.params.prefillTag);
      handleSearch(route.params.prefillTag, route.params?.autoOpenAdd);
    }
  }, [route.params?.prefillTag]);

  const handleSearch = async (tagToSearch = searchTag, shouldAutoOpen = false) => {
    if (!tagToSearch.trim()) {
      Alert.alert('Error', 'Please enter a Tag ID');
      return;
    }
    
    setIsSearching(true);
    setAnimal(null);
    setMatings([]);
    
    try {
      const res = await api.get(`/animals/check-tag/${tagToSearch.trim()}`);
      if (res.data && res.data.id) {
        setAnimal(res.data);
        fetchAnimalMatings(res.data.id);
        if (shouldAutoOpen && !hasAutoOpened) {
          setHasAutoOpened(true);
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

  const fetchAnimalMatings = async (animalId) => {
    setMatingsLoading(true);
    try {
      const res = await api.get(`/matings/animal/${animalId}`);
      setMatings(res.data);
      setAccordionOpen(true);
    } catch (err) {
      console.error('Fetch matings error:', err);
    } finally {
      setMatingsLoading(false);
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setEditId(null);
    setMatingDate(new Date());
    setMatingType('NATURAL');
    setMaleTagId('');
    setMaleBreed('');
    setRemark('');
    setSemenId('');
    setDose('');
    setTechnician('');
    setTime('');
    setEmbryoId('');
    setStatus('NOT_SUCCESSFUL'); // default internally, won't show on UI
    setModalVisible(true);
  };

  const openEditModal = (item) => {
    setIsEditing(true);
    setEditId(item.id);
    setMatingDate(new Date(item.mating_date));
    setMatingType(item.mating_type);
    setMaleTagId(item.male_tag_id || '');
    setMaleBreed(item.male_breed || '');
    setRemark(item.remark || '');
    setSemenId(item.semen_id || '');
    setDose(item.dose || '');
    setTechnician(item.technician || '');
    setTime(item.time || '');
    setEmbryoId(item.embryo_id || '');
    
    setStatus(item.status || 'NOT_SUCCESSFUL');
    if (item.expected_delivery_date) setExpectedDeliveryDate(new Date(item.expected_delivery_date));
    if (item.miscarriage_date) setMiscarriageDate(new Date(item.miscarriage_date));
    setMiscarriageReason(item.miscarriage_reason || '');
    
    setModalVisible(true);
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Record',
      'Are you sure you want to delete this mating record?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/matings/${id}`);
              fetchAnimalMatings(animal.id);
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
        await api.put(`/matings/${editId}`, payload);
      } else {
        await api.post('/matings', payload);
      }
      setModalVisible(false);
      fetchAnimalMatings(animal.id);
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
      <GHeader title="Add Mating" onBack={() => navigation.goBack()} />

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
              <Text style={styles.accordionTitle}>Mating Record</Text>
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

                {matingsLoading ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 20 }} />
                ) : matings.length === 0 ? (
                  <Text style={[styles.noRecordsText, { color: theme.colors.textMuted }]}>No Records Found</Text>
                ) : (
                  matings.map((item, index) => (
                    <View key={item.id} style={[
                      styles.recordItem, 
                      { borderColor: theme.colors.border },
                      index === matings.length - 1 && { borderBottomWidth: 0 }
                    ]}>
                      <View style={styles.recordDot} />
                      <View style={styles.recordContent}>
                        <Text style={[styles.recordDate, { color: theme.colors.text }]}>
                          {new Date(item.mating_date).toLocaleDateString()}
                        </Text>
                        <Text style={[styles.recordType, { color: theme.colors.textMuted }]}>
                          {MATING_TYPES.find(b => b.value === item.mating_type)?.label || item.mating_type}
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
                <Text style={styles.modalTitle}>{isEditing ? 'Edit Mating' : 'Add Mating'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>X</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                <View style={[styles.row, { zIndex: 10 }]}>
                  {/* Mother Tag ID */}
                  <View style={styles.halfWidth}>
                    <Text style={styles.inputLabel}>Mother Tag ID</Text>
                    <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
                      <TextInput
                        style={[styles.input, { color: theme.colors.textMuted }]}
                        value={animal?.tag_number || searchTag || ''}
                        editable={false}
                      />
                    </View>
                  </View>
                </View>

                <View style={[styles.row, { zIndex: 9 }]}>
                  {/* Mating Date */}
                  <View style={styles.halfWidth}>
                    <Text style={styles.inputLabel}>Mating Date*</Text>
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
                    <Text style={styles.inputLabel}>Mating Type*</Text>
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
                        <Text style={styles.inputLabel}>Male Tag ID</Text>
                        <View style={styles.inputContainer}>
                          <TextInput style={styles.input} value={maleTagId} onChangeText={setMaleTagId} />
                        </View>
                      </View>
                      <View style={styles.fullWidthField}>
                        <Text style={styles.inputLabel}>Male Breed</Text>
                        <View style={styles.inputContainer}>
                          <TextInput style={styles.input} value={maleBreed} onChangeText={setMaleBreed} />
                        </View>
                      </View>
                    </>
                  )}

                  {matingType === 'AI' && (
                    <>
                      <View style={styles.fullWidthField}>
                        <Text style={styles.inputLabel}>Semen</Text>
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
                        <Text style={styles.inputLabel}>Technician/Medical Professional</Text>
                        <View style={styles.inputContainer}>
                          <TextInput style={styles.input} value={technician} onChangeText={setTechnician} />
                        </View>
                      </View>
                      <View style={styles.fullWidthField}>
                        <Text style={styles.inputLabel}>Time</Text>
                        <View style={styles.inputContainer}>
                          <TextInput style={styles.input} value={time} onChangeText={setTime} />
                        </View>
                      </View>
                    </>
                  )}

                  {matingType === 'ET' && (
                    <>
                      <View style={styles.fullWidthField}>
                        <Text style={styles.inputLabel}>Embryo</Text>
                        <View style={styles.inputContainer}>
                          <TextInput style={styles.input} value={embryoId} onChangeText={setEmbryoId} />
                        </View>
                      </View>
                      <View style={styles.fullWidthField}>
                        <Text style={styles.inputLabel}>Technician/Medical Professional</Text>
                        <View style={styles.inputContainer}>
                          <TextInput style={styles.input} value={technician} onChangeText={setTechnician} />
                        </View>
                      </View>
                      <View style={styles.fullWidthField}>
                        <Text style={styles.inputLabel}>Time</Text>
                        <View style={styles.inputContainer}>
                          <TextInput style={styles.input} value={time} onChangeText={setTime} />
                        </View>
                      </View>
                    </>
                  )}

                  <View style={styles.fullWidthField}>
                    <Text style={styles.inputLabel}>Remark</Text>
                    <View style={styles.inputContainer}>
                      <TextInput style={styles.input} value={remark} onChangeText={setRemark} placeholder="Notes" placeholderTextColor={theme.colors.textMuted}/>
                    </View>
                  </View>
                </View>

                {/* Edit Mode Only: Status Fields */}
                {isEditing && (
                  <View style={styles.statusSection}>
                    <Text style={styles.inputLabel}>Mating Status</Text>
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
                        <Text style={styles.inputLabel}>Expected Delivery Due Date*</Text>
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
                          <Text style={styles.inputLabel}>Miscarriage Date*</Text>
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
                          <Text style={styles.inputLabel}>Miscarriage Reason</Text>
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
                    <Text style={styles.estrusTitle}>Heat/Estrus Detection Date</Text>
                  </View>
                  <View style={styles.estrusBody}>
                    <View style={styles.estrusItem}>
                      <Text style={styles.estrusDays}>21 Days</Text>
                      <Text style={styles.estrusDate}>{calculateDate(21)}</Text>
                    </View>
                    <View style={styles.estrusDivider} />
                    <View style={styles.estrusItem}>
                      <Text style={styles.estrusDays}>45 Days</Text>
                      <Text style={styles.estrusDate}>{calculateDate(45)}</Text>
                    </View>
                  </View>
                </View>

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
  modalContent: { borderRadius: 12, overflow: 'hidden', maxHeight: '85%' },
  modalHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16 
  },
  modalTitle: { color: '#FFF', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  closeBtn: { padding: 4 },
  closeBtnText: { color: '#FFF', fontSize: 16, fontFamily: 'Inter_700Bold' },
  modalScroll: { padding: 16 },
  
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

export default MatingListScreen;
