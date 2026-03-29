import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import * as Font from 'expo-font';
import { 
  Montserrat_400Regular, 
  Montserrat_500Medium, 
  Montserrat_600SemiBold, 
  Montserrat_700Bold, 
  Montserrat_800ExtraBold 
} from '@expo-google-fonts/montserrat';
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
import BreedDetailsScreen from './src/screens/BreedDetailsScreen';
import AddWeightScreen from './src/screens/AddWeightScreen';
import WeightListScreen from './src/screens/WeightListScreen';
import FarmSettingsScreen from './src/screens/FarmSettingsScreen';
import VaccinesMenuScreen from './src/screens/VaccinesMenuScreen';
import AddVaccineNameScreen from './src/screens/AddVaccineNameScreen';
import VaccineDefinitionsScreen from './src/screens/VaccineDefinitionsScreen';
import AddVaccinationScreen from './src/screens/AddVaccinationScreen';
import VaccinationListScreen from './src/screens/VaccinationListScreen';
import ReportsMenuScreen from './src/screens/ReportsMenuScreen';
import OverallReportScreen from './src/screens/OverallReportScreen';
import ReplaceTagScreen from './src/screens/ReplaceTagScreen';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import SideMenu from './src/components/SideMenu';

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
      await Font.loadAsync({
        Montserrat_400Regular,
        Montserrat_500Medium,
        Montserrat_600SemiBold,
        Montserrat_700Bold,
        Montserrat_800ExtraBold,
      });
      setFontsLoaded(true);
      await checkSession();
    } catch (e) {
      console.warn(e);
    } finally {
      if (fontsLoaded) {
        await SplashScreen.hideAsync();
      }
    }
  };

  useEffect(() => {
    if (fontsLoaded && initialRoute) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, initialRoute]);

  const checkSession = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const farmId = await SecureStore.getItemAsync('selectedFarmId');
      
      if (token && farmId) {
        setInitialRoute('MainDrawer');
      } else {
        setInitialRoute('Login');
      }
    } catch (e) {
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
          <Stack.Screen name="EditLocation" component={AddLocationScreen} />
          <Stack.Screen name="LocationDetails" component={LocationDetailsScreen} />
          <Stack.Screen name="BreedDetails" component={BreedDetailsScreen} />
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
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
