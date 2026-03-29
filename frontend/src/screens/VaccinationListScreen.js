import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { COLORS, SPACING, SHADOW, lightTheme } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import { Syringe, Calendar, User, Plus } from 'lucide-react-native';
import api from '../api';
import { useFocusEffect } from '@react-navigation/native';

const VaccinationListScreen = ({ navigation, route }) => {
  const { isDarkMode, theme } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const mode = route.params?.mode; // 'SINGLE' or 'MASS' or undefined
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const getTitle = () => {
    if (mode === 'SINGLE') return 'Single Vaccinations';
    if (mode === 'MASS') return 'Mass Vaccinations';
    return 'All Vaccinations';
  };

  useFocusEffect(
    useCallback(() => {
      fetchRecords();
    }, [mode])
  );

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const url = mode 
        ? `/vaccines/records?creationMode=${mode}` 
        : '/vaccines/records';
      const response = await api.get(url);
      setRecords(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Fetch vaccination records error:', error);
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.recordItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      onPress={() => navigation.navigate('AddVaccination', { mode: 'single', record: item })}
    >
      <View style={styles.recordHeader}>
        <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#1E293B' : '#EEF2FF' }]}>
          <Syringe size={20} color={theme.colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.vaccineName, { color: theme.colors.text }]}>{item.vaccine?.name}</Text>
          <View style={styles.tagRow}>
            <User size={14} color={theme.colors.textLight} />
            <Text style={[styles.tagNumber, { color: theme.colors.textLight }]}>Tag: {item.animal?.tagNumber}</Text>
          </View>
        </View>
        <View style={styles.rightCol}>
          <View style={[styles.dateBox, { backgroundColor: isDarkMode ? '#334155' : '#F3F4F6' }]}>
            <Calendar size={12} color={theme.colors.textLight} />
            <Text style={[styles.dateText, { color: theme.colors.textLight }]}>{item.date}</Text>
          </View>
          <View style={[styles.modeBadge, 
            { backgroundColor: isDarkMode ? '#1E293B' : (item.creationMode === 'MASS' ? '#EEF2FF' : '#F3F4F6') }]}>
            <Text style={[styles.modeText, { color: isDarkMode ? theme.colors.primary : '#6B7280' }]}>{item.creationMode || 'SINGLE'}</Text>
          </View>
        </View>
      </View>
      
      {item.nextDueDate && (
        <View style={[styles.dueSection, { backgroundColor: isDarkMode ? '#451A03' : '#FFFBEB' }]}>
          <Text style={[styles.dueLabel, { color: isDarkMode ? '#FCD34D' : '#D97706' }]}>Next Due Date:</Text>
          <Text style={[styles.dueValue, { color: isDarkMode ? '#FCD34D' : '#D97706' }]}>{item.nextDueDate}</Text>
        </View>
      )}

      {item.remark ? (
        <Text style={[styles.remarkText, { color: theme.colors.textLight, borderTopColor: theme.colors.border }]} numberOfLines={2}>Note: {item.remark}</Text>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader title={getTitle()} onBack={() => navigation.goBack()} />
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={records}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Syringe size={64} color={theme.colors.border} />
              <Text style={[styles.emptyText, { color: theme.colors.textLight }]}>No vaccination records found</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button to Add */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: theme.colors.primary, ...theme.shadow.lg }]}
        onPress={() => {
          Alert.alert(
            'Add Vaccination',
            'Choose vaccination mode',
            [
              { text: 'Single Vaccination', onPress: () => navigation.navigate('AddVaccination', { mode: 'single' }) },
              { text: 'Mass Vaccination', onPress: () => navigation.navigate('AddVaccination', { mode: 'mass' }) },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        }}
      >
        <Plus size={30} color={theme.colors.white} />
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.lg,
  },
  recordItem: {
    borderRadius: 20,
    padding: 16,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vaccineName: {
    fontSize: 17,
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: -0.5,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  tagNumber: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    marginLeft: 4,
  },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 11,
    marginLeft: 4,
    fontFamily: 'Montserrat_600SemiBold',
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  modeBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modeText: {
    fontSize: 10,
    fontFamily: 'Montserrat_600SemiBold',
    textTransform: 'uppercase',
  },
  dueSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  dueLabel: {
    fontSize: 13,
    fontFamily: 'Montserrat_600SemiBold',
  },
  dueValue: {
    fontSize: 13,
    fontFamily: 'Montserrat_600SemiBold',
  },
  remarkText: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 10,
    borderTopWidth: 1,
    paddingTop: 10,
    fontFamily: 'Montserrat_500Medium',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  }
});

export default VaccinationListScreen;
