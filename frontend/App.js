import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, LogBox, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import * as Font from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { 
  Inter_400Regular, 
  Inter_500Medium, 
  Inter_600SemiBold, 
  Inter_700Bold, 
  Inter_800ExtraBold 
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ProfileSettingsScreen from './src/screens/ProfileSettingsScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import BreedListScreen from './src/screens/BreedListScreen';
import AddBreedScreen from './src/screens/AddBreedScreen';
import AnimalListScreen from './src/screens/AnimalListScreen';
import AddAnimalScreen from './src/screens/AddAnimalScreen';
import EmployeeListScreen from './src/screens/EmployeeListScreen';
import AddEmployeeScreen from './src/screens/AddEmployeeScreen';
import FarmSelectionScreen from './src/screens/FarmSelectionScreen';
import LocationListScreen from './src/screens/LocationListScreen';
import AddLocationScreen from './src/screens/AddLocationScreen';
import LocationDetailsScreen from './src/screens/LocationDetailsScreen';
import CreateLocationScreen from './src/screens/CreateLocationScreen';
import FormulationListScreen from './src/screens/FormulationListScreen';
import AddFormulationScreen from './src/screens/AddFormulationScreen';
import FormulationDetailScreen from './src/screens/FormulationDetailScreen';
import FinancialListScreen from './src/screens/FinancialListScreen';
import AddFinancialRecordScreen from './src/screens/AddFinancialRecordScreen';

import AddWeightScreen from './src/screens/AddWeightScreen';
import WeightListScreen from './src/screens/WeightListScreen';
import FarmSettingsScreen from './src/screens/FarmSettingsScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';
import VaccinesMenuScreen from './src/screens/VaccinesMenuScreen';
import AddVaccineNameScreen from './src/screens/AddVaccineNameScreen';
import VaccineDefinitionsScreen from './src/screens/VaccineDefinitionsScreen';
import AddVaccinationScreen from './src/screens/AddVaccinationScreen';
import VaccinationListScreen from './src/screens/VaccinationListScreen';
import ReportsMenuScreen from './src/screens/ReportsMenuScreen';
import OverallReportScreen from './src/screens/OverallReportScreen';
import ReplaceTagScreen from './src/screens/ReplaceTagScreen';
import AddMatingScreen from './src/screens/AddMatingScreen';
import AddBreedingScreen from './src/screens/AddBreedingScreen';
import MatingListScreen from './src/screens/MatingListScreen';
import BreedingListScreen from './src/screens/BreedingListScreen';
import LocationMenuScreen from './src/screens/LocationMenuScreen';
import MassLocationScreen from './src/screens/MassLocationScreen';
import MassVaccinationScreen from './src/screens/MassVaccinationScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import SideMenu from './src/components/SideMenu';
import { registerForPushNotificationsAsync } from './src/utils/notifications';
import i18n from './src/i18n';
import api from './src/api';
import LanguageSelectionScreen from './src/screens/LanguageSelectionScreen';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function MainDrawer() {
  const { theme } = useTheme();
  return (
    <Drawer.Navigator
      drawerContent={(props) => <SideMenu {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { width: '80%', backgroundColor: theme.colors.surface }
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen name="AnimalList" component={AnimalListScreen} />
      <Drawer.Screen name="BreedList" component={BreedListScreen} />
      <Drawer.Screen name="VaccinesMenu" component={VaccinesMenuScreen} />
      <Drawer.Screen name="ReportsMenu" component={ReportsMenuScreen} />
      <Drawer.Screen name="LocationList" component={LocationListScreen} />
      <Drawer.Screen name="FormulationList" component={FormulationListScreen} />
      <Drawer.Screen name="FinancialList" component={FinancialListScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
}

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      console.log("Loading fonts...");
      await Font.loadAsync({
        'Inter_400Regular': Inter_400Regular,
        'Inter_500Medium': Inter_500Medium,
        'Inter_600SemiBold': Inter_600SemiBold,
        'Inter_700Bold': Inter_700Bold,
        'Inter_800ExtraBold': Inter_800ExtraBold,
      });
      console.log("Fonts loaded.");
      setFontsLoaded(true);
    } catch (e) {
      console.warn('RESOURCES LOADING FAILED:', e);
      // Fallback: try to show app anyway
      setFontsLoaded(true); 
    } finally {
      console.log("Checking session...");
      await checkSession();
      console.log("Session checked, hiding splash screen...");
      await SplashScreen.hideAsync();
    }
  };

  useEffect(() => {
    if (fontsLoaded && initialRoute) {
      SplashScreen.hideAsync();
      
      // If user is logged in, register for push notifications
      if (initialRoute === 'MainDrawer') {
        registerForPushNotificationsAsync().catch(err => 
          console.error('Push Registration Error:', err)
        );
      }
    }
  }, [fontsLoaded, initialRoute]);

  useEffect(() => {
    import('expo-notifications').then((Notifications) => {
      const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        // You can handle notification taps here, like navigating to the specific screen
        console.log("Notification tapped!");
        // We're already in App.js, so navigation ref is needed to do it globally,
        // but for now, they can just open the app and click the bell icon.
      });

      return () => {
        Notifications.removeNotificationSubscription(responseListener);
      };
    });
  }, []);

  const checkSession = async () => {
    try {
      console.log("Inside checkSession");
      
      const sessionPromise = (async () => {
        let token, farmId;
        if (Platform.OS === 'web') {
          token = localStorage.getItem('token');
          farmId = localStorage.getItem('selectedFarmId');
        } else {
          token = await SecureStore.getItemAsync('token');
          farmId = await SecureStore.getItemAsync('selectedFarmId');
        }
        return { token, farmId };
      })();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Session check timeout')), 3000)
      );

      const { token, farmId } = await Promise.race([sessionPromise, timeoutPromise]);

      console.log("Token:", token, "FarmId:", farmId);
      if (token && farmId) {
        setInitialRoute('MainDrawer');
        // Fetch user profile to get their preferred language
        try {
          const profileRes = await api.get('/users/profile');
          if (profileRes.data?.user?.language) {
            i18n.changeLanguage(profileRes.data.user.language);
          }
        } catch (langError) {
          console.error("Error fetching language preference:", langError);
        }
      } else {
        setInitialRoute('Login');
      }
    } catch (e) {
      console.error("Error in checkSession:", e);
      setInitialRoute('Login');
    }
  };

  if (!fontsLoaded || !initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.surface }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

          {/* Main App (Drawer) */}
          <Stack.Screen name="MainDrawer" component={MainDrawer} />

          {/* Detail/Modal Screens outside Drawer but in same stack */}
          <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          <Stack.Screen name="AddBreed" component={AddBreedScreen} />
          <Stack.Screen name="EditBreed" component={AddBreedScreen} />
          <Stack.Screen name="AddAnimal" component={AddAnimalScreen} />
          <Stack.Screen name="EditAnimal" component={AddAnimalScreen} />
          <Stack.Screen name="EmployeeList" component={EmployeeListScreen} />
          <Stack.Screen name="AddEmployee" component={AddEmployeeScreen} />
          <Stack.Screen name="EditEmployee" component={AddEmployeeScreen} />
          <Stack.Screen name="FarmSelection" component={FarmSelectionScreen} />
          <Stack.Screen name="AddLocation" component={AddLocationScreen} />
          <Stack.Screen name="EditLocation" component={CreateLocationScreen} />
          <Stack.Screen name="CreateLocation" component={CreateLocationScreen} />
          <Stack.Screen name="LocationDetails" component={LocationDetailsScreen} />

          <Stack.Screen name="SubscriptionScreen" component={SubscriptionScreen} />

          <Stack.Screen name="AddWeight" component={AddWeightScreen} />
          <Stack.Screen name="WeightList" component={WeightListScreen} />
          <Stack.Screen name="FarmSettings" component={FarmSettingsScreen} />
          <Stack.Screen name="VaccineDefinitions" component={VaccineDefinitionsScreen} />
          <Stack.Screen name="AddVaccineName" component={AddVaccineNameScreen} />
          <Stack.Screen name="AddVaccination" component={AddVaccinationScreen} />
          <Stack.Screen name="VaccinationList" component={VaccinationListScreen} />
          <Stack.Screen name="ReportsMenu" component={ReportsMenuScreen} />
          <Stack.Screen name="OverallReport" component={OverallReportScreen} />
          <Stack.Screen name="ReplaceTag" component={ReplaceTagScreen} />
          <Stack.Screen name="AddMating" component={AddMatingScreen} />
          <Stack.Screen name="AddBreeding" component={AddBreedingScreen} />
          <Stack.Screen name="MatingList" component={MatingListScreen} />
          <Stack.Screen name="BreedingList" component={BreedingListScreen} />
          <Stack.Screen name="AnimalList" component={AnimalListScreen} />
          <Stack.Screen name="LocationMenu" component={LocationMenuScreen} />
          <Stack.Screen name="MassLocation" component={MassLocationScreen} />
          <Stack.Screen name="MassVaccination" component={MassVaccinationScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
          <Stack.Screen name="FormulationList" component={FormulationListScreen} />
          <Stack.Screen name="AddFormulation" component={AddFormulationScreen} />
          <Stack.Screen name="FormulationDetail" component={FormulationDetailScreen} />
          <Stack.Screen name="FinancialList" component={FinancialListScreen} />
          <Stack.Screen name="AddFinancialRecord" component={AddFinancialRecordScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
