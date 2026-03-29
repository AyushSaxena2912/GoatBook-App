import React, { useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { lightTheme } from '../theme';
import GHeader from '../components/GHeader';
import { ListPlus, Syringe, Users, ClipboardList } from 'lucide-react-native';

const VaccinesMenuScreen = ({ navigation }) => {
  const { isDarkMode, theme } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  
  const options = [
    { 
      id: 'add_vaccine', 
      title: 'Add Vaccine Name', 
      icon: <ListPlus color={theme.colors.primary} size={32} />, 
      onPress: () => navigation.navigate('VaccineDefinitions') 
    },
    { 
      id: 'single_vaccination', 
      title: 'Single Vaccination', 
      icon: <Syringe color={theme.colors.primary} size={32} />, 
      onPress: () => navigation.navigate('AddVaccination', { mode: 'single' }) 
    },
    { 
      id: 'mass_vaccination', 
      title: 'Mass Vaccination', 
      icon: <Users color={theme.colors.primary} size={32} />, 
      onPress: () => navigation.navigate('AddVaccination', { mode: 'mass' }) 
    },
    { 
      id: 'history', 
      title: 'All Records', 
      icon: <ClipboardList color="#10B981" size={32} />, 
      onPress: () => navigation.navigate('VaccinationList') 
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader 
        title="Vaccines Management" 
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          {options.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.card} 
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                {item.icon}
              </View>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    height: 160,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  iconContainer: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    textAlign: 'center',
    paddingHorizontal: 8,
    letterSpacing: -0.2,
  },
});

export default VaccinesMenuScreen;
