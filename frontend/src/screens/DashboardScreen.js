import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, FlatList, ScrollView, Platform, Modal, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../theme/ThemeContext';
import { useFarmSettings } from '../context/FarmSettingsContext';
import { useFocusEffect, CommonActions } from '@react-navigation/native';
import { CLEARED_ANIMAL_LIST_PARAMS } from '../utils/animalListNav';
import { 
  Menu, User, Home, Syringe, Scale,
  Heart, Activity, ClipboardList, Globe, Settings, Briefcase,
  Moon, Sun, RefreshCcw, Milk, Sliders, Bell, Leaf,
  StickyNote, Stethoscope, Search, X, SearchX
} from 'lucide-react-native';
import api from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStyles } from './DashboardScreen.styles';
import { registerForPushNotificationsAsync } from '../utils/notificationService';
import AnimalIcon from '../components/AnimalIcon';
import MatingIcon from '../components/MatingIcon';
import BreedIcon from '../components/BreedIcon';
import BreedingIcon from '../components/BreedingIcon';
import { useTranslation } from 'react-i18next';


const DashboardScreen = ({ navigation }) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { refreshFarmSettings } = useFarmSettings();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [farmName, setFarmName] = useState('Goatwala Farm');
  const [userRole, setUserRole] = useState(null);
  const [soonVisible, setSoonVisible] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [animalResults, setAnimalResults] = useState([]);
  const [searchingAnimals, setSearchingAnimals] = useState(false);

  // Memoize styles to avoid re-calculation on every render
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  
  useEffect(() => {
    // Register for push notifications on app start
    registerForPushNotificationsAsync().catch(err =>
      console.error('Failed to register for push notifications:', err)
    );
  }, []);

  // Debounced live animal search inside the search modal
  useEffect(() => {
    const query = searchQuery.trim();
    if (!searchVisible || query.length < 2) {
      setAnimalResults([]);
      setSearchingAnimals(false);
      return;
    }

    setSearchingAnimals(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/animals?page=1&limit=6&search=${encodeURIComponent(query)}`);
        setAnimalResults(res.data?.animals || []);
      } catch (err) {
        console.warn('Dashboard search: Failed to fetch animals:', err);
        setAnimalResults([]);
      } finally {
        setSearchingAnimals(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, searchVisible]);

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      const animalRoute = parent?.getState?.()?.routes?.find((r) => r.name === 'AnimalList');
      if (animalRoute?.key) {
        parent.dispatch({
          ...CommonActions.setParams({ ...CLEARED_ANIMAL_LIST_PARAMS, listReset: true }),
          source: animalRoute.key,
        });
      }

      const loadDashboardData = async () => {
        try {
          // 1. Get current farm ID (Check header first, then storage)
          let currentFarmId = api.defaults.headers.common['X-Farm-ID'];
          if (!currentFarmId) {
            currentFarmId = await AsyncStorage.getItem('selectedFarmId');
          }

          // 2. Fetch profile
          const res = await api.get('/users/profile');
          const ep = res.data.employeeProfile;
          setUserRole(ep?.employeeType || 'EMPLOYEE');

          // 3. Find and set farm name
          if (ep?.farms && ep.farms.length > 0) {
            const farm = ep.farms.find(f => f.id === currentFarmId) || ep.farms[0];
            if (farm) setFarmName(farm.name);
          }

          // 4. Fetch analytics
          const analyticsRes = await api.get('/analytics/dashboard');
          setAnalytics(analyticsRes.data);

          // 5. Refresh farm-wide settings (units, allowed species) now that we're authenticated
          refreshFarmSettings();

        } catch (err) {
          console.warn('Dashboard: Failed to load data:', err);
          if (err.response?.status === 401) {
            navigation.replace('Login');
          }
        }
      };

      setLoading(true);
      loadDashboardData().finally(() => setLoading(false));
    }, [navigation, refreshFarmSettings])
  );

  const tiles = useMemo(() => {
    const allTiles = [
      { id: '1', title: t('actions.breed', 'Breed'), icon: <BreedIcon size={32} color={theme.colors.primary} />, screen: 'BreedList' },
      { id: '2', title: t('actions.animals', 'Animals'), icon: <AnimalIcon size={32} color={theme.colors.primary} />, screen: 'AnimalList' },
      { id: '3', title: t('actions.employee', 'Employee'), icon: <User color={theme.colors.primary} size={28} strokeWidth={1.8} />, screen: 'EmployeeList' },
      { id: '4', title: t('actions.animalShed', 'Animal Shed'), icon: <Home color={theme.colors.primary} size={28} strokeWidth={1.8} />, screen: 'LocationMenu' },
      { id: '5', title: t('actions.vaccines', 'Vaccines'), icon: <Syringe color={theme.colors.primary} size={28} strokeWidth={1.8} />, screen: 'VaccinesMenu' },
      { id: '6', title: t('actions.weight', 'Weight'), icon: <Scale color={theme.colors.primary} size={28} strokeWidth={1.8} />, screen: 'AddWeight' },
      { id: '7', title: t('actions.mating', 'Mating'), icon: <MatingIcon size={32} color={theme.colors.primary} />, screen: 'MatingList' },
      { id: '8', title: t('actions.breeding', 'Breeding'), icon: <BreedingIcon size={32} color={theme.colors.primary} />, screen: 'BreedingList' },
      { id: '9', title: t('actions.report', 'Report'), icon: <ClipboardList color={theme.colors.primary} size={28} strokeWidth={1.8} />, screen: 'ReportsMenu' },
      { id: '17', title: t('menu.notes', 'Notes'), icon: <StickyNote color={theme.colors.primary} size={28} strokeWidth={1.8} />, screen: 'NoteList' },
      { id: '19', title: t('menu.treatment', 'Treatment'), icon: <Stethoscope color={theme.colors.primary} size={28} strokeWidth={1.8} />, screen: 'TreatmentList' },
      { id: '10', title: t('actions.language', 'Language'), icon: <Globe color={theme.colors.primary} size={28} strokeWidth={1.8} />, screen: 'LanguageSelection' },
      { id: '11', title: t('actions.settings', 'Settings'), icon: <Settings color={theme.colors.primary} size={28} strokeWidth={1.8} />, screen: 'Settings' },
      { id: '12', title: t('actions.financials', 'Financials'), icon: <Briefcase color={theme.colors.primary} size={28} strokeWidth={1.8} />, screen: 'FinancialList' },
      { id: '13', title: t('actions.replaceTag', 'Replace Tag'), icon: <RefreshCcw color={theme.colors.primary} size={28} strokeWidth={1.8} />, screen: 'ReplaceTag' },
      { id: '14', title: t('actions.milkRecords', 'Milk Records'), icon: <Milk color={theme.colors.primary} size={28} strokeWidth={1.8} />, screen: null },
      { id: '15', title: t('actions.farmSetting', 'Farm Setting'), icon: <Sliders color={theme.colors.primary} size={28} strokeWidth={1.8} />, screen: 'FarmPreferences' },
      { id: '16', title: t('actions.feedFormulation', 'Feed Formulation'), icon: <Leaf color={theme.colors.primary} size={28} strokeWidth={1.8} />, screen: 'FormulationList' },
    ];

    // Filter out 'Employee' tile for non-OWNER roles
    return allTiles.filter(tile => {
      if (tile.id === '3' && userRole && userRole !== 'OWNER') return false;
      return true;
    });
  }, [theme, userRole, t]);

  const goToTile = (item) => {
    if (item.screen === 'AnimalList') {
      navigation.navigate('AnimalList', { ...CLEARED_ANIMAL_LIST_PARAMS });
    } else if (item.screen) {
      navigation.navigate(item.screen);
    } else {
      setSoonVisible(true);
    }
  };

  const renderTile = ({ item }) => (
    <TouchableOpacity
      style={styles.tile}
      onPress={() => goToTile(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.tileIconContainer, { backgroundColor: theme.colors.primary + '10' }]}>
        {item.icon}
      </View>
      <Text style={styles.tileTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  const matchedTiles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length < 1) return [];
    return tiles.filter(tile => tile.title.toLowerCase().includes(query));
  }, [tiles, searchQuery]);

  const closeSearch = () => {
    setSearchVisible(false);
    setSearchQuery('');
    setAnimalResults([]);
  };

  const openAnimalFromSearch = (animal) => {
    closeSearch();
    navigation.navigate('EditAnimal', { animal });
  };

  const submitAnimalSearch = (query) => {
    const trimmed = (query ?? searchQuery).trim();
    if (!trimmed) return;
    closeSearch();
    navigation.navigate('AnimalList', { ...CLEARED_ANIMAL_LIST_PARAMS, initialSearch: trimmed });
  };

  const goToTileFromSearch = (item) => {
    closeSearch();
    goToTile(item);
  };

  const openAnimals = (filters = {}) => {
    navigation.navigate('AnimalList', {
      ...CLEARED_ANIMAL_LIST_PARAMS,
      listReset: false,
      ...filters,
    });
  };

  const StatChip = ({ label, value, onPress }) => (
    <TouchableOpacity style={styles.statChip} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.statChipValue}>{value ?? 0}</Text>
      <Text style={styles.statChipLabel} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );

  const renderDashboardHeader = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20, marginBottom: 40 }} />;
    }

    if (!analytics) return null;

    const { metrics } = analytics;
    const live = metrics.liveAnimals ?? metrics.totalAnimals ?? 0;
    const male = metrics.male ?? 0;
    const female = metrics.female ?? 0;
    const year = new Date().getFullYear();

    return (
      <View>
        <Text style={styles.sectionTitle}>{t('dashboard.overview', 'Farm summary')}</Text>

        <TouchableOpacity
          style={styles.heroCard}
          onPress={() => openAnimals({ status: 'LIVE' })}
          activeOpacity={0.7}
        >
          <View style={[styles.kpiIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
            <AnimalIcon color={theme.colors.primary} size={16} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.heroLabel}>{t('dashboard.liveAnimals', 'Live animals')}</Text>
            <Text style={styles.heroValue}>{live}</Text>
          </View>
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statScroll}
          contentContainerStyle={styles.statScrollContent}
        >
          <StatChip
            label={t('dashboard.male', 'Male')}
            value={male}
            onPress={() => openAnimals({ gender: 'MALE', status: 'LIVE' })}
          />
          <StatChip
            label={t('dashboard.female', 'Female')}
            value={female}
            onPress={() => openAnimals({ gender: 'FEMALE', status: 'LIVE' })}
          />
          <StatChip
            label={t('dashboard.pregnant', 'Pregnant')}
            value={metrics.pregnant}
            onPress={() => openAnimals({ femaleCondition: 'PREGNANT', status: 'LIVE' })}
          />
          <StatChip
            label={t('dashboard.breeders', 'Breeders')}
            value={metrics.breeders ?? metrics.breedingDoes}
            onPress={() => openAnimals({ isBreeder: true, status: 'LIVE' })}
          />
          <StatChip
            label={t('dashboard.kids0_3Short', '0–3 mo')}
            value={metrics.kids0_3}
            onPress={() => openAnimals({ ageRange: '0-3', status: 'LIVE' })}
          />
          <StatChip
            label={t('dashboard.kids3_6Short', '3–6 mo')}
            value={metrics.kids3_6}
            onPress={() => openAnimals({ ageRange: '3-6', status: 'LIVE' })}
          />
          <StatChip
            label={t('dashboard.kids6_9Short', '6–9 mo')}
            value={metrics.kids6_9}
            onPress={() => openAnimals({ ageRange: '6-9', status: 'LIVE' })}
          />
        </ScrollView>

        <View style={styles.yearCard}>
          <Heart color={theme.colors.primary} size={16} />
          <Text style={styles.yearText}>
            {t('dashboard.thisYear', '{{year}}: {{born}} born · {{dead}} died · {{sold}} sold', {
              year,
              born: metrics.kidsBornThisYear ?? metrics.kidsBorn ?? 0,
              dead: metrics.deadThisYear ?? 0,
              sold: metrics.soldThisYear ?? 0,
            })}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>{t('dashboard.quickActions', 'Quick Actions')}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={theme.colors.primary} />
      
      {/* Header - Simple & Flat */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 15 : 10), paddingBottom: 15 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => navigation.openDrawer()}
          >
            <Menu color="#FFF" size={26} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{farmName}</Text>

          {/* Search Button */}
          <TouchableOpacity
            style={styles.themeToggle}
            onPress={() => setSearchVisible(true)}
          >
            <Search color="#FFF" size={22} strokeWidth={2} />
          </TouchableOpacity>

          {/* Notification Button */}
          <TouchableOpacity
            style={styles.themeToggle}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Bell color="#FFF" size={24} strokeWidth={2} />
            {analytics?.unreadNotifications > 0 && (
              <View style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 10,
                height: 10,
                backgroundColor: '#ef4444',
                borderRadius: 5,
                borderWidth: 2,
                borderColor: theme.colors.primary
              }} />
            )}
          </TouchableOpacity>

          {/* Theme Toggle Button */}
          <TouchableOpacity 
            style={styles.themeToggle}
            onPress={toggleTheme}
          >
            {isDarkMode ? (
              <Sun color="#FFF" size={24} strokeWidth={2} />
            ) : (
              <Moon color="#FFF" size={24} strokeWidth={2} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Grid with Analytics Header */}
      <View style={styles.content}>
        <FlatList
          data={tiles}
          renderItem={renderTile}
          keyExtractor={item => item.id}
          numColumns={3}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          bounces={true}
          ListHeaderComponent={renderDashboardHeader}
        />
      </View>

      {/* Custom Soon Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={soonVisible}
        onRequestClose={() => setSoonVisible(false)}
      >
        <TouchableOpacity 
           style={styles.modalOverlay} 
           activeOpacity={1} 
           onPress={() => setSoonVisible(false)}
        >
          <View style={styles.modalContent}>
             <View style={styles.modalIconContainer}>
                <Activity color={theme.colors.primary} size={40} strokeWidth={1.5} />
             </View>
             <Text style={styles.modalTitle}>{t('dashboard.comingSoon', 'Coming Soon!')}</Text>
             <Text style={styles.modalMessage}>
                {t('dashboard.comingSoonDesc', 'We are currently working on this module. This feature will be available soon!')}
             </Text>
             <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setSoonVisible(false)}
             >
                <Text style={styles.modalButtonText}>{t('common.gotIt', 'Got it')}</Text>
             </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Global Search Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={searchVisible}
        onRequestClose={closeSearch}
      >
        <View style={[styles.searchModalOverlay, { paddingTop: insets.top + 12 }]}>
          <View style={styles.searchModalBar}>
            <Search color={theme.colors.textLight} size={18} />
            <TextInput
              autoFocus
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => submitAnimalSearch()}
              placeholder={t('dashboard.searchPlaceholder', 'Search animals, notes, treatments...')}
              placeholderTextColor={theme.colors.textLight}
              style={styles.searchModalInput}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X color={theme.colors.textLight} size={18} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={closeSearch} style={styles.searchCancelBtn}>
            <Text style={styles.searchCancelText}>{t('common.cancel', 'Cancel')}</Text>
          </TouchableOpacity>

          <ScrollView
            style={styles.searchResultsScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {searchQuery.trim().length === 0 && (
              <Text style={styles.searchHint}>
                {t('dashboard.searchHint', 'Search animals by tag, breed or color — or jump straight to a module.')}
              </Text>
            )}

            {matchedTiles.length > 0 && (
              <View style={styles.searchSection}>
                <Text style={styles.searchSectionLabel}>{t('dashboard.searchModules', 'Modules')}</Text>
                {matchedTiles.map(tile => (
                  <TouchableOpacity
                    key={tile.id}
                    style={styles.searchResultRow}
                    onPress={() => goToTileFromSearch(tile)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.searchResultIcon, { backgroundColor: theme.colors.primary + '12' }]}>
                      {tile.icon}
                    </View>
                    <Text style={styles.searchResultTitle}>{tile.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {searchQuery.trim().length >= 2 && (
              <View style={styles.searchSection}>
                <Text style={styles.searchSectionLabel}>{t('dashboard.searchAnimals', 'Animals')}</Text>
                {searchingAnimals ? (
                  <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 16 }} />
                ) : animalResults.length === 0 ? (
                  <View style={styles.searchEmptyState}>
                    <SearchX color={theme.colors.textLight} size={22} />
                    <Text style={styles.searchEmptyText}>{t('dashboard.searchNoAnimals', 'No matching animals')}</Text>
                  </View>
                ) : (
                  animalResults.map(animal => (
                    <TouchableOpacity
                      key={animal.id}
                      style={styles.searchResultRow}
                      onPress={() => openAnimalFromSearch(animal)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.searchResultIcon, { backgroundColor: theme.colors.primary + '12' }]}>
                        <AnimalIcon color={theme.colors.primary} size={16} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.searchResultTitle}>{animal.tagNumber}</Text>
                        <Text style={styles.searchResultSubtitle} numberOfLines={1}>
                          {[animal.Breed?.name, animal.gender].filter(Boolean).join(' · ')}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
                {!searchingAnimals && animalResults.length > 0 && (
                  <TouchableOpacity onPress={() => submitAnimalSearch()} style={styles.searchSeeAllBtn}>
                    <Text style={styles.searchSeeAllText}>
                      {t('dashboard.searchSeeAll', 'See all results for "{{query}}"', { query: searchQuery.trim() })}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default DashboardScreen;
