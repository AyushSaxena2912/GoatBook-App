import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, Platform, Alert, TouchableOpacity, ActivityIndicator, Modal, TextInput } from 'react-native';
import { SPACING, SHADOW } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import GButton from '../components/GButton';
import GAlert from '../components/GAlert';
import api from '../api';
import { useTranslation } from 'react-i18next';

// A deliberately minimal, notepad-like editor: one big text box people can
// just start typing into. The title is optional - if left blank it is
// derived from the first line of the note when saved.
const AddNoteScreen = ({ route, navigation }) => {
  const { isDarkMode, theme } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const { t } = useTranslation();
  const existingNote = route.params?.note;
  const isEditing = !!existingNote;

  const [title, setTitle] = useState(existingNote?.title || '');
  const [content, setContent] = useState(existingNote?.content || '');
  const [loading, setLoading] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const deriveTitle = () => {
    if (title.trim()) return title.trim();
    const firstLine = content.trim().split('\n')[0];
    if (firstLine) return firstLine.slice(0, 60);
    return t('notes.untitled', 'Untitled Note');
  };

  const handleSubmit = async () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert(t('notes.required', 'Nothing to save'), t('notes.requiredMessage', 'Write something before saving your note.'));
      return;
    }

    try {
      setLoading(true);
      const payload = { title: deriveTitle(), content: content.trim() || null };

      if (isEditing) {
        await api.put(`/notes/${existingNote.id}`, payload);
        setSuccessMessage(t('notes.updated', 'Note updated successfully'));
      } else {
        await api.post('/notes', payload);
        setSuccessMessage(t('notes.saved', 'Note saved successfully'));
      }
      setSuccessVisible(true);
    } catch (error) {
      console.error('Add/Edit note error:', error);
      const msg = error.response?.data?.message || t('notes.saveFailed', 'Failed to save note');
      Alert.alert(t('common.error', 'Error'), msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => setShowDeleteModal(true);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/notes/${existingNote.id}`);
      setDeleting(false);
      setShowDeleteModal(false);
      setSuccessMessage(t('notes.deleted', 'Note deleted successfully'));
      setSuccessVisible(true);
    } catch (error) {
      setDeleting(false);
      setShowDeleteModal(false);
      Alert.alert(t('common.error', 'Error'), t('notes.deleteFailed', 'Failed to delete note'));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader
        title={isEditing ? t('notes.editNote', 'Edit Note') : t('notes.newNote', 'New Note')}
        onBack={() => navigation.goBack()}
        leftAlign
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {isEditing && (
            <Text style={[styles.timestamp, { color: theme.colors.textMuted }]}>
              {t('notes.lastEdited', 'Last edited')} {new Date(existingNote.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          )}
          <TextInput
            style={[styles.titleInput, { color: theme.colors.text, borderBottomColor: theme.colors.border }]}
            placeholder={t('notes.titlePlaceholder', 'Title (optional)')}
            placeholderTextColor={theme.colors.textMuted}
            value={title}
            onChangeText={setTitle}
            cursorColor={theme.colors.primary}
            selectionColor={theme.colors.primary + '40'}
          />
          <TextInput
            style={[styles.bodyInput, { color: theme.colors.text }]}
            placeholder={t('notes.bodyPlaceholder', 'Start writing...')}
            placeholderTextColor={theme.colors.textMuted}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            autoFocus={!isEditing}
            cursorColor={theme.colors.primary}
            selectionColor={theme.colors.primary + '40'}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <GButton
          title={isEditing ? t('notes.updateNote', 'Update Note') : t('notes.saveNote', 'Save Note')}
          onPress={handleSubmit}
          loading={loading}
          containerStyle={{ marginBottom: isEditing ? 12 : 0 }}
        />

        {isEditing && (
          <TouchableOpacity
            style={[styles.deleteOutlineBtn, { borderColor: theme.colors.error + '30' }]}
            onPress={handleDelete}
            disabled={loading || deleting}
          >
            <Text style={[styles.deleteOutlineBtnText, { color: theme.colors.error }]}>
              {t('notes.deleteNote', 'Delete Note')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Delete confirmation */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDeleteModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('notes.deleteTitle', 'Delete Note?')}</Text>
            <Text style={styles.modalMessage}>
              {t('notes.deleteMessage', 'Are you sure you want to remove this note permanently? This cannot be undone.')}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowDeleteModal(false)} style={styles.modalBtn}>
                <Text style={styles.modalCancelText}>{t('common.cancel', 'CANCEL').toUpperCase()}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDelete} style={styles.modalBtn} disabled={deleting}>
                {deleting ? (
                  <ActivityIndicator size="small" color={theme.colors.error} />
                ) : (
                  <Text style={styles.modalDeleteText}>{t('common.delete', 'DELETE').toUpperCase()}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <GAlert
        visible={successVisible}
        title={t('common.successEx', 'Success!')}
        message={successMessage}
        type="success"
        confirmText={t('common.excellent', 'Excellent')}
        onClose={() => {
          setSuccessVisible(false);
          navigation.goBack();
        }}
      />
    </View>
  );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 20,
    flexGrow: 1,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: SPACING.lg,
    ...SHADOW.sm,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: theme.typography.medium,
    marginBottom: 14,
  },
  titleInput: {
    fontSize: 21,
    fontFamily: theme.typography.bold,
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    outlineStyle: Platform.OS === 'web' ? 'none' : undefined,
  },
  bodyInput: {
    fontSize: 16,
    fontFamily: theme.typography.regular,
    lineHeight: 25,
    flex: 1,
    minHeight: 240,
    outlineStyle: Platform.OS === 'web' ? 'none' : undefined,
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    paddingBottom: Platform.OS === 'ios' ? 30 : SPACING.lg,
  },
  deleteOutlineBtn: {
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  deleteOutlineBtnText: {
    fontSize: 15,
    fontFamily: theme.typography.semiBold,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 24,
    ...SHADOW.large,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: theme.typography.bold,
    color: theme.colors.text,
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 15,
    fontFamily: theme.typography.regular,
    color: theme.colors.textLight,
    lineHeight: 22,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
  },
  modalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  modalCancelText: {
    fontSize: 14,
    fontFamily: theme.typography.bold,
    color: '#1A73E8',
    letterSpacing: 0.5,
  },
  modalDeleteText: {
    fontSize: 14,
    fontFamily: theme.typography.bold,
    color: theme.colors.error,
    letterSpacing: 0.5,
  },
});

export default AddNoteScreen;
