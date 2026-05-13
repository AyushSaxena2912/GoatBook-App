import React, { useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { lightTheme } from '../theme';
import GHeader from '../components/GHeader';
import { ClipboardList, Heart, Calculator, Printer } from 'lucide-react-native';

const ReportsMenuScreen = ({ navigation }) => {
  const { isDarkMode, theme } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  
  // Menu items for the reports center
  const options = [
    { 
      id: 'overall', 
      title: 'Animal Overall Report', 
      icon: <ClipboardList color={theme.colors.primary} size={32} />, 
      onPress: () => navigation.navigate('OverallReport') // Link to detailed stats
    },
    { 
      id: 'condition', 
      title: 'Female Condition Report', 
      icon: <Heart color={theme.colors.primary} size={32} />, 
      onPress: null // Coming Soon
    },
    { 
      id: 'vaccination', 
      title: 'Vaccination Report', 
      icon: <Calculator color={theme.colors.primary} size={32} />, 
      onPress: null // Coming Soon
    },
    { 
      id: 'sales', 
      title: 'Generate Sales Report', 
      icon: <Printer color={theme.colors.primary} size={32} />, 
      onPress: null // Coming Soon
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader title="Reports Center" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          {options.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.card, !item.onPress && styles.disabledCard]} 
              onPress={item.onPress || (() => {})}
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
  disabledCard: {
    opacity: 0.5,
  },
  iconContainer: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    paddingHorizontal: 8,
    letterSpacing: -0.2,
  },
});

export default ReportsMenuScreen;
