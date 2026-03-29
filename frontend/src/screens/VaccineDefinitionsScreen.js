import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, SHADOW, lightTheme } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import { ListPlus, Plus, Calendar, Settings } from 'lucide-react-native';
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
      setLoading(false);
    } catch (error) {
      console.error('Fetch vaccines error:', error);
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.recordItem}>
      <View style={styles.recordHeader}>
        <View style={styles.iconBox}>
          <ListPlus size={20} color={theme.colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.vaccineName, { color: theme.colors.text }]}>{item.name}</Text>
          <Text style={[styles.daysText, { color: theme.colors.textLight }]}>Required every {item.daysBetween} days</Text>
        </View>
        <TouchableOpacity style={styles.editBtn}>
           <Settings size={18} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </View>
      {item.remark ? (
        <Text style={[styles.remarkText, { color: theme.colors.textLight, borderTopColor: theme.colors.border }]}>{item.remark}</Text>
      ) : null}
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
        <FlatList
          data={vaccines}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ListPlus size={64} color={theme.colors.border} />
              <Text style={[styles.emptyText, { color: theme.colors.textLight }]}>No vaccines defined yet</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button to Add */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: theme.colors.primary, ...theme.shadow.lg }]}
        onPress={() => navigation.navigate('AddVaccineName')}
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
    paddingBottom: 100,
  },
  recordItem: {
    borderRadius: 20,
    padding: 16,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: isDarkMode ? '#1A1A1A' : '#EEF2FF',
  },
  vaccineName: {
    fontSize: 17,
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: -0.5,
  },
  daysText: {
    fontSize: 13,
    fontFamily: 'Montserrat_600SemiBold',
  },
  remarkText: {
    marginTop: 10,
    fontSize: 13,
    fontStyle: 'italic',
    paddingTop: 10,
    borderTopWidth: 1,
    fontFamily: 'Montserrat_500Medium',
  },
  editBtn: {
    padding: 8,
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

export default VaccineDefinitionsScreen;
