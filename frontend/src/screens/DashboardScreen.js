import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../theme/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { 
  Menu, GitBranch, PawPrint, User, Home, Syringe, Scale, 
  Heart, Activity, ClipboardList, Globe, Settings, Briefcase,
  Moon, Sun, RefreshCcw
} from 'lucide-react-native';
import api from '../api';
import { getStyles } from './DashboardScreen.styles';

const DashboardScreen = ({ navigation }) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [farmName, setFarmName] = useState('Goatwala Farm');
  
  // Memoize styles to avoid re-calculation on every render
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);

  useFocusEffect(
    useCallback(() => {
      // Fetch profile to get real farm name
      api.get('/users/profile').then(res => {
         const currentFarmId = api.defaults.headers.common['X-Farm-ID'];
         const farm = res.data.employeeProfile?.farms?.find(f => f.id === currentFarmId);
         if (farm) setFarmName(farm.name);
      }).catch(err => console.warn('Silently failed to fetch profile in dashboard:', err));
    }, [])
  );

  const tiles = [
    { id: '1', title: 'Breed', icon: <GitBranch color={theme.colors.primary} size={34} strokeWidth={1.8} />, screen: 'BreedList' },
    { id: '2', title: 'Animals', icon: <PawPrint color={theme.colors.primary} size={36} strokeWidth={1.5} />, screen: 'AnimalList' },
    { id: '3', title: 'Employee', icon: <User color={theme.colors.primary} size={36} strokeWidth={1.5} />, screen: 'EmployeeList' },
    { id: '4', title: 'Location', icon: <Home color={theme.colors.primary} size={36} strokeWidth={1.5} />, screen: 'LocationList' },
    { id: '5', title: 'Vaccines', icon: <Syringe color={theme.colors.primary} size={36} strokeWidth={1.5} />, screen: 'VaccinesMenu' },
    { id: '6', title: 'Weight', icon: <Scale color={theme.colors.primary} size={36} strokeWidth={1.5} />, screen: 'WeightList' },
    { id: '7', title: 'Mating', icon: <Heart color={theme.colors.primary} size={36} strokeWidth={1.5} />, screen: null },
    { id: '8', title: 'Breeding', icon: <Activity color={theme.colors.primary} size={36} strokeWidth={1.5} />, screen: null },
    { id: '9', title: 'Report', icon: <ClipboardList color={theme.colors.primary} size={36} strokeWidth={1.5} />, screen: 'ReportsMenu' },
    { id: '10', title: 'Language', icon: <Globe color={theme.colors.primary} size={36} strokeWidth={1.5} />, screen: null },
    { id: '11', title: 'Settings', icon: <Settings color={theme.colors.primary} size={36} strokeWidth={1.5} />, screen: 'Settings' },
    { id: '12', title: 'Financials', icon: <Briefcase color={theme.colors.primary} size={36} strokeWidth={1.5} />, screen: null },
    { id: '13', title: 'Replace Tag', icon: <RefreshCcw color={theme.colors.primary} size={36} strokeWidth={1.5} />, screen: 'ReplaceTag' },
  ];

  const renderTile = ({ item }) => (
    <TouchableOpacity 
      style={styles.tile}
      onPress={() => item.screen && navigation.navigate(item.screen)}
      activeOpacity={0.7}
    >
      <View style={styles.tileIcon}>
        {item.icon}
      </View>
      <Text style={styles.tileTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={theme.colors.primary} />
      
      {/* Header - Simple & Flat */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => navigation.openDrawer()}
          >
            <Menu color="#FFF" size={26} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{farmName}</Text>
          
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

      {/* Grid */}
      <View style={styles.content}>
        <FlatList
          data={tiles}
          renderItem={renderTile}
          keyExtractor={item => item.id}
          numColumns={3}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          bounces={false}
        />
      </View>
    </SafeAreaView>
  );
};

export default DashboardScreen;
