import React, { useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import { MapPin, Users, Search } from 'lucide-react-native';
import { SPACING, SHADOW } from '../theme';

const LocationMenuScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const menuItems = [
    {
      id: 'single',
      title: 'Single Location/Shed',
      icon: <MapPin color={theme.colors.primary} size={32} strokeWidth={1.5} />,
      screen: 'AddLocation',
    },
    {
      id: 'mass',
      title: 'Mass Location/Shed',
      icon: <Users color={theme.colors.primary} size={32} strokeWidth={1.5} />,
      screen: 'MassLocation',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader 
        title="Location" 
        onBack={() => navigation.goBack()}
        leftAlign={true}
        // Removing Search icon for now as it's not in the target reference style for this menu type
      />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={() => navigation.navigate(item.screen)}
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
});

export default LocationMenuScreen;
