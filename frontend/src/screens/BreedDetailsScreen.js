import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, SHADOW, lightTheme } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import { Ghost, Bug, Edit, ArrowRight, ClipboardList } from 'lucide-react-native';
import api from '../api';
import { useFocusEffect } from '@react-navigation/native';

const BreedDetailsScreen = ({ navigation, route }) => {
  const { isDarkMode, theme } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const { breedId } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchDetails();
    }, [breedId])
  );

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/breeds/${breedId}/stats`);
      setData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Fetch breed details error:', error);
      alert('Failed to load breed record');
      navigation.goBack();
    }
  };

  if (loading || !data) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const { breed, totalAnimals } = data;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader 
        title="Breed Record" 
        onBack={() => navigation.goBack()}
        rightIcon={<Edit color={theme.colors.white} size={22} />}
        onRightPress={() => navigation.navigate('EditBreed', { breed })}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Basic Info */}
        <View style={styles.infoCard}>
          <Text style={[styles.breedName, { color: theme.colors.text }]}>{breed.name}</Text>
          <Text style={[styles.animalType, { color: theme.colors.textLight }]}>{breed.animalType}</Text>
          
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          
          <View style={styles.statLine}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{totalAnimals}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textLight }]}>Animals Registered</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Management Actions</Text>
        
        {/* Navigation Button */}
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('AnimalList', { breedId: breed.id, initialSearch: breed.name })}
          activeOpacity={0.8}
        >
          <View style={styles.actionIcon}>
            <ClipboardList size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.actionTextContent}>
            <Text style={[styles.actionTitle, { color: theme.colors.text }]}>View Herd List</Text>
            <Text style={[styles.actionSubtitle, { color: theme.colors.textLight }]}>See all {breed.name} animals on this farm</Text>
          </View>
          <ArrowRight size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.footerInfo}>
             <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>Total registered animals updated in real-time.</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    maxWidth: 768,
    width: '100%',
    alignSelf: 'center',
  },
  infoCard: {
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  breedName: {
    fontSize: 22,
    fontFamily: 'Montserrat_600SemiBold',
  },
  animalType: {
    fontSize: 15,
    fontFamily: 'Montserrat_500Medium',
    marginTop: 4,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 20,
  },
  statLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'Montserrat_600SemiBold',
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Montserrat_600SemiBold',
    marginBottom: 16,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  actionButton: {
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: isDarkMode ? '#1E293B' : '#EEF2FF',
  },
  actionTextContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
  },
  actionSubtitle: {
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'Montserrat_400Regular',
  },
  footerInfo: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontStyle: 'italic',
    fontFamily: 'Montserrat_400Regular',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BreedDetailsScreen;
