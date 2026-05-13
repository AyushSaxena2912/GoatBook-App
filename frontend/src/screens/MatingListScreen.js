import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import { useFocusEffect } from '@react-navigation/native';
import { Heart, Tag, Plus, Calendar } from 'lucide-react-native';
import { SPACING } from '../theme';
import api from '../api';

const STATUS_COLORS = {
  PREGNANT: '#22c55e',
  NOT_SUCCESSFUL: '#ef4444',
  MISCARRIAGE: '#f97316',
};

const STATUS_LABELS = {
  PREGNANT: 'Pregnant',
  NOT_SUCCESSFUL: 'Not Successful',
  MISCARRIAGE: 'Miscarriage',
};

const MATING_TYPE_LABELS = {
  NATURAL: 'Natural',
  AI: 'Artificial Insemination',
  ET: 'Embryo Transplant',
};

const MatingListScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const [matings, setMatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchMatings();
    }, [])
  );

  const fetchMatings = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      const res = await api.get('/matings');
      setMatings(res.data);
    } catch (err) {
      console.error('Fetch matings error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const renderItem = ({ item }) => {
    const statusColor = STATUS_COLORS[item.status] || theme.colors.textMuted;
    const matingDate = new Date(item.mating_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

    return (
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        {/* Header row */}
        <View style={styles.cardHeader}>
          <View style={styles.tagRow}>
            <Tag size={15} color={theme.colors.primary} />
            <Text style={[styles.tagText, { color: theme.colors.text }]}>
              {item.animals?.tag_number || 'N/A'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {STATUS_LABELS[item.status] || item.status}
            </Text>
          </View>
        </View>

        {/* Info row */}
        <View style={styles.infoRow}>
          <View style={styles.infoBlock}>
            <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Type</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {MATING_TYPE_LABELS[item.mating_type] || item.mating_type}
            </Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Date</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Calendar size={12} color={theme.colors.textMuted} />
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>{matingDate}</Text>
            </View>
          </View>
          {item.expected_delivery_date && (
            <View style={styles.infoBlock}>
              <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Due Date</Text>
              <Text style={[styles.infoValue, { color: theme.colors.primary }]}>
                {new Date(item.expected_delivery_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
              </Text>
            </View>
          )}
        </View>

        {item.remark ? (
          <Text style={[styles.remark, { color: theme.colors.textMuted }]} numberOfLines={1}>
            {item.remark}
          </Text>
        ) : null}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader title="Mating Records" onBack={() => navigation.goBack()} />

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={matings}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMatings(true); }} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Heart size={64} color={theme.colors.border} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Mating Records</Text>
              <Text style={[styles.emptySub, { color: theme.colors.textMuted }]}>
                Add a mating record from an animal's profile or tap + below.
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('AddMating')}
      >
        <Plus size={28} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: SPACING.md, paddingBottom: 100 },
  card: {
    borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tagText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  infoRow: { flexDirection: 'row', gap: 16 },
  infoBlock: { flex: 1 },
  infoLabel: { fontSize: 10, fontFamily: 'Inter_500Medium', marginBottom: 2, letterSpacing: 0.3 },
  infoValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  remark: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 10, fontStyle: 'italic' },
  emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_600SemiBold', marginTop: 20 },
  emptySub: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20, fontFamily: 'Inter_400Regular' },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 62, height: 62, borderRadius: 31,
    justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6,
  },
});

export default MatingListScreen;
