import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Animated, Platform, SafeAreaView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import { Search, Plus, ChevronRight, LayoutGrid, SearchX, X, MapPin } from 'lucide-react-native';
import api from '../api';
import { useFocusEffect } from '@react-navigation/native';
import { SPACING, SHADOW } from '../theme';
import GInput from '../components/GInput';

const LocationListScreen = ({ navigation }) => {
  const { isDarkMode, theme } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const searchInputRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      fetchLocations();
    }, [])
  );

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredLocations(locations);
    } else {
      const q = searchQuery.toLowerCase();
      const filtered = locations.filter(loc => 
        loc.name?.toLowerCase().includes(q) ||
        loc.displayName?.toLowerCase().includes(q) ||
        loc.code?.toLowerCase().includes(q)
      );
      setFilteredLocations(filtered);
    }
  }, [searchQuery, locations]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/locations');
      setLocations(response.data);
      setFilteredLocations(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Fetch locations error:', error);
      setLoading(false);
    }
  };

  const handleSearchPress = () => {
    setIsSearchVisible(!isSearchVisible);
    if (!isSearchVisible) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery('');
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.locationCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => navigation.navigate('LocationDetails', { locationId: item.id })}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: theme.colors.primary + '10' }]}>
        <LayoutGrid size={24} color={theme.colors.primary} />
      </View>
      <View style={styles.locationInfo}>
        <Text style={[styles.locationName, { color: theme.colors.text }]} numberOfLines={1}>
          {item.displayName || item.name}
        </Text>
        <View style={styles.metaRow}>
           <View style={[styles.metaBadge, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.metaText, { color: theme.colors.textLight }]}>
                {item.animalCount || 0} Animals
              </Text>
           </View>
           <View style={styles.dot} />
           <Text style={[styles.locationCode, { color: theme.colors.textMuted }]}>
             {item.code || 'SHED'}
           </Text>
        </View>
      </View>
      <View style={[styles.chevronWrapper, { backgroundColor: theme.colors.background }]}>
        <ChevronRight size={18} color={theme.colors.textMuted} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader 
        title="Shed List" 
        onBack={() => navigation.goBack()}
        leftAlign={true}
        rightIcon={isSearchVisible ? <X size={24} color="#FFF" /> : <Search size={24} color="#FFF" />}
        onRightPress={handleSearchPress}
      />

      <View style={styles.content}>
        {isSearchVisible && (
          <View style={styles.searchContainer}>
            <GInput 
              ref={searchInputRef}
              placeholder="Search by name or code..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              leftIcon={<Search size={20} color={theme.colors.textMuted} />}
              containerStyle={styles.searchBar}
            />
          </View>
        )}

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredLocations}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                  <View style={[styles.emptyIconWrapper, { backgroundColor: theme.colors.surface }]}>
                    <SearchX size={48} color={theme.colors.textMuted} />
                  </View>
                  <Text style={[styles.noRecords, { color: theme.colors.text }]}>No records found</Text>
                  <Text style={[styles.emptyDesc, { color: theme.colors.textLight }]}>
                    Your farm locations will appear here once added.
                  </Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('CreateLocation')}
        activeOpacity={0.8}
      >
        <Plus color="#FFF" size={32} />
      </TouchableOpacity>
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
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
  },
  searchBar: {
    marginVertical: 0,
    ...SHADOW.small,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 16,
    paddingBottom: 120,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    ...SHADOW.small,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.colors.textMuted,
  },
  locationCode: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  chevronWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...SHADOW.small,
  },
  noRecords: {
    fontSize: 19,
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
  },
  emptyDesc: {
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
    opacity: 0.7,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.large,
  }
});

export default LocationListScreen;
