import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SPACING, SHADOW } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import { Syringe, Plus, Clock, Droplets, Activity, ChevronRight } from 'lucide-react-native';
import api from '../api';
import { useFocusEffect } from '@react-navigation/native';

const VaccineDefinitionsScreen = ({ navigation }) => {
  const { isDarkMode, theme } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchVaccines();
    }, [])
  );

  const fetchVaccines = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vaccines');
      setVaccines(response.data);
    } catch (error) {
      console.error('Fetch vaccines error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFrequency = (days) => {
    if (!days || days === 0) return { label: 'One-time', color: '#8B5CF6' };
    if (days === 21) return { label: 'Every 21 Days', color: '#F59E0B' };
    if (days % 365 === 0) return { label: `Every ${days / 365} Year${days / 365 > 1 ? 's' : ''}`, color: '#10B981' };
    if (days % 30 === 0) return { label: `Every ${days / 30} Month${days / 30 > 1 ? 's' : ''}`, color: '#3B82F6' };
    return { label: `Every ${days} Days`, color: '#F59E0B' };
  };

  const getRouteShort = (route) => {
    if (!route) return 'N/A';
    if (route.includes('Subcutaneous') || route.includes('S/c') || route === 'SC') return 'S/C';
    if (route.includes('Intramuscular') || route.includes('I/M') || route === 'IM') return 'I/M';
    if (route.includes('Oral')) return 'Oral';
    if (route.includes('Intranasal')) return 'Nasal';
    return route.substring(0, 4);
  };

  const renderItem = ({ item }) => {
    const freq = formatFrequency(item.daysBetween);
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        onPress={() => navigation.navigate('AddVaccineName', { vaccine: item })}
        activeOpacity={0.75}
      >
        {/* Left accent bar */}
        <View style={[styles.accentBar, { backgroundColor: freq.color }]} />

        <View style={styles.cardContent}>
          {/* Top row: name + chevron */}
          <View style={styles.cardTop}>
            <View style={[styles.iconWrap, { backgroundColor: freq.color + '15' }]}>
              <Syringe size={18} color={freq.color} strokeWidth={2} />
            </View>
            <View style={styles.nameBlock}>
              <Text style={[styles.vaccineName, { color: theme.colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              {item.diseaseName ? (
                <Text style={[styles.diseaseName, { color: theme.colors.textLight }]} numberOfLines={1}>
                  {item.diseaseName}
                </Text>
              ) : null}
            </View>
            <ChevronRight size={16} color={theme.colors.textMuted} />
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: theme.colors.border + '40' }]} />

          {/* Bottom chips row */}
          <View style={styles.chipsRow}>
            {/* Frequency chip */}
            <View style={[styles.chip, { backgroundColor: freq.color + '12', borderColor: freq.color + '30' }]}>
              <Clock size={11} color={freq.color} />
              <Text style={[styles.chipText, { color: freq.color }]}>{freq.label}</Text>
            </View>

            {/* Dose chip */}
            {item.doseMl ? (
              <View style={[styles.chip, { backgroundColor: theme.colors.border + '30', borderColor: theme.colors.border }]}>
                <Droplets size={11} color={theme.colors.textLight} />
                <Text style={[styles.chipText, { color: theme.colors.textLight }]}>{item.doseMl} ml</Text>
              </View>
            ) : null}

            {/* Route chip */}
            {item.applicationRoute ? (
              <View style={[styles.chip, { backgroundColor: theme.colors.border + '30', borderColor: theme.colors.border }]}>
                <Activity size={11} color={theme.colors.textLight} />
                <Text style={[styles.chipText, { color: theme.colors.textLight }]}>{getRouteShort(item.applicationRoute)}</Text>
              </View>
            ) : null}

            {/* Default badge */}
            {item.isDefault && (
              <View style={[styles.defaultBadge, { backgroundColor: theme.colors.primary + '12', borderColor: theme.colors.primary + '25' }]}>
                <Text style={[styles.defaultBadgeText, { color: theme.colors.primary }]}>Default</Text>
              </View>
            )}
          </View>

          {/* Remark */}
          {item.remark ? (
            <Text style={[styles.remark, { color: theme.colors.textLight }]} numberOfLines={1}>
              {item.remark}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader title="Vaccine Names" onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={vaccines}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={[styles.listCount, { color: theme.colors.textLight }]}>
                {vaccines.length} vaccines in catalog
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Syringe size={64} color={theme.colors.border} />
              <Text style={[styles.emptyText, { color: theme.colors.textLight }]}>No vaccines defined yet</Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('AddVaccineName')}
      >
        <Plus size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 100,
  },
  listHeader: {
    paddingVertical: 16,
  },
  listCount: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1.2,
    marginBottom: 16, // Increased spacing between cards
    overflow: 'hidden',
    ...SHADOW.small,
  },
  accentBar: {
    width: 6, // Slightly thicker for more color pop
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 16, // Increased padding
    paddingVertical: 16,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  iconWrap: {
    width: 42, // Slightly larger icon
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameBlock: {
    flex: 1,
  },
  vaccineName: {
    fontSize: 16, // Slightly larger name
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
  },
  diseaseName: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8, // More gap between chips
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  defaultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  remark: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.large,
  },
});

export default VaccineDefinitionsScreen;
