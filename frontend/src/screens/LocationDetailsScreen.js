import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import { MapPin, Edit, ArrowRight, Info, Users, LayoutGrid, Tag } from 'lucide-react-native';
import api from '../api';
import { useFocusEffect } from '@react-navigation/native';
import { SPACING, SHADOW } from '../theme';

const LocationDetailsScreen = ({ navigation, route }) => {
  const { isDarkMode, theme } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const { locationId } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchDetails();
    }, [locationId])
  );

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/locations/${locationId}/stats`);
      setData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Fetch location details error:', error);
      alert('Failed to load location record');
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

  const { location, totalAnimals, distribution } = data;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader 
        title="Shed Records" 
        onBack={() => navigation.goBack()}
        rightIcon={<Edit color="#FFF" size={22} />}
        onRightPress={() => navigation.navigate('EditLocation', { location })}
        leftAlign={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Dashboard Header Card */}
        <View style={[styles.dashboardCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.locationHeader}>
             <View style={[styles.locationIconWrapper, { backgroundColor: theme.colors.primary + '10' }]}>
                <MapPin size={24} color={theme.colors.primary} />
             </View>
             <View style={styles.locationNameWrapper}>
                <Text style={[styles.locationTitle, { color: theme.colors.text }]}>
                  {location.displayName || location.name}
                </Text>
                <Text style={[styles.locationCode, { color: theme.colors.textMuted }]}>
                  Code: {location.code || 'N/A'}
                </Text>
             </View>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={[styles.statBox, { backgroundColor: theme.colors.background }]}>
              <Users size={18} color={theme.colors.primary} />
              <View>
                <Text style={[styles.statNum, { color: theme.colors.text }]}>{totalAnimals}</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textLight }]}>Livestock</Text>
              </View>
            </View>
            <View style={[styles.statBox, { backgroundColor: theme.colors.background }]}>
              <Tag size={18} color={theme.colors.primary} />
              <View>
                <Text style={[styles.statNum, { color: theme.colors.text }]}>{distribution.length}</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textLight }]}>Breeds</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Livestock Distribution</Text>
        
        {distribution.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: theme.colors.surface }]}>
            <Info size={40} color={theme.colors.textMuted} />
            <Text style={[styles.emptyText, { color: theme.colors.textLight }]}>No animals currently assigned to this shed.</Text>
          </View>
        ) : (
          distribution.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.breedCard, { backgroundColor: theme.colors.surface }]}
              onPress={() => navigation.navigate('AnimalList', { 
                breedId: item.breedId, 
                locationId: location.id,
                initialSearch: item.breedName 
              })}
              activeOpacity={0.7}
            >
              <View style={[styles.breedIcon, { backgroundColor: theme.colors.primary + '05' }]}>
                 <Text style={[styles.breedLetter, { color: theme.colors.primary }]}>
                   {item.breedName[0].toUpperCase()}
                 </Text>
              </View>
              <View style={styles.breedInfo}>
                <Text style={[styles.breedName, { color: theme.colors.text }]}>{item.breedName}</Text>
                <View style={styles.breedMetaBadge}>
                   <Text style={[styles.breedMetaText, { color: theme.colors.primary }]}>
                     {item.count} {item.count === 1 ? 'Goat' : 'Goats'}
                   </Text>
                </View>
              </View>
              <View style={styles.arrowBox}>
                <ArrowRight size={18} color={theme.colors.textMuted} />
              </View>
            </TouchableOpacity>
          ))
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
    paddingBottom: 40,
  },
  dashboardCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 28,
    ...SHADOW.small,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  locationIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationNameWrapper: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  locationCode: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 2,
    opacity: 0.6,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    gap: 12,
  },
  statNum: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    opacity: 0.7,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    marginBottom: 16,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  breedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    ...SHADOW.small,
  },
  breedIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  breedLetter: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  breedInfo: {
    flex: 1,
  },
  breedName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  breedMetaBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary + '10',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  breedMetaText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  arrowBox: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    borderRadius: 24,
    ...SHADOW.small,
  },
  emptyText: {
    marginTop: 12,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    opacity: 0.7,
    lineHeight: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LocationDetailsScreen;
