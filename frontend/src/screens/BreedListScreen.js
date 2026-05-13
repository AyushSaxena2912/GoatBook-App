import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Animated, Platform, Alert, SafeAreaView, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { lightTheme } from '../theme';
import GHeader from '../components/GHeader';
import GAlert from '../components/GAlert';
import { Search, Plus, ChevronRight, X, SearchX, Square, CheckSquare, Trash2, CheckCircle2, Lock, Check, MoreVertical } from 'lucide-react-native';
import api from '../api';
import { useFocusEffect } from '@react-navigation/native';
import { getFromCache, saveToCache } from '../utils/cache';

const BreedListScreen = ({ navigation }) => {
  const { isDarkMode, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const [breeds, setBreeds] = useState([]);
  const [filteredBreeds, setFilteredBreeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info' });

  const showAlert = (title, message, type = 'info') => setAlertConfig({ visible: true, title, message, type });
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));
  
  // Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const searchBarTranslateY = useRef(new Animated.Value(-100)).current;

  useFocusEffect(
    useCallback(() => {
      fetchBreeds();
      exitSelectionMode();
    }, [])
  );

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredBreeds(breeds);
    } else {
      const q = searchQuery.toLowerCase();
      const filtered = breeds.filter(breed => 
        breed.name.toLowerCase().includes(q) ||
        (breed.animalType && breed.animalType.toLowerCase().includes(q)) ||
        (breed.origin && breed.origin.toLowerCase().includes(q))
      );
      setFilteredBreeds(filtered);
    }
  }, [searchQuery, breeds]);

  const fetchBreeds = async () => {
    try {
      setLoading(true);
      const response = await api.get('/breeds');
      const sortedData = response.data.sort((a, b) => {
        if (a.isDefault !== b.isDefault) {
          return a.isDefault ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      await saveToCache('breeds', sortedData);
      setBreeds(sortedData);
      setFilteredBreeds(sortedData);
      setLoading(false);
    } catch (error) {
      console.warn('Fetch breeds failed', error);
      const cachedData = await getFromCache('breeds');
      if (cachedData) {
        setBreeds(cachedData);
        setFilteredBreeds(cachedData);
      }
      setLoading(false);
    }
  };



  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds([]);
  };

  const handleLongPress = (item) => {
    if (!item.isDefault) {
      if (!isSelectionMode) {
        setIsSelectionMode(true);
        setSelectedIds([item.id]);
      }
    } else {
      showAlert('System Breed', 'This is a default breed and cannot be deleted.', 'info');
    }
  };

  const toggleSelection = (id) => {
    if (selectedIds.includes(id)) {
      const next = selectedIds.filter(idx => idx !== id);
      setSelectedIds(next);
      if (next.length === 0) setIsSelectionMode(false);
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    const selectable = filteredBreeds.filter(b => !b.isDefault).map(b => b.id);
    if (selectable.length === 0) return;
    if (selectedIds.length === selectable.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectable);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsDeleteModalVisible(true);
  };

  const confirmBulkDelete = async () => {
    try {
      setIsDeleteModalVisible(false);
      setLoading(true);
      setIsDeleting(true);
      
      const response = await api.post('/breeds/bulk-delete', { 
          ids: selectedIds
      });
      
      if (response.data.success) {
        setBreeds(prev => prev.filter(b => !selectedIds.includes(b.id)));
        setFilteredBreeds(prev => prev.filter(b => !selectedIds.includes(b.id)));
        exitSelectionMode();
        Alert.alert('Success', 'Selected breeds deleted successfully.');
      }
    } catch (error) {
      console.error('Bulk delete failed', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete some breeds. They might be assigned to animals.');
    } finally {
      setIsDeleting(false);
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedIds.includes(item.id);
    const isCustom = !item.isDefault;

    return (
      <TouchableOpacity 
        style={[
          styles.breedCard, 
          isSelected && { borderColor: theme.colors.primary, backgroundColor: isDarkMode ? '#1E1E1E' : '#fafafa' }
        ]}
        onPress={() => isSelectionMode ? (isCustom ? toggleSelection(item.id) : null) : (isCustom ? navigation.navigate('EditBreed', { breed: item }) : null)}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.breedInfo}>
          <Text style={[styles.breedName, { color: theme.colors.text }]}>{item.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <Text style={[styles.animalType, { color: theme.colors.textLight, fontSize: 13 }]}>{item.animalType}</Text>
            <View style={[
              styles.originBadge, 
              { 
                backgroundColor: (item.origin || 'indian').toLowerCase() === 'exotic' ? '#E3F2FD' : '#E8F5E9',
                marginLeft: 10
              }
            ]}>
              <Text style={[
                styles.originText, 
                { color: (item.origin || 'indian').toLowerCase() === 'exotic' ? '#1976D2' : '#2E7D32' }
              ]}>
                {(item.origin || 'Indian').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.breedStats}>
          {isSelectionMode ? (
            <View style={styles.checkboxWrapper}>
              {isCustom ? (
                <View style={[
                  styles.checkbox, 
                  isSelected ? styles.checkboxSelected : styles.checkboxUnselected,
                  isSelected && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                ]}>
                  {isSelected && <Check size={14} color="white" strokeWidth={3} />}
                </View>
              ) : (
                <Lock size={18} color={theme.colors.textMuted} />
              )}
            </View>
          ) : (
            isCustom && <ChevronRight size={20} color={theme.colors.textMuted} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const isAllSelected = selectedIds.length > 0 && selectedIds.length === filteredBreeds.filter(b => !b.isDefault).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, pointerEvents: 'box-none' }]}>
      <GAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={hideAlert}
      />

      {isSelectionMode ? (
        <View style={[styles.selectionHeader, { paddingTop: insets.top + 10, paddingBottom: 10 }]}>
            <TouchableOpacity onPress={exitSelectionMode} style={styles.headerButton}>
                <Text style={[styles.headerButtonText, { color: theme.colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={[styles.selectionTitle, { color: theme.colors.text }]}>
                    {selectedIds.length === 0 ? 'Select items' : `${selectedIds.length} selected`}
                </Text>
            </View>
            <TouchableOpacity onPress={handleSelectAll} style={[styles.headerButton, { alignItems: 'flex-end' }]}>
                <Text style={[styles.headerButtonText, { color: theme.colors.primary }]}>
                    {isAllSelected ? 'None' : 'All'}
                </Text>
            </TouchableOpacity>
        </View>
      ) : (
        <GHeader 
          title="Breeds List" 
          onMenu={() => navigation.openDrawer()} 
          onBack={() => navigation.goBack()}
          leftAlign={true}
          rightIcon={
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 12, justifyContent: 'flex-end' }}>
                <TouchableOpacity onPress={() => { setIsSearching(!isSearching); if(!isSearching) setSearchQuery(''); }}>
                    {isSearching ? <X color={theme.colors.white} size={24} /> : <Search color={theme.colors.white} size={24} />}
                </TouchableOpacity>
            </View>
          }
        />
      )}
      
      {isSearching && (
        <View style={styles.searchBarContainer}>
          <View style={styles.searchInner}>
            <Search size={20} color={theme.colors.textLight} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Search name, type or origin..."
              placeholderTextColor={theme.colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <>
          <FlatList
            data={filteredBreeds}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                  <SearchX size={64} color={theme.colors.border} />
                  <Text style={[styles.noRecords, { color: theme.colors.text }]}>No Breeds Found</Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          />
          
          {!isSelectionMode && (
            <TouchableOpacity 
              style={[styles.fab, { backgroundColor: theme.colors.primary, ...theme.shadow.lg }]}
              onPress={() => navigation.navigate('AddBreed')}
              activeOpacity={0.8}
            >
              <Plus color={theme.colors.white} size={30} strokeWidth={2.5} />
            </TouchableOpacity>
          )}
          
          {isSelectionMode && (
            <View style={[styles.bottomActions, { justifyContent: 'center' }]}>
                <TouchableOpacity 
                    style={[styles.deleteAction, isDeleting && { opacity: 0.5 }]} 
                    onPress={handleBulkDelete}
                    disabled={isDeleting || selectedIds.length === 0}
                >
                    <Trash2 size={26} color={theme.colors.primary} />
                    <Text style={[styles.deleteText, { color: theme.colors.primary }]}>Delete</Text>
                </TouchableOpacity>
            </View>
          )}

          {/* Custom Delete Confirmation Modal */}
          <Modal
            visible={isDeleteModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setIsDeleteModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalIconContainer}>
                  <View style={styles.iconCircle}>
                    <Trash2 size={32} color={theme.colors.primary} />
                  </View>
                </View>
                
                <Text style={styles.modalTitle}>Confirm Delete?</Text>
                <Text style={styles.modalSubtitle}>
                  Are you sure you want to delete {selectedIds.length === 1 ? 'this breed' : `these ${selectedIds.length} breeds`}? This action cannot be undone.
                </Text>
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.modalCancelButton} 
                    onPress={() => setIsDeleteModalVisible(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.modalDeleteButton} 
                    onPress={confirmBulkDelete}
                  >
                    <Text style={styles.modalDeleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: { flex: 1 },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerButton: { padding: 10, minWidth: 60 },
  headerButtonText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  selectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 15,
    height: 50,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium' },
  listContent: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 120, paddingTop: 16 },
  breedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  checkboxWrapper: { marginLeft: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  checkboxUnselected: { borderColor: theme.colors.border },
  checkboxSelected: { borderColor: '#007AFF', backgroundColor: '#007AFF' },
  breedInfo: { flex: 1 },
  breedName: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  animalType: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  originBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  originText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  breedStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  animalCountText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginRight: 8,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 10,
  },
  countText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  noRecords: { fontSize: 18, fontFamily: 'Inter_500Medium', marginTop: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    zIndex: 9999,
    elevation: 100,
  },
  deleteAction: { alignItems: 'center', justifyContent: 'center', flex: 1, height: '100%' },
  deleteText: { fontSize: 12, marginTop: 4, fontFamily: 'Inter_600SemiBold' },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    zIndex: 90,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...theme.shadow.lg,
  },
  modalIconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF3E0', // Light Orange
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: theme.colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalCancelText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: theme.colors.primary,
  },
  modalDeleteButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDeleteText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: 'white',
  },
});

export default BreedListScreen;
