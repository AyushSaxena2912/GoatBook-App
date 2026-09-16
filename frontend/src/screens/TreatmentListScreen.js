import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, FlatList, Alert } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import { Search, Plus, ChevronDown, ChevronUp, Edit2, Trash2, Calendar, Stethoscope, X } from 'lucide-react-native';
import { SPACING } from '../theme';
import api from '../api';
import { useTranslation } from 'react-i18next';

const TreatmentListScreen = ({ navigation, route }) => {
  const { theme, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);

  const [searchTag, setSearchTag] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isNotFound, setIsNotFound] = useState(false);
  const [animal, setAnimal] = useState(null);
  const [treatments, setTreatments] = useState([]);
  const [treatmentsLoading, setTreatmentsLoading] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState(true);

  useEffect(() => {
    if (route.params?.prefillTag && !isSearching) {
      setSearchTag(route.params.prefillTag);
      handleSearch(route.params.prefillTag);
    }
  }, [route.params?.timestamp]);

  const handleSearch = async (tagToSearch = searchTag) => {
    const cleaned = tagToSearch.trim();
    if (!cleaned) {
      setAnimal(null);
      setTreatments([]);
      setIsNotFound(false);
      return;
    }

    setIsSearching(true);
    setIsNotFound(false);
    setAnimal(null);
    setTreatments([]);

    try {
      const res = await api.get(`/animals/check-tag/${cleaned}`);
      if (res.data && res.data.id) {
        setAnimal(res.data);
        setIsNotFound(false);
        fetchAnimalTreatments(res.data.id);
      } else {
        setAnimal(null);
        setTreatments([]);
        setIsNotFound(true);
      }
    } catch (err) {
      console.error('Search error:', err);
      setAnimal(null);
      setTreatments([]);
      setIsNotFound(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleTagChange = async (text) => {
    setSearchTag(text);
    const cleaned = text.trim();
    if (cleaned.length >= 3) {
      setIsSearching(true);
      setIsNotFound(false);
      try {
        const res = await api.get(`/animals/check-tag/${cleaned}`);
        if (res.data && res.data.id) {
          setAnimal(res.data);
          setIsNotFound(false);
          fetchAnimalTreatments(res.data.id);
        } else {
          setAnimal(null);
          setTreatments([]);
          setIsNotFound(true);
        }
      } catch (err) {
        setAnimal(null);
        setTreatments([]);
        setIsNotFound(true);
      } finally {
        setIsSearching(false);
      }
    } else {
      setAnimal(null);
      setTreatments([]);
      setIsNotFound(false);
    }
  };

  const fetchAnimalTreatments = async (animalId) => {
    setTreatmentsLoading(true);
    try {
      const res = await api.get(`/treatments/animal/${animalId}`);
      setTreatments(res.data);
      setAccordionOpen(true);
    } catch (err) {
      console.error('Fetch treatments error:', err);
    } finally {
      setTreatmentsLoading(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Record',
      'Are you sure you want to delete this treatment record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/treatments/${id}`);
              if (animal) fetchAnimalTreatments(animal.id);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete record');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader title={t('farmActivities.treatmentRecords', 'Treatment Records')} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Search Section */}
        <View style={styles.searchSection}>
          <Text style={styles.searchLabel}>{t('farmActivities.scanEnterTagId', 'Scan / Enter Tag Id*')}</Text>
          <View style={styles.searchRow}>
            <View style={[styles.searchInputContainer, { borderColor: theme.colors.border, flex: 1 }]}>
              <TextInput
                style={[styles.searchInput, { color: theme.colors.text }]}
                value={searchTag}
                onChangeText={handleTagChange}
                placeholder="2012"
                placeholderTextColor={theme.colors.textMuted}
              />
              {isSearching ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : searchTag ? (
                <TouchableOpacity onPress={() => { setSearchTag(''); setAnimal(null); setIsNotFound(false); }}>
                  <X size={18} color={theme.colors.textMuted} />
                </TouchableOpacity>
              ) : (
                <Search size={20} color={theme.colors.textMuted} />
              )}
            </View>
          </View>

          {isNotFound && (
            <View style={styles.notFoundContainer}>
              <Text style={styles.notFoundText}>Animal not found</Text>
            </View>
          )}
        </View>

        {/* Accordion Section */}
        {animal && (
          <View style={styles.accordionContainer}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setAccordionOpen(!accordionOpen)}
            >
              <Text style={styles.accordionTitle}>{t('farmActivities.treatmentHistory', 'Treatment History')}</Text>
              {accordionOpen ? <ChevronUp size={20} color={theme.colors.text} /> : <ChevronDown size={20} color={theme.colors.text} />}
            </TouchableOpacity>

            {accordionOpen && (
              <View style={[styles.accordionContent, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                
                <TouchableOpacity
                  style={[styles.addNewRecordBtn, { backgroundColor: theme.colors.primary }]}
                  onPress={() => navigation.navigate('AddTreatment', { preSelectedAnimal: animal })}
                >
                  <Plus size={16} color="#FFF" />
                  <Text style={styles.addNewRecordText}>{t('farmActivities.addNewRecord', 'Add New Record')}</Text>
                </TouchableOpacity>

                {treatmentsLoading ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 20 }} />
                ) : treatments.length === 0 ? (
                  <Text style={[styles.noRecordsText, { color: theme.colors.textMuted }]}>No Records Found</Text>
                ) : (
                  treatments.map((item, index) => (
                    <View
                      key={item.id}
                      style={[
                        styles.recordItem,
                        { borderColor: theme.colors.border },
                        index === treatments.length - 1 && { borderBottomWidth: 0 },
                      ]}
                    >
                      <View style={styles.recordIconBox}>
                        <Stethoscope size={16} color={theme.colors.primary} />
                      </View>
                      <View style={styles.recordContent}>
                        <Text style={[styles.recordTitle, { color: theme.colors.text }]}>
                          {item.treatment_type || item.disease_name || item.medicine_name || 'Treatment'}
                        </Text>
                        <Text style={[styles.recordSub, { color: theme.colors.textMuted }]}>
                          {item.date ? new Date(item.date).toLocaleDateString() : ''} • {item.medicine_name || 'N/A'} {item.dosage ? `(${item.dosage})` : ''}
                        </Text>
                        {item.cost ? (
                          <Text style={[styles.recordCost, { color: theme.colors.primary }]}>₹{item.cost}</Text>
                        ) : null}
                      </View>
                      <View style={styles.recordActions}>
                        <TouchableOpacity
                          onPress={() => navigation.navigate('AddTreatment', { preSelectedAnimal: animal, record: item })}
                          style={styles.actionIcon}
                        >
                          <Edit2 size={16} color={theme.colors.textMuted} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionIcon}>
                          <Trash2 size={16} color={theme.colors.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const getStyles = (theme, isDarkMode) =>
  StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: SPACING.md },
    searchSection: { marginBottom: 24 },
    searchLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: theme.colors.textMuted, marginBottom: 8 },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    notFoundContainer: {
      padding: 12,
      backgroundColor: isDarkMode ? '#3F1A1A' : '#FEE2E2',
      borderColor: theme.colors.error,
      borderWidth: 1,
      borderRadius: 8,
      marginTop: 12,
      alignItems: 'center',
    },
    notFoundText: {
      color: theme.colors.error,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 14,
    },
    searchInputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      height: 48,
      backgroundColor: theme.colors.surface,
    },
    searchInput: { flex: 1, fontSize: 16, fontFamily: 'Inter_400Regular' },
    accordionContainer: { marginTop: 10 },
    accordionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 4,
    },
    accordionTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: theme.colors.text },
    accordionContent: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      minHeight: 150,
    },
    addNewRecordBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      marginBottom: 20,
      alignSelf: 'center',
    },
    addNewRecordText: { color: '#FFF', fontFamily: 'Inter_500Medium', fontSize: 13 },
    noRecordsText: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 10, textAlign: 'center' },
    recordItem: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    recordIconBox: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    recordContent: { flex: 1 },
    recordTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
    recordSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
    recordCost: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginTop: 2 },
    recordActions: { flexDirection: 'row', gap: 12 },
    actionIcon: { padding: 4 },
  });

export default TreatmentListScreen;
