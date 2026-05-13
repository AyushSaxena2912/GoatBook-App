import React, { useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { 
  Home, PawPrint, GitBranch, Syringe, ClipboardList, 
  MapPin, Settings, LogOut, ChevronRight, User, ExternalLink,
  Scale, Heart, Activity, Globe, Briefcase, RefreshCcw, Milk, Sliders
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import api, { setAuthToken, setSelectedFarm } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Modal } from 'react-native';

const SideMenu = (props) => {
  const { theme } = useTheme();
  const { navigation } = props;
  const [farmName, setFarmName] = useState('GoatBook');
  const [userName, setUserName] = useState('User');
  const [profilePhoto, setProfilePhoto] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const [userRole, setUserRole] = useState('EMPLOYEE');
  const [soonVisible, setSoonVisible] = useState(false);

  const fetchProfile = async () => {
    try {
      // 1. Get current farm ID (Check header first, then storage)
      let currentFarmId = api.defaults.headers.common['X-Farm-ID'];
      if (!currentFarmId) {
        currentFarmId = await AsyncStorage.getItem('selectedFarmId');
      }

      // 2. Fetch profile
      const res = await api.get('/users/profile');
      setUserName(res.data.name || 'User');
      setProfilePhoto(res.data.profilePhotoUrl || null);
      
      const ep = res.data.employeeProfile;
      setUserRole(ep?.employeeType || 'EMPLOYEE');

      // 3. Find and set farm name
      if (ep?.farms && ep.farms.length > 0) {
        const farm = ep.farms.find(f => f.id === currentFarmId) || ep.farms[0];
        if (farm) setFarmName(farm.name);
      }
    } catch (err) {
      console.warn('SideMenu Profile Fetch Error:', err);
      if (err.response?.status === 401) {
        navigation.replace('Login');
      }
    }
  };

  const menuItems = [
    { title: 'Dashboard', icon: <Home size={22} />, screen: 'Dashboard' },
    { title: 'Animals', icon: <PawPrint size={22} />, screen: 'AnimalList' },
    { title: 'Breeds', icon: <GitBranch size={22} />, screen: 'BreedList' },
    { title: 'Employee', icon: <User size={22} />, screen: 'EmployeeList', role: 'OWNER' },
    { title: 'Locations', icon: <MapPin size={22} />, screen: 'LocationMenu' },
    { title: 'Vaccines', icon: <Syringe size={22} />, screen: 'VaccinesMenu' },
    { title: 'Weight', icon: <Scale size={22} />, screen: 'AddWeight' },
    { title: 'Mating', icon: <Heart size={22} />, screen: null },
    { title: 'Breeding', icon: <Activity size={22} />, screen: null },
    { title: 'Reports', icon: <ClipboardList size={22} />, screen: 'ReportsMenu' },
    { title: 'Language', icon: <Globe size={22} />, screen: null },
    { title: 'Financials', icon: <Briefcase size={22} />, screen: null },
    { title: 'Replace Tag', icon: <RefreshCcw size={22} />, screen: 'ReplaceTag' },
    { title: 'Milk Records', icon: <Milk size={22} />, screen: null },
    { title: 'Farm Setting', icon: <Sliders size={22} />, screen: null },
    { title: 'Settings', icon: <Settings size={22} />, screen: 'Settings' },
  ].filter(item => !item.role || item.role === userRole);

  const handleLogout = async () => {
    await setAuthToken(null);
    await setSelectedFarm(null);
    navigation.replace('Login');
  };

  const activeRoute = props?.state?.routeNames ? props.state.routeNames[props.state.index] : 'Dashboard';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Drawer Header - Simple & Consistent */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.avatarContainer}>
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.avatarPhoto} />
          ) : (
            <Text style={styles.avatarInitial}>
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </Text>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
          <Text style={styles.farmName} numberOfLines={1}>{farmName}</Text>
        </View>
      </View>

      <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
        {menuItems.map((item, index) => {
          const isActive = activeRoute === item.screen;
          return (
            <TouchableOpacity 
              key={index}
              style={[
                styles.menuItem, 
                isActive && { backgroundColor: theme.colors.primary + '10' }
              ]}
              onPress={() => {
                if (item.screen) {
                  navigation.navigate(item.screen);
                } else {
                  setSoonVisible(true);
                }
              }}
            >
              <View style={styles.menuItemLeft}>
                {item.icon && React.isValidElement(item.icon) ? (
                  React.cloneElement(item.icon, {
                    size: 22,
                    color: isActive ? theme.colors.primary : theme.colors.textLight,
                    strokeWidth: isActive ? 2.5 : 2
                  })
                ) : (
                  item.icon
                )}
                <Text style={[
                  styles.menuItemText, 
                  { color: isActive ? theme.colors.primary : theme.colors.text },
                  isActive && { fontFamily: theme.typography.semiBold }
                ]}>
                  {item.title}
                </Text>
              </View>
              {isActive && <ChevronRight color={theme.colors.primary} size={18} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Logout at bottom */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut color={theme.colors.error} size={22} />
        <Text style={[styles.logoutText, { color: theme.colors.error }]}>Log Out</Text>
      </TouchableOpacity>

      {/* Coming Soon Modal */}
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
             <Text style={styles.modalTitle}>Coming Soon!</Text>
             <Text style={styles.modalMessage}>
                We are currently working on this module. This feature will be available soon!
             </Text>
             <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setSoonVisible(false)}
             >
                <Text style={styles.modalButtonText}>Got it</Text>
             </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarInitial: {
    fontSize: 24,
    color: '#FF5A0F', // Matching primary orange
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  avatarPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
  },
  farmName: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
  },
  menuList: {
    flex: 1,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    marginLeft: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  logoutText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F9500410', 
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  modalButton: {
    backgroundColor: '#F95004',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});

export default SideMenu;
