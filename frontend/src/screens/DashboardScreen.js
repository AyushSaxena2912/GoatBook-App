import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, FlatList, Alert, Platform, Modal, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../theme/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { 
  Menu, GitBranch, PawPrint, User, Home, Syringe, Scale, 
  Heart, Activity, ClipboardList, Globe, Settings, Briefcase,
  Moon, Sun, RefreshCcw, Milk, Sliders, Bell, AlertTriangle, CheckCircle2,
  TrendingDown, TrendingUp, Leaf
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
        if (item.screen) {
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

  const renderDashboardHeader = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20, marginBottom: 40 }} />;
    }

    if (!analytics) return null;

    const { metrics, composition } = analytics;
    const totalComp = composition.bucks + composition.does + composition.kids;
    const bucksPct = totalComp > 0 ? (composition.bucks / totalComp) * 100 : 0;
    const doesPct = totalComp > 0 ? (composition.does / totalComp) * 100 : 0;
    const kidsPct = totalComp > 0 ? (composition.kids / totalComp) * 100 : 0;

    return (
      <View>
        <Text style={styles.sectionTitle}>{t('dashboard.overview', 'Overview')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kpiScroll}>
          {/* Total Animals */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <View style={[styles.kpiIconContainer, { backgroundColor: '#f59e0b15' }]}>
                <PawPrint color="#f59e0b" size={18} />
              </View>
              <Text style={styles.kpiTitle} numberOfLines={1}>{t('dashboard.totalAnimals', 'Total Animals')}</Text>
            </View>
            <Text style={styles.kpiValue}>{metrics.totalAnimals}</Text>
          </View>

          {/* Breeding Does */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <View style={[styles.kpiIconContainer, { backgroundColor: '#10b98115' }]}>
                <Heart color="#10b981" size={18} />
              </View>
              <Text style={styles.kpiTitle} numberOfLines={1}>{t('dashboard.breedingDoes', 'Breeding Does')}</Text>
            </View>
            <Text style={styles.kpiValue}>{metrics.breedingDoes}</Text>
          </View>

          {/* Kids Born */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <View style={[styles.kpiIconContainer, { backgroundColor: '#3b82f615' }]}>
                <Activity color="#3b82f6" size={18} />
              </View>
              <Text style={styles.kpiTitle} numberOfLines={1}>{t('dashboard.kidsBorn', 'Kids Born')}</Text>
            </View>
            <Text style={styles.kpiValue}>{metrics.kidsBorn}</Text>
          </View>

          {/* Mortality */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <View style={[styles.kpiIconContainer, { backgroundColor: '#ef444415' }]}>
                <TrendingDown color="#ef4444" size={18} />
              </View>
              <Text style={styles.kpiTitle} numberOfLines={1}>{t('dashboard.mortality', 'Mortality')}</Text>
            </View>
            <Text style={styles.kpiValue}>{metrics.mortalityRate}</Text>
          </View>
        </ScrollView>

        <Text style={styles.sectionTitle}>{t('dashboard.herdComposition', 'Herd Composition')}</Text>
        <View style={styles.compositionCard}>
          <View style={styles.compHeader}>
            <GitBranch color={theme.colors.primary} size={20} />
            <Text style={styles.compTitle}>{t('dashboard.byGenderAndAge', 'By Gender & Age')}</Text>
          </View>

          {/* Custom Horizontal Bar */}
          <View style={styles.barContainer}>
            <View style={{ width: `${bucksPct}%`, backgroundColor: '#3b82f6' }} />
            <View style={{ width: `${doesPct}%`, backgroundColor: '#10b981' }} />
            <View style={{ width: `${kidsPct}%`, backgroundColor: '#f59e0b' }} />
          </View>

          {/* Legend */}
          <View style={styles.compLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
              <Text style={styles.legendText}>{t('dashboard.bucks', 'Bucks')}</Text>
              <Text style={styles.legendValue}>{Math.round(bucksPct)}%</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.legendText}>{t('dashboard.does', 'Does')}</Text>
              <Text style={styles.legendValue}>{Math.round(doesPct)}%</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.legendText}>{t('dashboard.kids', 'Kids')}</Text>
              <Text style={styles.legendValue}>{Math.round(kidsPct)}%</Text>
            </View>
          </View>
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
