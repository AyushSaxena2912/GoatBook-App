import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { 
  Home, PawPrint, GitBranch, Syringe, ClipboardList, 
  MapPin, Settings, LogOut, ChevronRight, User, ExternalLink
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import api, { setAuthToken, setSelectedFarm } from '../api';

const SideMenu = (props) => {
  const { theme } = useTheme();
  const { navigation } = props;
  const [farmName, setFarmName] = useState('GoatBook');
  const [userName, setUserName] = useState('User');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/profile');
      setUserName(res.data.name || 'User');
      const currentFarmId = api.defaults.headers.common['X-Farm-ID'];
      const farm = res.data.employeeProfile?.farms?.find(f => f.id === currentFarmId);
      if (farm) setFarmName(farm.name);
    } catch (err) {
      console.warn('SideMenu Profile Fetch Error:', err);
    }
  };

  const menuItems = [
    { title: 'Dashboard', icon: <Home size={22} />, screen: 'Dashboard' },
    { title: 'Animals', icon: <PawPrint size={22} />, screen: 'AnimalList' },
    { title: 'Breeds', icon: <GitBranch size={22} />, screen: 'BreedList' },
    { title: 'Vaccines', icon: <Syringe size={22} />, screen: 'VaccinesMenu' },
    { title: 'Reports', icon: <ClipboardList size={22} />, screen: 'ReportsMenu' },
    { title: 'Locations', icon: <MapPin size={22} />, screen: 'LocationList' },
    { title: 'Settings', icon: <Settings size={22} />, screen: 'Settings' },
  ];

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
           <User color={theme.colors.primary} size={30} fill={theme.colors.white} />
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
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={styles.menuItemLeft}>
                {React.cloneElement(item.icon, { 
                  color: isActive ? theme.colors.primary : theme.colors.textLight,
                  strokeWidth: isActive ? 2.5 : 2
                })}
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
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Montserrat_600SemiBold',
  },
  farmName: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
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
    fontFamily: 'Montserrat_500Medium',
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
    fontFamily: 'Montserrat_600SemiBold',
    marginLeft: 16,
  },
});

export default SideMenu;
