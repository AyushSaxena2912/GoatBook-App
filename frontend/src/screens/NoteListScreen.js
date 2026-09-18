import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import GConfirmModal from '../components/GConfirmModal';
import { Plus, StickyNote, Trash2 } from 'lucide-react-native';
import api from '../api';
import { useFocusEffect } from '@react-navigation/native';
import { getFromCache, saveToCache } from '../utils/cache';
import { SPACING } from '../theme';
import { useTranslation } from 'react-i18next';

const NoteListScreen = ({ navigation }) => {
  const { isDarkMode, theme } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const { t } = useTranslation();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchNotes();
    }, [])
  );

  const fetchNotes = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      const response = await api.get('/notes');
      setNotes(response.data);
      await saveToCache('notes', response.data);
    } catch (error) {
      console.error('Fetch notes error:', error);
      const cached = await getFromCache('notes');
      if (cached) setNotes(cached);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeletePress = (note) => {
    setNoteToDelete(note);
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!noteToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/notes/${noteToDelete.id}`);
      setIsDeleteModalVisible(false);
      setNoteToDelete(null);
      fetchNotes();
    } catch (error) {
      alert(t('notes.deleteFailed', 'Failed to delete note'));
    } finally {
      setIsDeleting(false);
    }
  };

  const renderNote = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('AddNote', { note: item })}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
      </View>

      {item.content ? (
        <Text style={[styles.cardContent, { color: theme.colors.textLight }]} numberOfLines={3}>
          {item.content}
        </Text>
      ) : null}

      <View style={styles.cardFooter}>
        <Text style={[styles.cardDate, { color: theme.colors.textMuted }]}>
          {new Date(item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={() => handleDeletePress(item)} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Trash2 size={16} color={theme.colors.error + '80'} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader
        title={t('menu.notes', 'Notes')}
        onBack={() => navigation.goBack()}
        leftAlign
      />

      <View style={styles.content}>
        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={notes}
            renderItem={renderNote}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => fetchNotes(true)} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <StickyNote size={64} color={theme.colors.border} />
                <Text style={[styles.emptyText, { color: theme.colors.text }]}>
                  {t('notes.emptyTitle', 'No notes yet')}
                </Text>
                <Text style={[styles.emptySub, { color: theme.colors.textLight }]}>
                  {t('notes.emptySub', 'Jot down anything you want to remember about your farm or animals.')}
                </Text>
              </View>
            }
          />
        )}
      </View>

      <GConfirmModal
        visible={isDeleteModalVisible}
        title={t('notes.deleteTitle', 'Delete Note?')}
        message={t('notes.deleteMessage', 'Are you sure you want to remove this note permanently? This cannot be undone.')}
        confirmText={t('common.delete', 'Delete')}
        variant="destructive"
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalVisible(false)}
        loading={isDeleting}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('AddNote')}
      >
        <Plus size={30} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.md, flex: 1 },
  list: { paddingBottom: 80 },
  card: {
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    flex: 1,
    marginRight: 8,
  },
  cardContent: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDate: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  deleteBtn: {
    padding: 4,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
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

export default NoteListScreen;
