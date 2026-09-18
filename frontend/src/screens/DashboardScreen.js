import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, FlatList, Platform, Modal, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../theme/ThemeContext';
import { useFocusEffect, CommonActions } from '@react-navigation/native';
import { CLEARED_ANIMAL_LIST_PARAMS } from '../utils/animalListNav';
import { 
  Menu, PawPrint, User, Home, Syringe, Scale,
  Heart, Activity, ClipboardList, Globe, Settings, Briefcase,
  Moon, Sun, RefreshCcw, Milk, Sliders, Bell, Leaf,
  StickyNote, Stethoscope
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
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [farmName, setFarmName] = useState('Goatwala Farm');
  const [userRole, setUserRole] = useState(null);
  const [soonVisible, setSoonVisible] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Memoize styles to avoid re-calculation on every render
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  
  useEffect(() => {
    // Register for push notifications on app start
    registerForPushNotificationsAsync().catch(err => 
      console.error('Failed to register for push notifications:', err)
    );
  }, []);

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
          
        } catch (err) {
          console.warn('Dashboard: Failed to load data:', err);
          if (err.response?.status === 401) {
            navigation.replace('Login');
          }
        }
      };

      setLoading(true);
      loadDashboardData().finally(() => setLoading(false));
    }, [navigation])
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
      { id: '15', title: t('actions.farmSetting', 'Farm Setting'), icon: <Sliders color={theme.colors.primary} size={28} strokeWidth={1.8} />, screen: null },
      { id: '16', title: t('actions.feedFormulation', 'Feed Formulation'), icon: <Leaf color={theme.colors.primary} size={28} strokeWidth={1.8} />, screen: 'FormulationList' },
    ];

    // Filter out 'Employee' tile for non-OWNER roles
    return allTiles.filter(tile => {
      if (tile.id === '3' && userRole && userRole !== 'OWNER') return false;
      return true;
    });
  }, [theme, userRole, t]);

  const renderTile = ({ item }) => (
    <TouchableOpacity 
      style={styles.tile}
      onPress={() => {
        if (item.screen === 'AnimalList') {
          navigation.navigate('AnimalList', { ...CLEARED_ANIMAL_LIST_PARAMS });
        } else if (item.screen) {
          navigation.navigate(item.screen);
        } else {
          setSoonVisible(true);
        }
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.tileIconContainer, { backgroundColor: theme.colors.primary + '10' }]}>
        {item.icon}
      </View>
      <Text style={styles.tileTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  const openAnimals = (filters = {}) => {
    navigation.navigate('AnimalList', {
      ...CLEARED_ANIMAL_LIST_PARAMS,
      listReset: false,
      ...filters,
    });
  };

  const StatCell = ({ label, value, onPress, third }) => (
    <TouchableOpacity
      style={[styles.statCell, third && styles.statCellThird]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.statValue}>{value ?? 0}</Text>
      <Text style={styles.statLabel} numberOfLines={2}>{label}</Text>
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
          <View style={[styles.kpiIconContainer, { backgroundColor: '#f59e0b15' }]}>
            <PawPrint color="#f59e0b" size={18} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.heroLabel}>{t('dashboard.liveAnimals', 'Live animals')}</Text>
            <Text style={styles.heroValue}>{live}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.statGrid}>
          <StatCell
            label={t('dashboard.male', 'Male')}
            value={male}
            onPress={() => openAnimals({ gender: 'MALE', status: 'LIVE' })}
          />
          <StatCell
            label={t('dashboard.female', 'Female')}
            value={female}
            onPress={() => openAnimals({ gender: 'FEMALE', status: 'LIVE' })}
          />
          <StatCell
            label={t('dashboard.pregnant', 'Pregnant')}
            value={metrics.pregnant}
            onPress={() => openAnimals({ femaleCondition: 'PREGNANT', status: 'LIVE' })}
          />
          <StatCell
            label={t('dashboard.breeders', 'Breeders')}
            value={metrics.breeders ?? metrics.breedingDoes}
            onPress={() => openAnimals({ isBreeder: true, status: 'LIVE' })}
          />
        </View>

        <Text style={styles.sectionTitle}>{t('dashboard.kidsByAge', 'Kids by age')}</Text>
        <View style={styles.statGrid}>
          <StatCell
            third
            label={t('dashboard.kids0_3', '0–3 months')}
            value={metrics.kids0_3}
            onPress={() => openAnimals({ ageRange: '0-3', status: 'LIVE' })}
          />
          <StatCell
            third
            label={t('dashboard.kids3_6', '3–6 months')}
            value={metrics.kids3_6}
            onPress={() => openAnimals({ ageRange: '3-6', status: 'LIVE' })}
          />
          <StatCell
            third
            label={t('dashboard.kids6_9', '6–9 months')}
            value={metrics.kids6_9}
            onPress={() => openAnimals({ ageRange: '6-9', status: 'LIVE' })}
          />
        </View>

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
    </SafeAreaView>
  );
};

export default DashboardScreen;
