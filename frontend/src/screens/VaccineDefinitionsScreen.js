import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, SectionList, TouchableOpacity, ActivityIndicator } from 'react-native';
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

  const formatFrequency = (item) => {
    if (item.name === 'ET Dose - 1') return { label: 'Initial Dose', color: '#F59E0B' };
    const days = item.daysBetween;
    if (!days || days === 0) return { label: 'One-time', color: '#8B5CF6' };
    if (days === 21) return { label: 'Every 21 Days', color: '#F59E0B' };
    if (days % 365 === 0) return { label: `Every ${days / 365} Year${days / 365 > 1 ? 's' : ''}`, color: '#10B981' };
    if (days % 30 === 0) return { label: `Every ${days / 30} Month${days / 30 > 1 ? 's' : ''}`, color: '#3B82F6' };
    return { label: `Every ${days} Days`, color: '#F59E0B' };
  };

  const getRouteShort = (route) => {
    if (!route) return [];
    const parts = route.split(' / ').map(r => r.trim());
    const labels = [];
    for (const part of parts) {
      if (part.includes('Subcutaneous') || part.includes('S/c') || part === 'SC') labels.push('S/C');
      else if (part.includes('Intramuscular') || part.includes('I/M') || part === 'IM') labels.push('I/M');
      else if (part.includes('Oral')) labels.push('Oral');
      else if (part.includes('Intranasal')) labels.push('Nasal');
      else labels.push(part.substring(0, 4));
    }
    return labels;
  };

  const renderItem = ({ item }) => {
    const freq = formatFrequency(item);
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border + '80' }]}
        onPress={() => navigation.navigate('AddVaccineName', { vaccine: item })}
        activeOpacity={0.75}
      >
        <View style={styles.cardInner}>
          <View style={styles.cardContent}>
            {/* Top row: icon and name */}
            <View style={styles.cardTop}>
              <View style={[styles.iconWrap, { backgroundColor: freq.color + '15' }]}>
                <Syringe size={20} color={freq.color} strokeWidth={2.5} />
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
            </View>

            {/* Bottom info row (simplified chips) */}
            <View style={styles.infoRow}>
              <View style={[styles.infoItem, { backgroundColor: freq.color + '12' }]}>
                <Clock size={12} color={freq.color} />
                <Text style={[styles.infoText, { color: freq.color }]}>{freq.label}</Text>
              </View>

              {item.doseMl ? (
                <View style={[styles.infoItem, { backgroundColor: theme.colors.border + '40' }]}>
                  <Text style={[styles.infoText, { color: theme.colors.text }]}>{item.doseMl} ml</Text>
                </View>
              ) : null}

              {item.applicationRoute ? (
                getRouteShort(item.applicationRoute).map((label, idx) => (
                  <View key={idx} style={[styles.infoItem, { backgroundColor: theme.colors.border + '40' }]}>
                    <Text style={[styles.infoText, { color: theme.colors.text }]}>{label}</Text>
                  </View>
                ))
              ) : null}
            </View>

            {/* Remark */}
            {item.remark ? (
              <Text style={[styles.remark, { color: theme.colors.textLight }]} numberOfLines={2}>
                {item.remark}
              </Text>
            ) : null}
          </View>

          {/* Centered Right Chevron */}
          <View style={styles.chevronContainer}>
            <ChevronRight size={24} color={theme.colors.textMuted || '#9CA3AF'} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const sections = useMemo(() => {
    const defaultVaccines = vaccines.filter(v => v.isDefault);
    const customVaccines = vaccines.filter(v => !v.isDefault);
    const result = [];
    if (customVaccines.length > 0) {
      result.push({ title: 'Custom Vaccines', data: customVaccines });
    }
    if (defaultVaccines.length > 0) {
      result.push({ title: 'System Default', data: defaultVaccines });
    }
    return result;
  }, [vaccines]);

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>{title}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader title="Vaccine Names" onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}

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
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  listHeader: {
    paddingVertical: 16,
  },
  listCount: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    backgroundColor: theme.colors.surface,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  chevronContainer: {
    paddingRight: 16,
    paddingLeft: 4,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vaccineName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.2,
  },
  customBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  customBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  diseaseName: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  remark: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 12,
    lineHeight: 18,
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
