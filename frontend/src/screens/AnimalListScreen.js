import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Animated, Platform, Image, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { lightTheme } from '../theme';
import GHeader from '../components/GHeader';
import { Search, Plus, ChevronRight, SearchX, X, MapPin, CheckSquare, Square, Trash2, CheckCircle2, Lock, Check, MoreVertical, Tag, Filter, ArrowUpDown } from 'lucide-react-native';
import api from '../api';
import GAlert from '../components/GAlert';
import { useFocusEffect } from '@react-navigation/native';
import { getFromCache, saveToCache } from '../utils/cache';
import AnimalFilterModal from '../components/AnimalFilterModal';
import { useTranslation } from 'react-i18next';

const AnimalListScreen = ({ navigation, route }) => {
  const { isDarkMode, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [animals, setAnimals] = useState([]);
  const [allBreeds, setAllBreeds] = useState([]);
  const [allLocations, setAllLocations] = useState([]);
  const [filteredAnimals, setFilteredAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const { t } = useTranslation();

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);

  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const searchBarTranslateY = useRef(new Animated.Value(-100)).current;

  // Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info' });
  const showAlert = (title, message, type = 'info') => setAlertConfig({ visible: true, title, message, type });
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  useFocusEffect(
    useCallback(() => {
      fetchAnimals(1);
      fetchBreeds();
      fetchLocations();
      if (route.params?.initialSearch) {
        setSearchQuery(route.params.initialSearch);
        setIsSearching(true);
      }
    }, [route.params])
  );

  const fetchBreeds = async () => {
    try {
      const response = await api.get('/breeds');
      setAllBreeds(response.data || []);
    } catch (e) {
      console.warn('Failed to fetch breeds', e);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await api.get('/locations');
      setAllLocations(response.data || []);
    } catch (e) {
      console.warn('Failed to fetch locations', e);
    }
  };

  useEffect(() => {
    let result = animals;
    
    const { breedId, locationId, gender, isBreeder, femaleCondition, ageRange } = route.params || {};
    const now = new Date();

    // Strict filters from navigation
    if (breedId) result = result.filter(a => a.breedId === breedId);
    if (locationId) result = result.filter(a => a.locationId === locationId);
    if (gender) result = result.filter(a => a.gender === gender);
    if (isBreeder !== undefined) result = result.filter(a => a.isBreeder === isBreeder);
    if (femaleCondition) result = result.filter(a => a.femaleCondition === femaleCondition);

    if (ageRange) {
      result = result.filter(a => {
        if (!a.birthDate) return false;
        const bDate = new Date(a.birthDate);
        const age = (now.getFullYear() - bDate.getFullYear()) * 12 + (now.getMonth() - bDate.getMonth());
        
        if (ageRange === '0-3') return age >= 0 && age < 3;
        if (ageRange === '3-6') return age >= 3 && age < 6;
        if (ageRange === '6-9') return age >= 6 && age < 9;
        return true;
      });
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(animal => 
        animal.tagNumber.toLowerCase().includes(q) ||
        (animal.Breed?.name && animal.Breed.name.toLowerCase().includes(q)) ||
        (animal.Location?.name && animal.Location.name.toLowerCase().includes(q)) ||
        (animal.gender && animal.gender.toLowerCase().startsWith(q))
      );
    }
    
    // Apply Advanced Filters
    if (activeFilters.sheds?.length > 0) {
      const lowerSheds = activeFilters.sheds.map(s => s.toLowerCase());
      result = result.filter(a => lowerSheds.includes((a.Location?.name || '').toLowerCase()));
    }
    if (activeFilters.status?.length > 0) {
      const lowerStatus = activeFilters.status.map(s => s.toLowerCase());
      result = result.filter(a => lowerStatus.includes((a.status || '').toLowerCase()));
    }
    if (activeFilters.gender?.length > 0) {
      const lowerGender = activeFilters.gender.map(s => s.toLowerCase());
      result = result.filter(a => lowerGender.includes((a.gender || '').toLowerCase()));
    }
    if (activeFilters.breeds?.length > 0) {
      const lowerBreeds = activeFilters.breeds.map(s => s.toLowerCase());
      result = result.filter(a => lowerBreeds.includes((a.Breed?.name || '').toLowerCase()));
    }
    if (activeFilters.animalTypes?.length > 0) {
      const lowerTypes = activeFilters.animalTypes.map(s => s.toLowerCase());
      result = result.filter(a => lowerTypes.includes((a.animalType || '').toLowerCase()));
    }
    if (activeFilters.origins?.length > 0) {
      const lowerOrigins = activeFilters.origins.map(s => s.toLowerCase());
      result = result.filter(a => lowerOrigins.includes((a.Breed?.origin || '').toLowerCase()));
    }

    if (activeFilters.timeAdded && activeFilters.timeAdded !== 'All') {
      const timeDate = new Date();
      if (activeFilters.timeAdded === 'Today') timeDate.setHours(0, 0, 0, 0);
      else if (activeFilters.timeAdded === 'Recently (24h)') timeDate.setHours(timeDate.getHours() - 24);
      else if (activeFilters.timeAdded === 'Last 1 Week') timeDate.setDate(timeDate.getDate() - 7);
      else if (activeFilters.timeAdded === 'Last 1 Month') timeDate.setMonth(timeDate.getMonth() - 1);
      else if (activeFilters.timeAdded === 'Last 3 Months') timeDate.setMonth(timeDate.getMonth() - 3);
      else if (activeFilters.timeAdded === 'Last 6 Months') timeDate.setMonth(timeDate.getMonth() - 6);
      else if (activeFilters.timeAdded === 'Last 1 Year') timeDate.setFullYear(timeDate.getFullYear() - 1);
      result = result.filter(a => new Date(a.createdAt) >= timeDate);
    }

    if (activeFilters.weightValue) {
      const weightVal = parseFloat(activeFilters.weightValue);
      if (!isNaN(weightVal)) {
        if (activeFilters.weightCondition === 'Above') result = result.filter(a => a.currentWeight >= weightVal);
        else if (activeFilters.weightCondition === 'Below') result = result.filter(a => a.currentWeight <= weightVal);
        else if (activeFilters.weightCondition === 'Between' && activeFilters.weightMax) {
          const maxVal = parseFloat(activeFilters.weightMax);
          if (!isNaN(maxVal)) result = result.filter(a => a.currentWeight >= weightVal && a.currentWeight <= maxVal);
        }
      }
    }

    if (activeFilters.priceValue) {
      const priceVal = parseFloat(activeFilters.priceValue);
      if (!isNaN(priceVal)) {
        if (activeFilters.priceCondition === 'Above') result = result.filter(a => a.netSalePrice >= priceVal);
        else if (activeFilters.priceCondition === 'Below') result = result.filter(a => a.netSalePrice <= priceVal);
        else if (activeFilters.priceCondition === 'Between' && activeFilters.priceMax) {
          const maxVal = parseFloat(activeFilters.priceMax);
          if (!isNaN(maxVal)) result = result.filter(a => a.netSalePrice >= priceVal && a.netSalePrice <= maxVal);
        }
      }
    }
    
    setFilteredAnimals(result);
  }, [searchQuery, animals, route.params, activeFilters]);

  const fetchAnimals = async (pageNumber = 1, filtersOverride = null, sortByOverride = null, sortOrderOverride = null) => {
    try {
      if (pageNumber === 1) setLoading(true);
      else setIsFetchingMore(true);

      // Use passed-in filters if provided (needed because setState is async)
      const filtersToApply = filtersOverride !== null ? filtersOverride : activeFilters;
      const currentSortBy = sortByOverride !== null ? sortByOverride : sortBy;
      const currentSortOrder = sortOrderOverride !== null ? sortOrderOverride : sortOrder;
      const genderArr = filtersToApply?.gender || [];

      // Build query string — send gender to backend when exactly one is selected.
      // Selecting both Male & Female = no restriction, so we skip the param.
      let url = `/animals?page=${pageNumber}&limit=30&sortBy=${currentSortBy}&sortOrder=${currentSortOrder}`;
      if (genderArr.length === 1) {
        url += `&gender=${genderArr[0].toUpperCase()}`;
      }

      const typeArr = filtersToApply?.animalTypes || [];
      if (typeArr.length === 1) {
        url += `&animalType=${typeArr[0].toUpperCase()}`;
      }

      const statusArr = filtersToApply?.status || [];
      if (statusArr.length === 1) {
        url += `&status=${statusArr[0].toUpperCase()}`;
      }

      const breedArr = filtersToApply?.breeds || [];
      if (breedArr.length === 1 && allBreeds.length > 0) {
        const selectedBreed = allBreeds.find(b => b.name === breedArr[0]);
        if (selectedBreed) {
          url += `&breedId=${selectedBreed.id}`;
        }
      }

      const shedArr = filtersToApply?.sheds || [];
      if (shedArr.length === 1 && allLocations.length > 0) {
        const selectedLoc = allLocations.find(l => l.name === shedArr[0]);
        if (selectedLoc) {
          url += `&locationId=${selectedLoc.id}`;
        }
      }

      const timeAddedVal = filtersToApply?.timeAdded;
      if (timeAddedVal && timeAddedVal !== 'All') {
        let backendTime = '';
        if (timeAddedVal === 'Today') backendTime = 'Today';
        else if (timeAddedVal === 'Recently (24h)') backendTime = '24h';
        else if (timeAddedVal === 'Last 1 Week') backendTime = '1week';
        else if (timeAddedVal === 'Last 1 Month') backendTime = '1month';
        else if (timeAddedVal === 'Last 3 Months') backendTime = '3months';
        else if (timeAddedVal === 'Last 6 Months') backendTime = '6months';
        else if (timeAddedVal === 'Last 1 Year') backendTime = '1year';

        if (backendTime) {
          url += `&timeAdded=${backendTime}`;
        }
      }

      const response = await api.get(url);
      
      const fetchedAnimals = response.data.animals || [];
      const paginationInfo = response.data.pagination || { page: 1, totalPages: 1 };
      
      if (pageNumber === 1) {
        await saveToCache('animals', fetchedAnimals);
        setAnimals(fetchedAnimals);
      } else {
        setAnimals(prev => {
          const newAnimals = [...prev, ...fetchedAnimals];
          return newAnimals.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i); // Ensure no duplicates
        });
      }
      
      setPage(paginationInfo.page);
      setTotalPages(paginationInfo.totalPages);

      setLoading(false);
      setIsFetchingMore(false);
    } catch (error) {
      console.warn('Fetch animals failed, looking for cache...', error);
      
      if (pageNumber === 1) {
        const cachedData = await getFromCache('animals');
        if (cachedData) {
          setAnimals(cachedData);
          setFilteredAnimals(cachedData);
        } else {
          console.error('No cached animals found.');
        }
      }
      setLoading(false);
      setIsFetchingMore(false);
    }
  };

  const loadMoreAnimals = () => {
    if (!isFetchingMore && page < totalPages && !loading) {
      fetchAnimals(page + 1, activeFilters);
    }
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds([]);
  };

  const handleLongPress = (item) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      // Ensure the ID is always a string to prevent UUID casting errors
      setSelectedIds([String(item.id)]);
    }
  };

  const toggleSelection = (id) => {
    const stringId = String(id);
    if (selectedIds.includes(stringId)) {
      const next = selectedIds.filter(idx => idx !== stringId);
      setSelectedIds(next);
      if (next.length === 0) setIsSelectionMode(false);
    } else {
      setSelectedIds([...selectedIds, stringId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredAnimals.length) {
      setSelectedIds([]);
      setIsSelectionMode(false);
    } else {
      setSelectedIds(filteredAnimals.map(a => a.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setIsDeleteModalVisible(true);
  };

  const confirmBulkDelete = async () => {
    setIsDeleteModalVisible(false);
    setDeleting(true);
    try {
      await api.delete('/animals/bulk', { data: { ids: selectedIds } });
      // Success - refresh list
      await fetchAnimals(1);
      exitSelectionMode();
      showAlert(t('common.deleted', 'Deleted'), t('animalList.deleteSuccess', 'Successfully removed {{count}} animals.', {count: selectedIds.length}), 'success');
    } catch (error) {
      const message = error.response?.data?.error || error.response?.data?.message || 'Failed to delete animals';
      showAlert('Delete Error', message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const toggleSearch = () => {
    if (isSearching) {
      setSearchQuery('');
      Animated.timing(searchBarTranslateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsSearching(false));
    } else {
      setIsSearching(true);
      Animated.timing(searchBarTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedIds.includes(item.id);
    
    return (
      <TouchableOpacity 
        style={[
          styles.animalItem, 
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          isSelected && { borderColor: theme.colors.primary, backgroundColor: isDarkMode ? '#1E1E1E' : '#fafafa' }
        ]}
        onPress={() => isSelectionMode ? toggleSelection(item.id) : navigation.navigate('EditAnimal', { animal: item })}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.7}
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.animalThumbnail} />
        ) : (
          <View style={[styles.animalThumbnail, { backgroundColor: isDarkMode ? '#222' : '#F3F4F6', justifyContent: 'center', alignItems: 'center' }]}>
             <Text style={{ fontSize: 10, color: theme.colors.textMuted }}>{t('common.noImage', 'No Image')}</Text>
          </View>
        )}

        <View style={styles.animalInfo}>
          <View style={styles.tagWrapper}>
            <Text style={[styles.tagNumber, { color: theme.colors.text }]}>{item.tagNumber}</Text>
          </View>
          <Text style={[styles.breedName, { color: theme.colors.textLight }]}>
            {item.Breed?.name} • {item.gender ? t('enums.' + item.gender.toLowerCase(), item.gender.charAt(0).toUpperCase() + item.gender.slice(1).toLowerCase()) : ''}
          </Text>
          {item.Location && (
            <View style={[styles.locationTag, { backgroundColor: isDarkMode ? '#222' : '#F3F4F6' }]}>
              <MapPin size={12} color={theme.colors.textLight} style={styles.locIcon} />
              <Text style={[styles.locationName, { color: theme.colors.textLight }]}>
                {item.Location.name ? (item.Location.name.charAt(0).toUpperCase() + item.Location.name.slice(1).toLowerCase()) : ''}
              </Text>
            </View>
          )}
        </View>
        <View style={[styles.statusBadge, styles[`status${item.status}`]]}>
          <Text style={styles.statusText}>
            {item.status ? t('enums.' + item.status.toLowerCase(), item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase()) : ''}
          </Text>
        </View>
        
        {isSelectionMode ? (
          <View style={styles.checkboxWrapper}>
            <View style={[
              styles.checkbox, 
              isSelected ? styles.checkboxSelected : styles.checkboxUnselected,
              isSelected && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
            ]}>
              {isSelected && <Check size={14} color="white" strokeWidth={3} />}
            </View>
          </View>
        ) : (
          <ChevronRight size={20} color={theme.colors.textMuted} />
        )}
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <SearchX size={64} color={theme.colors.border} />
      <Text style={[styles.noRecords, { color: theme.colors.text }]}>
        {searchQuery ? t('animalList.noMatch', "No matching animals found") : t('animalList.noAnimals', "No Animals found")}
      </Text>
      {!searchQuery && (
        <Text style={[styles.emptyDescription, { color: theme.colors.textLight }]}>
          {t('animalList.emptyDesc', 'Start managing your farm by adding your first goat or sheep. Click the button below to register an animal.')}
        </Text>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={hideAlert}
      />

      <AnimalFilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        animals={animals}
        initialFilters={activeFilters}
        allBreeds={allBreeds}
        allLocations={allLocations}
        onApply={(filters) => {
          setActiveFilters(filters);
          setIsFilterModalVisible(false);
          // Re-fetch from page 1 with new filters (pass directly — setActiveFilters is async)
          fetchAnimals(1, filters);
        }}
      />

      <Modal
        transparent
        visible={isSortModalVisible}
        animationType="slide"
        onRequestClose={() => setIsSortModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.sortModalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsSortModalVisible(false)}
        >
          <View style={styles.sortModalContent}>
            <View style={styles.sortModalHeader}>
              <Text style={styles.sortModalTitle}>{t('animalList.sortBy', 'Sort By')}</Text>
              <TouchableOpacity onPress={() => setIsSortModalVisible(false)}>
                <X size={20} color={theme.colors.textLight} />
              </TouchableOpacity>
            </View>
            
            {[
              { key: 'newest', label: t('animalList.sortNewest', 'Newest Added'), sortBy: 'created_at', sortOrder: 'desc' },
              { key: 'oldest', label: t('animalList.sortOldest', 'Oldest Added'), sortBy: 'created_at', sortOrder: 'asc' },
              { key: 'tag_asc', label: t('animalList.sortTagAsc', 'Tag Number (A-Z)'), sortBy: 'tag_number', sortOrder: 'asc' },
              { key: 'tag_desc', label: t('animalList.sortTagDesc', 'Tag Number (Z-A)'), sortBy: 'tag_number', sortOrder: 'desc' },
              { key: 'age_youngest', label: t('animalList.sortAgeYoungest', 'Youngest Age'), sortBy: 'birth_date', sortOrder: 'desc' },
              { key: 'age_oldest', label: t('animalList.sortAgeOldest', 'Oldest Age'), sortBy: 'birth_date', sortOrder: 'asc' },
              { key: 'weight_desc', label: t('animalList.sortWeightDesc', 'Weight (Highest)'), sortBy: 'current_weight', sortOrder: 'desc' },
              { key: 'weight_asc', label: t('animalList.sortWeightAsc', 'Weight (Lowest)'), sortBy: 'current_weight', sortOrder: 'asc' }
            ].map((option) => {
              const isSelected = sortBy === option.sortBy && sortOrder === option.sortOrder;
              return (
                <TouchableOpacity 
                  key={option.key} 
                  style={styles.sortOptionRow}
                  onPress={() => {
                    setSortBy(option.sortBy);
                    setSortOrder(option.sortOrder);
                    setIsSortModalVisible(false);
                    fetchAnimals(1, activeFilters, option.sortBy, option.sortOrder);
                  }}
                >
                  <Text style={[
                    styles.sortOptionText, 
                    isSelected && { color: theme.colors.primary, fontFamily: 'Inter_700Bold' }
                  ]}>
                    {option.label}
                  </Text>
                  {isSelected && <Check size={18} color={theme.colors.primary} strokeWidth={3} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {isSelectionMode ? (
        <View style={[styles.selectionHeader, { paddingTop: insets.top + 10, paddingBottom: 10 }]}>
            <TouchableOpacity onPress={exitSelectionMode} style={styles.headerButton}>
                <Text style={[styles.headerButtonText, { color: theme.colors.primary }]}>{t('common.cancel', 'Cancel')}</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={[styles.selectionTitle, { color: theme.colors.text }]}>
                    {selectedIds.length === 0 ? t('common.selectItems', 'Select items') : t('common.selectedCount', '{{count}} selected', {count: selectedIds.length})}
                </Text>
            </View>
            <TouchableOpacity onPress={handleSelectAll} style={[styles.headerButton, { alignItems: 'flex-end' }]}>
                <Text style={[styles.headerButtonText, { color: theme.colors.primary }]}>
                    {selectedIds.length === filteredAnimals.length ? t('common.none', 'None') : t('common.all', 'All')}
                </Text>
            </TouchableOpacity>
        </View>
      ) : (
        <GHeader 
          title={t('animalList.title', 'Animals List')} 
          onMenu={!navigation.canGoBack() ? () => navigation.openDrawer() : undefined} 
          onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} 
          leftAlign={true}
          rightIcon={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingRight: 4 }}>
              <TouchableOpacity onPress={() => setIsSortModalVisible(true)}>
                <ArrowUpDown color={theme.colors.white} size={22} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(true)} style={{ position: 'relative' }}>
                <Filter color={theme.colors.white} size={22} />
                {Object.keys(activeFilters).length > 0 && Object.values(activeFilters).some(v => Array.isArray(v) ? v.length > 0 : v && v !== 'All') && (
                  <View style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }} />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleSearch}>
                {isSearching ? <X color={theme.colors.white} size={24} /> : <Search color={theme.colors.white} size={24} />}
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {isSearching && (
        <Animated.View style={[styles.searchBarContainer, { backgroundColor: theme.colors.surface, transform: [{ translateY: searchBarTranslateY }] }]}>
          <View style={[styles.searchInner, { backgroundColor: isDarkMode ? '#000' : '#F9FAFB' }]}>
            <Search size={20} color={theme.colors.textLight} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder={t('animalList.searchPlaceholder', "Search tag, breed, location or gender...")}
              placeholderTextColor={theme.colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={18} color={theme.colors.textLight} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <>
          <FlatList
            data={filteredAnimals}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            ListEmptyComponent={EmptyState}
            contentContainerStyle={[
              styles.listContent, 
              isSearching && { paddingTop: 20 }, 
              isSelectionMode && { paddingBottom: 120 }
            ]}
            keyboardShouldPersistTaps="handled"
            onEndReached={loadMoreAnimals}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isFetchingMore ? (
                <View style={{ paddingVertical: 20 }}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                </View>
              ) : null
            }
          />

          {!isSelectionMode && (
            <TouchableOpacity 
              style={[styles.fab, { backgroundColor: theme.colors.primary, ...theme.shadow.lg }]}
              onPress={() => navigation.navigate('AddAnimal')}
              activeOpacity={0.8}
            >
              <Plus color={theme.colors.white} size={30} strokeWidth={2.5} />
            </TouchableOpacity>
          )}

          {isSelectionMode && (
            <View style={styles.bottomActions}>
              <TouchableOpacity 
                style={styles.deleteAction} 
                onPress={handleBulkDelete}
                disabled={selectedIds.length === 0}
              >
                <Trash2 color={selectedIds.length === 0 ? theme.colors.textMuted : theme.colors.primary} size={24} />
                <Text style={[styles.deleteText, { color: selectedIds.length === 0 ? theme.colors.textMuted : theme.colors.primary }]}>{t('common.delete', 'Delete')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Bulk Delete Modal */}
          <Modal
            transparent
            visible={isDeleteModalVisible}
            animationType="fade"
            onRequestClose={() => setIsDeleteModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalIconContainer}>
                  <View style={styles.iconCircle}>
                    <Trash2 color="#F97316" size={32} />
                  </View>
                </View>
                
                <Text style={styles.modalTitle}>{t('common.confirmDelete', 'Confirm Delete?')}</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedIds.length === 1 
                    ? t('animalList.deleteConfirmMsgSingle', 'Are you sure you want to delete this animal? This action cannot be undone.') 
                    : t('animalList.deleteConfirmMsg', 'Are you sure you want to delete these {{count}} animals? This action cannot be undone.', {count: selectedIds.length})}
                </Text>
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.modalCancelButton} 
                    onPress={() => setIsDeleteModalVisible(false)}
                  >
                    <Text style={styles.modalCancelText}>{t('common.cancel', 'Cancel')}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.modalDeleteButton} 
                    onPress={confirmBulkDelete}
                  >
                    <Text style={styles.modalDeleteText}>{t('common.delete', 'Delete')}</Text>
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
  container: {
    flex: 1,
  },
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
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    zIndex: 5,
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
    fontFamily: 'Inter_500Medium',
  },
  actionRow: {
    padding: 16,
    paddingBottom: 8,
    alignItems: 'flex-end',
    maxWidth: 768,
    width: '100%',
    alignSelf: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  plusIcon: {
    marginRight: 8,
  },
  addButtonText: {
    color: 'white',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  listHeader: {
    marginBottom: 20,
    width: '100%',
  },
  infoCard: {
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  summaryTitle: {
    fontSize: 22,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  summarySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginTop: 4,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 16,
  },
  statLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
    maxWidth: 768,
    width: '100%',
    alignSelf: 'center',
  },
  animalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  animalThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 14,
  },
  animalInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  tagWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tagIcon: {
    marginRight: 6,
  },
  tagNumber: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  breedName: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  locIcon: {
    marginRight: 4,
  },
  locationName: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  footerInfo: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 100,
    paddingHorizontal: 32,
  },
  noRecords: {
    fontSize: 18,
    fontFamily: 'Inter_500Medium',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: 'white',
  },
  statusLIVE: { backgroundColor: '#10B981' },
  statusSOLD: { backgroundColor: '#3B82F6' },
  statusDEAD: { backgroundColor: '#EF4444' },
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
  checkboxWrapper: { marginLeft: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  checkboxUnselected: { borderColor: theme.colors.border },
  checkboxSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    zIndex: 9999,
    elevation: 100,
  },
  deleteAction: { alignItems: 'center', justifyContent: 'center', flex: 1, height: '100%' },
  deleteText: { fontSize: 12, marginTop: 4, fontFamily: 'Inter_600SemiBold' },
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
    backgroundColor: '#FFF3E0',
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
  sortModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sortModalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    ...theme.shadow.lg,
  },
  sortModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sortModalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: theme.colors.text,
  },
  sortOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sortOptionText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: theme.colors.text,
  },
});

export default AnimalListScreen;
