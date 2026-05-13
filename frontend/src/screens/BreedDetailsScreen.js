import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { COLORS, SPACING, SHADOW, lightTheme } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import { Ghost, Bug, Edit, ArrowRight, ClipboardList, MapPin, ChevronRight, SearchX, Plus, XCircle, Tag } from 'lucide-react-native';
import api from '../api';
import GAlert from '../components/GAlert';
import { useFocusEffect } from '@react-navigation/native';

const BreedDetailsScreen = ({ navigation, route }) => {
  const { isDarkMode, theme } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const { breedId } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info' });

  const showAlert = (title, message, type = 'info') => setAlertConfig({ visible: true, title, message, type });
  const hideAlert = () => setAlertConfig({ ...alertConfig, visible: false });

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
      showAlert('Load Failed', 'Could not retrieve breed record. Please try again.', 'error');
    }
  };

  const { breed, totalAnimals, distribution } = data || {};
  const allAnimals = useMemo(() => {
    if (!distribution) return [];
    return distribution.flatMap(loc => 
      loc.animals.map(a => ({ ...a, locationName: loc.locationName }))
    );
  }, [distribution]);

  if (loading || !data) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => {
          hideAlert();
          if (alertConfig.title === 'Load Failed') navigation.goBack();
        }}
      />

      <GHeader
        title="Breed Record"
        onBack={() => navigation.goBack()}
        leftAlign={true}
        rightIcon={!breed.isDefault && <Edit color={theme.colors.white} size={22} />}
        onRightPress={() => !breed.isDefault && navigation.navigate('EditBreed', { breed })}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Simple Centered Card - BACK TO ORIGINAL */}
        <View style={styles.infoCard}>
          <Text style={[styles.breedName, { color: theme.colors.text }]}>{breed.name}</Text>
          <Text style={[styles.animalType, { color: theme.colors.textLight }]}>{breed.animalType}</Text>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          <View style={styles.statLine}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{totalAnimals}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textLight }]}>Animals Registered</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Herd List</Text>

        {allAnimals && allAnimals.length > 0 ? (
          allAnimals.map((animal) => (
            <TouchableOpacity
              key={animal.id}
              style={[styles.animalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={() => navigation.navigate('EditAnimal', { animal })}
              activeOpacity={0.7}
            >
              {/* Thumbnail */}
              {animal.imageUrl ? (
                <Image source={{ uri: animal.imageUrl }} style={styles.animalThumbnail} />
              ) : (
                <View style={[styles.animalThumbnail, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ fontSize: 10, color: theme.colors.textMuted, textAlign: 'center' }}>No Image</Text>
                </View>
              )}

              {/* Main Info */}
              <View style={styles.animalInfo}>
                <View style={styles.tagWrapper}>
                  <Tag size={16} color={theme.colors.textLight} style={{ marginRight: 6 }} />
                  <Text style={[styles.tagNumber, { color: theme.colors.text }]}>{animal.tagNumber}</Text>
                </View>
                <Text style={[styles.breedGenderText, { color: theme.colors.textLight }]}>
                  {breed.name} • {animal.gender ? animal.gender.charAt(0).toUpperCase() + animal.gender.slice(1).toLowerCase() : ''}
                </Text>
                <View style={[styles.locationTag, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
                  <MapPin size={12} color={theme.colors.textLight} style={styles.locIcon} />
                  <Text style={[styles.locationNameTag, { color: theme.colors.textLight }]}>
                    {animal.locationName ? (animal.locationName.charAt(0).toUpperCase() + animal.locationName.slice(1).toLowerCase()) : ''}
                  </Text>
                </View>
              </View>

              {/* Status & Action */}
              <View style={[styles.statusBadge, styles[`status${animal.status?.toUpperCase() || 'LIVE'}`]]}>
                <Text style={styles.statusText}>
                  {animal.status ? animal.status.charAt(0).toUpperCase() + animal.status.slice(1).toLowerCase() : 'Live'}
                </Text>
              </View>
              <ChevronRight size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <SearchX size={48} color={theme.colors.border} />
            <Text style={[styles.emptyText, { color: theme.colors.textLight }]}>No animals registered for this breed.</Text>
            <TouchableOpacity
              style={[styles.quickAddButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.navigate('AddAnimal', { breedId: breed.id })}
            >
              <Plus size={18} color="white" strokeWidth={3} />
              <Text style={styles.quickAddText}>Add First Animal</Text>
            </TouchableOpacity>
          </View>
        )}

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
    fontFamily: 'Inter_600SemiBold',
  },
  animalType: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
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
    fontFamily: 'Inter_600SemiBold',
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  locIcon: {
    marginRight: 4,
  },
  locationNameTag: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  animalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  animalThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 14,
  },
  animalInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  tagWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  tagNumber: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  breedGenderText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: 'white',
  },
  statusLIVE: { backgroundColor: '#10B981' },
  statusSOLD: { backgroundColor: '#3B82F6' },
  statusDEAD: { backgroundColor: '#EF4444' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    fontStyle: 'italic',
    marginTop: 8,
  },
  footerInfo: {
    alignItems: 'center',
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
    marginBottom: 20,
    fontFamily: 'Inter_500Medium',
  },
  quickAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  quickAddText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});

export default BreedDetailsScreen;
