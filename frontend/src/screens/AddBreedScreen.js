import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, SPACING } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import GInput from '../components/GInput';
import GButton from '../components/GButton';
import GSelect from '../components/GSelect';
import api from '../api';

const AddBreedScreen = ({ navigation, route }) => {
  const { isDarkMode, theme } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const isEditing = !!route.params?.breed;
  const existingBreed = route.params?.breed;

  const [name, setName] = useState(isEditing ? existingBreed.name : '');
  const [animalType, setAnimalType] = useState(isEditing ? existingBreed.animalType : 'Goat');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('Please enter a breed name');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await api.put(`/breeds/${existingBreed.id}`, { name, animalType });
      } else {
        await api.post('/breeds', { name, animalType });
      }
      setLoading(false);
      navigation.goBack();
    } catch (error) {
      setLoading(false);
      const message = error.response?.data?.message || 'Something went wrong';
      alert(message);
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
      alert(message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
                { label: 'Sheep', value: 'Sheep' },
                { label: 'Other', value: 'Other' }
              ]}
              required
            />
            
            <View style={styles.gap} />
            
            <GInput 
              label="Breed Name" 
              value={name} 
              onChangeText={setName} 
              placeholder="e.g. Boer, Sirohi, Khassi"
              required 
            />
          </View>

          <View style={[styles.noteContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
            <Text style={[styles.note, { color: theme.colors.textMuted }]}>
              <Text style={[styles.noteBold, { color: theme.colors.primary }]}>Note : </Text>
              Manage your livestock breeds. You can specify whether a breed belongs to Goats or Sheep. 
            </Text>
          </View>

          <View style={styles.footer}>
            {isEditing ? (
              <View style={styles.buttonRow}>
                <View style={[styles.halfWidth, { marginRight: 8 }]}>
                  <GButton 
                    title="Delete" 
                    onPress={handleDelete} 
                    variant="outline"
                    loading={deleting}
                  />
                </View>
                <View style={styles.halfWidth}>
                  <GButton 
                    title="Save Changes" 
                    onPress={handleSubmit} 
                    loading={loading}
                  />
                </View>
              </View>
            ) : (
              <GButton 
                title="Create Breed" 
                onPress={handleSubmit} 
                loading={loading}
              />
            )}
          </View>
        </ScrollView>
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
    fontFamily: 'Montserrat_400Regular',
  },
  noteBold: {
    fontFamily: 'Montserrat_600SemiBold',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  halfWidth: {
    flex: 1,
  },
});

export default AddBreedScreen;
