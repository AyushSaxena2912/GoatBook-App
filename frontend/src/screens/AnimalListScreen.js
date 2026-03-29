import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Animated, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { lightTheme } from '../theme';
import GHeader from '../components/GHeader';
import { Search, Plus, ChevronRight, SearchX, X, MapPin } from 'lucide-react-native';
import api from '../api';
import { useFocusEffect } from '@react-navigation/native';
import { getFromCache, saveToCache } from '../utils/cache';

const AnimalListScreen = ({ navigation, route }) => {
  const { isDarkMode, theme } = useTheme();
  const [animals, setAnimals] = useState([]);
  const [filteredAnimals, setFilteredAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const searchBarTranslateY = useRef(new Animated.Value(-100)).current;

  useFocusEffect(
    useCallback(() => {
      fetchAnimals();
      if (route.params?.initialSearch) {
        setSearchQuery(route.params.initialSearch);
        setIsSearching(true);
      }
    }, [route.params])
  );

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

    // Search query filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(animal => 
        animal.tagNumber.toLowerCase().includes(q) ||
        (animal.Breed?.name && animal.Breed.name.toLowerCase().includes(q)) ||
        (animal.Location?.name && animal.Location.name.toLowerCase().includes(q))
      );
    }
    
    setFilteredAnimals(result);
  }, [searchQuery, animals, route.params]);

  const fetchAnimals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/animals');
      
      // Cache data
      await saveToCache('animals', response.data);
      
      setAnimals(response.data);
      setFilteredAnimals(response.data);
      setLoading(false);
    } catch (error) {
      console.warn('Fetch animals failed, looking for cache...', error);
      
      const cachedData = await getFromCache('animals');
      if (cachedData) {
        setAnimals(cachedData);
        setFilteredAnimals(cachedData);
      } else {
        console.error('No cached animals found.');
      }
      setLoading(false);
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

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.animalItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      onPress={() => navigation.navigate('EditAnimal', { animal: item })}
    >

      <View style={styles.animalInfo}>
        <Text style={[styles.tagNumber, { color: theme.colors.text }]}>Tag: {item.tagNumber}</Text>
        <Text style={[styles.breedName, { color: theme.colors.textLight }]}>{item.Breed?.name} • {item.gender}</Text>
        {item.Location && (
          <View style={[styles.locationTag, { backgroundColor: isDarkMode ? '#222' : '#F3F4F6' }]}>
            <MapPin size={12} color={theme.colors.textLight} style={styles.locIcon} />
            <Text style={[styles.locationName, { color: theme.colors.textLight }]}>{item.Location.name}</Text>
          </View>
        )}
      </View>
      <View style={[styles.statusBadge, styles[`status${item.status}`]]}>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
      <ChevronRight size={20} color={theme.colors.textMuted} />
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <SearchX size={64} color={theme.colors.border} />
      <Text style={[styles.noRecords, { color: theme.colors.text }]}>
        {searchQuery ? "No matching animals found" : "No Animals found"}
      </Text>
      {!searchQuery && (
        <Text style={[styles.emptyDescription, { color: theme.colors.textLight }]}>
          Start managing your farm by adding your first goat or sheep. Click the button below to register an animal.
        </Text>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader 
        title="Animals List" 
        onMenu={() => navigation.openDrawer()} 
        onBack={() => navigation.goBack()}
        rightIcon={isSearching ? <X color={theme.colors.white} size={24} /> : <Search color={theme.colors.white} size={24} />}
        onRightPress={toggleSearch}
      />

      {isSearching && (
        <Animated.View style={[styles.searchBarContainer, { backgroundColor: theme.colors.surface, transform: [{ translateY: searchBarTranslateY }] }]}>
          <View style={[styles.searchInner, { backgroundColor: isDarkMode ? '#000' : '#F9FAFB' }]}>
            <Search size={20} color={theme.colors.textLight} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Search tag, breed or location..."
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
      
      {!isSearching && (
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('AddAnimal')}
          >
            <Plus color={theme.colors.white} size={20} style={styles.plusIcon} />
            <Text style={styles.addButtonText}>Add Animal</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredAnimals}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ListEmptyComponent={EmptyState}
          contentContainerStyle={[styles.listContent, isSearching && { paddingTop: 20 }]}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDarkMode ? 0.3 : 0.05,
    shadowRadius: 2,
    elevation: 2,
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
    fontFamily: 'Montserrat_500Medium',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  plusIcon: {
    marginRight: 8,
  },
  addButtonText: {
    color: 'white',
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    maxWidth: 768,
    width: '100%',
    alignSelf: 'center',
  },
  animalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDarkMode ? 0.3 : 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  animalInfo: {
    flex: 1,
  },
  tagNumber: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
  },
  breedName: {
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'Montserrat_500Medium',
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  locIcon: {
    marginRight: 4,
  },
  locationName: {
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  noRecords: {
    fontSize: 18,
    fontFamily: 'Montserrat_500Medium',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Montserrat_400Regular',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Montserrat_600SemiBold',
    color: 'white',
  },
  statusLIVE: { backgroundColor: '#10B981' },
  statusSOLD: { backgroundColor: '#3B82F6' },
  statusDEAD: { backgroundColor: '#EF4444' },
});

export default AnimalListScreen;
