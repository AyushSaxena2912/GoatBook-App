import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, FlatList, 
  SafeAreaView, Modal, TextInput, Alert, ActivityIndicator, Platform 
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import GButton from '../components/GButton';
import GSelect from '../components/GSelect';
import GInput from '../components/GInput';
import { 
  Check, Square, CheckSquare, Circle, CheckCircle2, Scan, ChevronDown, 
  Search, X, Hash, User, Weight, MapPin, Tag, Plus 
} from 'lucide-react-native';
import { SPACING, SHADOW } from '../theme';
import api from '../api';

const MassLocationScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);

  const [animals, setAnimals] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedAnimals, setSelectedAnimals] = useState(new Set());
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [remark, setRemark] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [animalsRes, locationsRes] = await Promise.all([
        api.get('/animals'),
        api.get('/locations')
      ]);
      setAnimals(animalsRes.data);
      setLocations(locationsRes.data.map(loc => ({
        label: `${loc.displayName || loc.name}`,
        value: loc.id
      })));
    } catch (error) {
      console.error('Fetch data error:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const toggleAnimalSelection = useCallback((id) => {
    setSelectedAnimals(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return newSelection;
    });
  }, []);

  const filteredAnimals = useMemo(() => {
    let result = animals;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(animal => 
        animal.tagNumber?.toLowerCase().includes(q) || 
        (animal.breeds?.name || '').toLowerCase().includes(q)
      );
    }
    
    // Auto-exclude animals already in the target shed
    if (selectedLocationId) {
      result = result.filter(animal => animal.locationId !== selectedLocationId);
    }
    
    return result;
  }, [animals, searchQuery, selectedLocationId]);

  const handleSelectAll = () => {
    if (selectedAnimals.size === filteredAnimals.length && filteredAnimals.length > 0) {
      setSelectedAnimals(new Set());
    } else {
      setSelectedAnimals(new Set(filteredAnimals.map(a => a.id)));
    }
  };

  const handleAddNewLocation = async () => {
    if (!newLocationName.trim()) return;
    try {
      const res = await api.post('/locations', {
        name: newLocationName,
        code: newLocationName.toUpperCase().substring(0, 5),
        type: 'Internal Location'
      });
      const newLoc = {
        label: `${res.data.name}`,
        value: res.data.id
      };
      setLocations(prev => [...prev, newLoc]);
      setSelectedLocationId(res.data.id);
      setNewLocationName('');
      setShowAddModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create location');
    }
  };

  const handleSubmit = async () => {
    if (selectedAnimals.size === 0) {
      Alert.alert('Validation', 'Please select atleast one animal');
      return;
    }
    if (!selectedLocationId) {
      Alert.alert('Validation', 'Please select a destination location');
      return;
    }

    setSubmitting(true);
    try {
      await api.put('/animals/bulk-location', {
        animalIds: Array.from(selectedAnimals),
        locationId: selectedLocationId,
        remark: remark
      });
      Alert.alert('Success', 'Location updated successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update location');
    } finally {
      setSubmitting(false);
    }
  };

  const renderAnimalItem = ({ item }) => {
    const isChecked = selectedAnimals.has(item.id);
    return (
      <TouchableOpacity 
        style={[styles.animalCard, { backgroundColor: theme.colors.surface }]} 
        onPress={() => toggleAnimalSelection(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.checkWrapper}>
          <View style={[styles.customCheck, { borderColor: isChecked ? theme.colors.primary : theme.colors.border }]}>
            {isChecked && <View style={[styles.checkInner, { backgroundColor: theme.colors.primary }]} />}
          </View>
        </View>
        
        <View style={styles.animalInfo}>
          <View style={styles.infoTop}>
            <View style={styles.tagRow}>
               <Tag size={14} color={theme.colors.primary} />
               <Text style={[styles.tagId, { color: theme.colors.text }]}>#{item.tagNumber}</Text>
            </View>
            <Text style={[styles.breedName, { color: theme.colors.textLight }]}>{item.breeds?.name || 'Sirohi'}</Text>
          </View>
          
          <View style={styles.animalMetaRow}>
            <Text style={[styles.metaItem, { color: theme.colors.textLight }]}>{item.gender}</Text>
            <View style={styles.dot} />
            <Text style={[styles.metaItem, { color: theme.colors.textLight }]}>{item.ageInMonths} Months</Text>
            <View style={styles.dot} />
            <Text style={[styles.metaItem, { color: theme.colors.textLight }]}>{item.currentWeight || item.birthWeight || 0} kg</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const isAllSelected = filteredAnimals.length > 0 && selectedAnimals.size === filteredAnimals.length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader title="Add Mass Location/Shed" onBack={() => navigation.goBack()} leftAlign={true} />

      <View style={styles.content}>
        {/* Destination Selection */}
        <View style={styles.controlRow}>
          <View style={styles.selectWrapper}>
            <GSelect 
              label="Select Shed*" 
              placeholder="Destination Shed"
              value={selectedLocationId}
              onSelect={setSelectedLocationId}
              options={locations}
            />
          </View>
          <TouchableOpacity 
            style={[styles.addLocBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.addLocBtnText}>Add New</Text>
          </TouchableOpacity>
        </View>

        {/* Select All Toggle */}
        <View style={styles.selectionHeader}>
           <TouchableOpacity 
             style={styles.selectAllRow} 
             onPress={handleSelectAll}
             activeOpacity={0.7}
           >
              <View style={[styles.customCheck, isAllSelected && { borderColor: theme.colors.primary }]}>
                {isAllSelected && <View style={[styles.checkInner, { backgroundColor: theme.colors.primary }]} />}
              </View>
              <Text style={[styles.selectAllText, { color: theme.colors.text }]}>Select All</Text>
           </TouchableOpacity>
           
           <View style={styles.searchCompact}>
              <Search size={16} color={theme.colors.textMuted} />
              <TextInput 
                placeholder="Search Tag..." 
                placeholderTextColor={theme.colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchCompactInput, { color: theme.colors.text }]}
              />
           </View>
        </View>

        {/* Animal List */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList 
            data={filteredAnimals}
            renderItem={renderAnimalItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.colors.textLight }]}>
                  {selectedLocationId ? 'No matching animals found.' : 'Select a Target Shed to begin.'}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Fixed Footer */}
      <View style={[styles.footer, { paddingBottom: Platform.OS === 'ios' ? 34 : 16 }]}>
        <GButton 
          title={selectedAnimals.size > 0 ? `Move ${selectedAnimals.size} Animals` : "Move Animals"}
          onPress={handleSubmit}
          loading={submitting}
          disabled={selectedAnimals.size === 0}
          containerStyle={styles.bulkBtn}
        />
      </View>

      {/* Add New Location Modal */}
      <Modal 
        visible={showAddModal} 
        transparent 
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.modalHeader, { backgroundColor: theme.colors.primary }]}>
               <Text style={styles.modalHeaderText}>Add Location/Shed</Text>
               <TouchableOpacity 
                 style={styles.modalCloseIcon}
                 onPress={() => setShowAddModal(false)}
               >
                 <X size={20} color="#FFF" />
               </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
               <View style={styles.modalInputWrapper}>
                  <Text style={[styles.modalInputLabel, { color: theme.colors.textMuted }]}>Enter Location/Shed Name</Text>
                  <TextInput 
                    style={[styles.modalInput, { borderColor: theme.colors.border, color: theme.colors.text }]}
                    placeholder="e.g. Shed 5"
                    placeholderTextColor={theme.colors.textMuted}
                    value={newLocationName}
                    onChangeText={setNewLocationName}
                    autoFocus
                  />
               </View>
               <TouchableOpacity 
                  style={[styles.saveBtn, { backgroundColor: theme.colors.primary }]}
                  onPress={handleAddNewLocation}
                  activeOpacity={0.8}
               >
                  <Text style={styles.saveBtnText}>Save</Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    gap: 12,
    alignItems: 'flex-start',
  },
  selectWrapper: {
    flex: 1,
  },
  addLocBtn: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  addLocBtnText: {
    color: '#FFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + '15',
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectAllText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  searchCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flex: 1,
    marginLeft: 16,
    gap: 8,
  },
  searchCompactInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 120,
    paddingTop: 12,
  },
  animalCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border + '80',
    ...SHADOW.small,
  },
  checkWrapper: {
    marginRight: 16,
  },
  customCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  animalInfo: {
    flex: 1,
  },
  infoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagId: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  breedName: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    opacity: 0.7,
  },
  animalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaItem: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.colors.textMuted,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  bulkBtn: {
    height: 54,
    borderRadius: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    borderRadius: 24,
    overflow: 'hidden',
    ...SHADOW.large,
  },
  modalHeader: {
    padding: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalCloseIcon: {
    position: 'absolute',
    right: 16,
  },
  modalHeaderText: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  modalBody: {
    padding: 24,
  },
  modalInputWrapper: {
    marginBottom: 24,
  },
  modalInputLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 4,
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  saveBtn: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    opacity: 0.6,
  },
});

export default MassLocationScreen;
