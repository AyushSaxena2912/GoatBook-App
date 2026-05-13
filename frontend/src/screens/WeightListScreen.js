import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, RefreshControl, Modal, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import GConfirmModal from '../components/GConfirmModal';
import { Search, Plus, Scale, Trash2, Tag, ChevronRight, X, SearchX } from 'lucide-react-native';
import api from '../api';
import { useFocusEffect } from '@react-navigation/native';
import { getFromCache, saveToCache } from '../utils/cache';
import { COLORS, SPACING, SHADOW } from '../theme';
import { Animated } from 'react-native';

const WeightListScreen = ({ navigation }) => {
  const { isDarkMode, theme } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const [weights, setWeights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchBarTranslateY = React.useRef(new Animated.Value(-100)).current;
  
  // Custom Delete Modal State
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchWeights();
    }, [])
  );

  // Group weights by tag number for the summary view
  const groupedWeights = useMemo(() => {
    const groups = {};
    weights.forEach(w => {
      if (!groups[w.tagNumber]) {
        groups[w.tagNumber] = [];
      }
      groups[w.tagNumber].push(w);
    });
    
    // Sort each group by date (latest first)
    Object.keys(groups).forEach(tag => {
      groups[tag].sort((a, b) => new Date(b.date) - new Date(a.date));
    });

    return groups;
  }, [weights]);

  // Unique tags for the main list, filtered by search query
  const tagList = useMemo(() => {
    const tags = Object.keys(groupedWeights).map(tag => {
      const latestRecord = groupedWeights[tag][0];
      const animal = latestRecord?.animals;
      
      return {
        tagNumber: tag,
        latestWeight: latestRecord.weight,
        latestDate: latestRecord.date,
        count: groupedWeights[tag].length,
        history: groupedWeights[tag],
        // Animal details for the new card style
        breedName: animal?.Breeds?.name || 'N/A',
        gender: animal?.gender || '',
        imageUrl: animal?.imageUrl || null,
        locationName: animal?.Locations?.name || null
      };
    });

    if (!searchQuery) return tags;
    const q = searchQuery.toLowerCase();
    return tags.filter(t => 
      t.tagNumber.toLowerCase().includes(q) || 
      t.breedName.toLowerCase().includes(q)
    );
  }, [groupedWeights, searchQuery]);

  const openHistory = (tagData) => {
    setSelectedTag(tagData);
    setIsHistoryVisible(true);
  };

  const fetchWeights = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      const response = await api.get('/weights');
      setWeights(response.data);
      await saveToCache('weights', response.data);
    } catch (error) {
      console.error('Fetch weights error:', error);
      const cached = await getFromCache('weights');
      if (cached) setWeights(cached);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleSearch = () => {
    if (isSearching) {
      setSearchQuery('');
      Animated.timing(searchBarTranslateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsSearching(false));
    } else {
      setIsSearching(true);
      Animated.timing(searchBarTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleDeletePress = (record) => {
    setRecordToDelete(record);
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    
    setIsDeleting(true);
    try {
      await api.delete(`/weights/${recordToDelete.id}`);
      await fetchWeights();
      
      // If we deleted the last record in history, close history modal
      if (selectedTag && selectedTag.history.length === 1) {
        setIsHistoryVisible(false);
      } else if (selectedTag) {
        // Refresh local history view inside modal
        const updatedHistory = selectedTag.history.filter(h => h.id !== recordToDelete.id);
        setSelectedTag({ ...selectedTag, history: updatedHistory });
      }
      
      setIsDeleteModalVisible(false);
      setRecordToDelete(null);
    } catch (error) {
      alert('Failed to delete record');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderTagItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.tagCard} 
      onPress={() => openHistory(item)}
      activeOpacity={0.8}
    >
      <View style={styles.tagCardHeader}>
        <View style={styles.tagBadge}>
          <Tag size={16} color={theme.colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.tagNumberText, { color: theme.colors.text }]}>{item.tagNumber}</Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: theme.colors.primary + '15' }]}>
          <Text style={[styles.countText, { color: theme.colors.primary }]}>{item.count} {item.count === 1 ? 'Record' : 'Records'}</Text>
        </View>
      </View>
      
      <View style={styles.tagCardFooter}>
        <View>
          <Text style={[styles.latestLabel, { color: theme.colors.textLight }]}>Latest Weight</Text>
          <Text style={[styles.latestValue, { color: theme.colors.primary }]}>{item.latestWeight} KG</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.latestLabel, { color: theme.colors.textLight }]}>Last Recorded</Text>
          <Text style={[styles.latestDate, { color: theme.colors.text }]}>
            {new Date(item.latestDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        </View>
      </View>
      <View style={styles.cardAction}>
        <Text style={[styles.viewAllText, { color: theme.colors.textLight }]}>View History</Text>
        <ChevronRight size={16} color={theme.colors.textMuted} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader 
        title="Weight Records" 
        onBack={() => navigation.goBack()} 
        leftAlign 
        rightIcon={isSearching ? <X color="#FFFFFF" size={26} /> : <Search color="#FFFFFF" size={26} />}
        onRightPress={toggleSearch}
      />
      
      {isSearching && (
        <Animated.View style={[
          styles.animatedSearchContainer, 
          { 
            backgroundColor: theme.colors.surface,
            transform: [{ translateY: searchBarTranslateY }] 
          }
        ]}>
          <View style={[styles.searchInner, { backgroundColor: isDarkMode ? '#000' : '#F9FAFB' }]}>
            <Search size={20} color={theme.colors.textLight} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Search tag or breed..."
              placeholderTextColor={theme.colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={18} color={theme.colors.textLight} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}

      <View style={styles.content}>

        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={tagList}
            renderItem={renderTagItem}
            keyExtractor={item => item.tagNumber}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => fetchWeights(true)} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Scale size={64} color={theme.colors.border} />
                <Text style={[styles.emptyText, { color: theme.colors.text }]}>No records found</Text>
                <Text style={[styles.emptySub, { color: theme.colors.textLight }]}>Add measurements to start tracking by tag.</Text>
              </View>
            }
          />
        )}
      </View>

      {/* History Modal */}
      <Modal
        visible={isHistoryVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsHistoryVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Weight History</Text>
                <Text style={[styles.modalSubtitle, { color: theme.colors.textLight }]}>Tag: {selectedTag?.tagNumber}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsHistoryVisible(false)} style={styles.closeBtn}>
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.historyList}>
              {selectedTag?.history.map((record, index) => (
                <View key={record.id} style={styles.historyItem}>
                  <View style={styles.timeline}>
                    <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
                    {index !== selectedTag.history.length - 1 && <View style={[styles.line, { backgroundColor: theme.colors.border }]} />}
                  </View>
                  
                  <View style={[styles.historyCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                    <View style={styles.historyCardContent}>
                      <View style={styles.historyCardLeft}>
                        <Text style={[styles.historyDate, { color: theme.colors.text }]}>{new Date(record.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                        {record.height ? <Text style={[styles.historyHeight, { color: theme.colors.textLight }]}>Height: {record.height} cm</Text> : null}
                        {record.remark ? <Text style={[styles.historyRemark, { color: theme.colors.textLight }]} numberOfLines={2}>{record.remark}</Text> : null}
                      </View>
                      
                      <View style={styles.historyCardRight}>
                        <Text style={[styles.historyWeight, { color: theme.colors.primary }]}>{record.weight} KG</Text>
                        <TouchableOpacity onPress={() => handleDeletePress(record)} style={styles.deleteHistoryBtn}>
                          <Trash2 size={16} color={theme.colors.error + '70'} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <GConfirmModal
        visible={isDeleteModalVisible}
        title="Delete Weight Record?"
        message="Are you sure you want to remove this measurement? This growth history data cannot be recovered."
        confirmText="Delete"
        type="delete"
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalVisible(false)}
        loading={isDeleting}
      />

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: theme.colors.primary }]} 
        onPress={() => navigation.navigate('AddWeight')}
      >
        <Plus size={30} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    flex: 1,
  },
  animatedSearchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    zIndex: 5,
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  list: {
    paddingBottom: 80,
  },
  tagCard: {
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tagCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagNumberText: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  tagCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#00000008',
  },
  latestLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  latestValue: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  latestDate: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'right',
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 4,
  },
  viewAllText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '85%',
    padding: 24,
    ...theme.shadow.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  historyList: {
    paddingBottom: 40,
  },
  historyItem: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  timeline: {
    width: 40,
    alignItems: 'center',
    position: 'relative',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 16,
    zIndex: 2,
  },
  line: {
    position: 'absolute',
    top: 24, // Starts below the first dot's center
    bottom: -16, // Connects to the next item
    width: 2,
    zIndex: 1,
  },
  historyCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  historyCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyCardLeft: {
    flex: 1,
    gap: 2,
  },
  historyCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 10,
  },
  historyDate: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  historyHeight: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  historyRemark: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 0,
  },
  historyWeight: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  deleteHistoryBtn: {
    padding: 6,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadow.lg,
  },
});

export default WeightListScreen;
