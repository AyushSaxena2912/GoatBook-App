import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, SPACING } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import GInput from '../components/GInput';
import GButton from '../components/GButton';
import GSelect from '../components/GSelect';
import api from '../api';
import GAlert from '../components/GAlert';

const AddBreedScreen = ({ navigation, route }) => {
  const { isDarkMode, theme } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const isEditing = !!route.params?.breed;
  const existingBreed = route.params?.breed;

  const [name, setName] = useState(isEditing ? existingBreed.name : '');
  const [animalType, setAnimalType] = useState(isEditing ? existingBreed.animalType : 'Goat');
  const [origin, setOrigin] = useState(isEditing ? (existingBreed.origin || 'indian') : 'indian');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isSystemBreed = isEditing && existingBreed.isDefault;
  const animalCount = existingBreed?.animalCount || 0;
  const canDelete = isEditing && !isSystemBreed && animalCount === 0;

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'error'
  });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ visible: true, title, message, type });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      showAlert('Input Required', 'Please enter a breed name to proceed.', 'warning');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await api.put(`/breeds/${existingBreed.id}`, { name, animalType, origin });
      } else {
        await api.post('/breeds', { name, animalType, origin });
      }
      setLoading(false);
      navigation.goBack();
    } catch (error) {
      setLoading(false);
      const message = error.response?.data?.message || 'Something went wrong';
      const title = message.includes('system breed') ? 'System Protection' : 'Action Failed';
      showAlert(title, message, 'error');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/breeds/${existingBreed.id}`);
      setDeleting(false);
      navigation.goBack();
    } catch (error) {
      setDeleting(false);
      const message = error.response?.data?.message || 'Failed to delete breed';
      showAlert('Deletion Error', message, 'error');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={hideAlert}
      />

      <GHeader 
        title={isEditing ? "Edit Breed" : "Add New Breed"} 
        onBack={() => navigation.goBack()} 
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formSection}>
            <GSelect 
              label="Animal Type" 
              value={animalType} 
              onSelect={setAnimalType}
              options={[
                { label: 'Goat', value: 'Goat' },
                { label: 'Sheep', value: 'Sheep' }
              ]}
              required
              disabled={isSystemBreed}
            />
            
            <View style={styles.gap} />
            
            <GInput 
              label="Breed Name" 
              value={name} 
              onChangeText={setName} 
              placeholder="e.g. Boer, Sirohi, Khassi"
              required 
              editable={!isSystemBreed}
            />

            <View style={styles.gap} />

            <GSelect 
              label="Origin" 
              value={origin} 
              onSelect={setOrigin}
              options={[
                { label: 'Indian', value: 'indian' },
                { label: 'Exotic', value: 'exotic' }
              ]}
              required
              disabled={isSystemBreed}
            />
          </View>

          <View style={[styles.noteContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
            <Text style={[styles.note, { color: theme.colors.textMuted }]}>
              <Text style={[styles.noteBold, { color: theme.colors.primary }]}>Note : </Text>
              Manage your livestock breeds. You can specify whether a breed belongs to Goats or Sheep. 
            </Text>
          </View>

        </ScrollView>
        <View style={styles.footer}>
          {isEditing && animalCount > 0 && (
            <View style={[styles.warningContainer, { backgroundColor: isDarkMode ? '#1A1A1A' : '#FFF5F5', borderColor: '#FEB2B2' }]}>
              <Text style={[styles.warningText, { color: '#C53030' }]}>
                Cannot delete — this breed is used by {animalCount} {animalCount === 1 ? 'animal' : 'animals'}
              </Text>
            </View>
          )}

          {isEditing ? (
            !isSystemBreed && (
              <View style={styles.buttonRow}>
                <View style={[styles.halfWidth, { marginRight: 12 }]}>
                  <GButton 
                    title="Delete" 
                    onPress={handleDelete} 
                    variant="outline"
                    loading={deleting}
                    disabled={!canDelete}
                    buttonStyle={!canDelete && { borderColor: theme.colors.border, opacity: 0.5 }}
                    textStyle={!canDelete && { color: theme.colors.textMuted }}
                  />
                </View>
                <View style={styles.halfWidth}>
                  <GButton 
                    title="Save Changes" 
                    onPress={handleSubmit} 
                    loading={loading}
                    buttonStyle={{ backgroundColor: theme.colors.primary }}
                  />
                </View>
              </View>
            )
          ) : (
            <GButton 
              title="Create Breed" 
              onPress={handleSubmit} 
              loading={loading}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    flexGrow: 1,
    paddingBottom: 20, // Space for footer transition
  },
  formSection: {
    marginBottom: SPACING.xl,
    paddingTop: 8,
  },
  gap: {
    height: 16,
  },
  noteContainer: {
    padding: SPACING.lg,
    borderRadius: 16,
    borderWidth: 1.5,
    marginTop: SPACING.md,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  note: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
  noteBold: {
    fontFamily: 'Inter_600SemiBold',
  },
  footer: {
    padding: SPACING.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  halfWidth: {
    flex: 1,
  },
  warningContainer: {
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  warningText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
});

export default AddBreedScreen;
