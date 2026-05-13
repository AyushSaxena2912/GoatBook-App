import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Platform, ScrollView, TextInput } from 'react-native';
import { COLORS, SPACING, SHADOW } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import { Syringe, Calendar, User, Tag, ChevronRight, Hash, AlertTriangle, CheckCircle2, Search, SlidersHorizontal, Info, LayoutDashboard } from 'lucide-react-native';
import api from '../api';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const VaccinationListScreen = ({ navigation, route }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchRecords();
    }, [])
  );

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vaccines/records');
      setRecords(response.data);
    } catch (error) {
      console.error('Fetch records error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBoosterStatus = (nextDueDate) => {
    if (!nextDueDate) return null;
    const today = new Date();
    const due = new Date(nextDueDate);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: 'Overdue', color: '#EF4444', icon: <AlertTriangle size={12} color="#EF4444" /> };
    if (diffDays <= 7) return { label: 'Due Soon', color: '#F59E0B', icon: <AlertTriangle size={12} color="#F59E0B" /> };
    return { label: 'Active', color: '#10B981', icon: <CheckCircle2 size={12} color="#10B981" /> };
  };

  const filteredRecords = useMemo(() => {
    if (!searchQuery) return records;
    const query = searchQuery.toLowerCase();
    return records.filter(r => 
      r.animal?.tagNumber?.toLowerCase().includes(query) || 
      r.vaccine?.name?.toLowerCase().includes(query)
    );
  }, [records, searchQuery]);

  const stats = useMemo(() => {
    const total = records.length;
    const today = new Date();
    const upcoming = records.filter(r => {
      if (!r.nextDueDate) return false;
      const due = new Date(r.nextDueDate);
      const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }).length;
    const overdue = records.filter(r => {
      if (!r.nextDueDate) return false;
      const due = new Date(r.nextDueDate);
      return due < today;
    }).length;
    return { total, upcoming, overdue };
  }, [records]);

  const renderStatCard = (label, value, icon, color) => (
    <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.statIconBox, { backgroundColor: color + '10' }]}>
        {React.cloneElement(icon, { size: 16, color: color })}
      </View>
      <View>
        <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      </View>
    </View>
  );

  const renderItem = ({ item }) => {
    const booster = getBoosterStatus(item.nextDueDate);
    const adminDateFormatted = new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const nextDueDateFormatted = item.nextDueDate ? new Date(item.nextDueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('AddVaccination', { record: item })}
      >
        <View style={styles.cardHeader}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primary + 'AA']}
            style={styles.vaccineIconContainer}
          >
            <Syringe size={18} color="white" />
          </LinearGradient>
          
          <View style={styles.headerMain}>
            <Text style={[styles.vaccineNameText, { color: theme.colors.text }]} numberOfLines={1}>
              {item.vaccine?.name || 'Unknown Vaccine'}
            </Text>
            <View style={styles.tagInfoRow}>
              <View style={[styles.tagBadge, { backgroundColor: theme.colors.border + '30' }]}>
                <Tag size={10} color={theme.colors.textLight} />
                <Text style={[styles.tagText, { color: theme.colors.text }]}>#{item.animal?.tagNumber || 'No Tag'}</Text>
              </View>
              {booster && (
                <View style={[styles.statusChip, { backgroundColor: booster.color + '15' }]}>
                  <Text style={[styles.statusChipText, { color: booster.color }]}>
                    {booster.label.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <ChevronRight size={16} color={theme.colors.textMuted} />
        </View>

        <View style={[styles.cardDivider, { backgroundColor: theme.colors.border + '15' }]} />

        <View style={styles.cardInfoGrid}>
          <View style={styles.infoCol}>
            <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>LAST DOSE</Text>
            <View style={styles.infoValueRow}>
              <Calendar size={14} color={theme.colors.textMuted} />
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>{adminDateFormatted}</Text>
            </View>
          </View>
          <View style={styles.infoCol}>
            <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>NEXT DUE</Text>
            <View style={styles.infoValueRow}>
              <Calendar size={14} color={booster ? booster.color : theme.colors.textMuted} />
              <Text style={[styles.infoValue, { color: booster ? booster.color : theme.colors.text }]}>{nextDueDateFormatted}</Text>
            </View>
          </View>
        </View>

        {item.creationMode === 'MASS' && (
          <View style={[styles.creationModeTag, { backgroundColor: theme.colors.info + '05' }]}>
            <Info size={10} color={theme.colors.info} />
            <Text style={[styles.creationModeText, { color: theme.colors.info }]}>Recorded in Bulk</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader title="Vaccination Journal" onBack={() => navigation.goBack()} leftAlign={true} />
      
      <View style={styles.headerDashboard}>
        <View style={styles.sectionHeader}>
          <LayoutDashboard size={14} color={theme.colors.primary} />
          <Text style={[styles.sectionTitle, { color: theme.colors.textLight }]}>HEALTH OVERVIEW</Text>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.statsScroll}
        >
          {renderStatCard('Total Doses', stats.total, <Syringe />, theme.colors.primary)}
          {renderStatCard('Due Soon', stats.upcoming, <AlertTriangle />, '#F59E0B')}
          {renderStatCard('Overdue', stats.overdue, <AlertTriangle />, '#EF4444')}
        </ScrollView>
      </View>

      <View style={styles.searchSection}>
        <View style={[styles.searchBox, { backgroundColor: theme.colors.surface }]}>
          <Search size={18} color={theme.colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search tag or vaccine..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredRecords}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIcon, { backgroundColor: theme.colors.surface }]}>
                <Syringe size={40} color={theme.colors.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Records Found</Text>
              <Text style={[styles.emptySub, { color: theme.colors.textLight }]}>
                {searchQuery ? 'Try another tag or vaccine name.' : 'Your farm health history will appear here.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  headerDashboard: {
    paddingVertical: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: 12,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  statsScroll: {
    paddingHorizontal: SPACING.lg,
    gap: 12,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    minWidth: 140,
    ...SHADOW.small,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    lineHeight: 22,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 1,
  },
  searchSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 25,
    ...SHADOW.small,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  clearBtn: {
    padding: 4,
  },
  clearText: {
    color: theme.colors.primary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 4,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    ...SHADOW.small,
  },
  cardHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  vaccineIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerMain: {
    flex: 1,
  },
  vaccineNameText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    marginBottom: 6,
  },
  tagInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 50,
  },
  statusChipText: {
    fontSize: 9,
    fontFamily: 'Inter_800ExtraBold',
    letterSpacing: 0.5,
  },
  cardDivider: {
    height: 1.5,
    marginHorizontal: 16,
  },
  cardInfoGrid: {
    flexDirection: 'row',
    padding: 16,
    paddingVertical: 20,
    gap: 12,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.6,
    marginBottom: 8,
    opacity: 0.7,
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  creationModeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border + '30',
  },
  creationModeText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.3,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...SHADOW.small,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.7,
  },
});

export default VaccinationListScreen;
