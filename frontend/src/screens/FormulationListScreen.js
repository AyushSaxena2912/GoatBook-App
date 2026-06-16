import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Plus, ClipboardList } from 'lucide-react-native';
import GHeader from '../components/GHeader';
import FormulationCard from '../components/FormulationCard';
import { getFormulations } from '../api/feedFormulationService';

const FormulationListScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [formulations, setFormulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchList = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const res = await getFormulations();
      setFormulations(res.data || []);
    } catch (err) {
      console.warn('Failed to fetch formulations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchList();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchList(false);
  };

  const renderItem = ({ item }) => (
    <FormulationCard
      formulation={item}
      onPress={() => navigation.navigate('FormulationDetail', { id: item.id })}
    />
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.primary + '10' }]}>
        <ClipboardList size={48} color={theme.colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        {t('feedFormulation.noFormulations', 'No Formulations Found')}
      </Text>
      <Text style={[styles.emptyDesc, { color: theme.colors.textLight }]}>
        {t('feedFormulation.emptyDesc', 'Create balanced feed mixes for your goats/sheep to reduce feed cost.')}
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('AddFormulation')}
      >
        <Plus size={18} color="white" style={styles.btnIcon} />
        <Text style={styles.emptyButtonText}>
          {t('feedFormulation.addFormulation', 'Create Formulation')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader
        title={t('feedFormulation.title', 'Feed Formulations')}
        onMenu={!navigation.canGoBack() ? () => navigation.openDrawer() : undefined}
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
        leftAlign={true}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={formulations}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={EmptyState}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
        />
      )}

      {!loading && formulations.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.colors.primary, ...theme.shadow.lg }]}
          onPress={() => navigation.navigate('AddFormulation')}
          activeOpacity={0.8}
        >
          <Plus color="white" size={30} strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 100,
    maxWidth: 768,
    width: '100%',
    alignSelf: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    zIndex: 90,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  btnIcon: {
    marginRight: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
});

export default FormulationListScreen;
