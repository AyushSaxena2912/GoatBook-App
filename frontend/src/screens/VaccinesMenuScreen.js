import React, { useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import { ListPlus, Syringe, Users, History, Bell } from 'lucide-react-native';
import { SPACING, SHADOW } from '../theme';

const VaccinesMenuScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  
  const options = [
    { 
      id: 'add_vaccine', 
      title: 'Add Vaccine Name', 
      icon: <ListPlus color={theme.colors.primary} size={32} strokeWidth={1.5} />, 
      onPress: () => navigation.navigate('VaccineDefinitions') 
    },
    { 
      id: 'single_vaccination', 
      title: 'Single Vaccination', 
      icon: <Syringe color={theme.colors.primary} size={32} strokeWidth={1.5} />, 
      onPress: () => navigation.navigate('AddVaccination', { mode: 'single' }) 
    },
    { 
      id: 'mass_vaccination', 
      title: 'Mass Vaccination', 
      icon: <Users color={theme.colors.primary} size={32} strokeWidth={1.5} />, 
      onPress: () => navigation.navigate('MassVaccination') 
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader 
        title="Vaccination Module" 
        onBack={() => navigation.goBack()}
        leftAlign={true}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {options.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} 
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '10' }]}>
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

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    paddingTop: SPACING.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  card: {
    width: '47.5%',
    aspectRatio: 1,
    borderRadius: 16,
    padding: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    paddingHorizontal: 4,
    lineHeight: 18,
  },
  alertCard: {
    marginTop: 24,
    padding: SPACING.lg,
    borderRadius: 16,
    borderWidth: 1.2,
    ...SHADOW.small,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  alertTag: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  alertTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginBottom: 6,
  },
  alertSub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
});

export default VaccinesMenuScreen;
