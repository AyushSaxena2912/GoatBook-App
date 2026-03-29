import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { COLORS, SPACING } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import GInput from '../components/GInput';
import GButton from '../components/GButton';
import GSelect from '../components/GSelect';
import api from '../api';

const AddLocationScreen = ({ navigation, route }) => {
  const { isDarkMode, theme } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const isEditing = !!route.params?.location;
  const existingLocation = route.params?.location;

  const [code, setCode] = useState(isEditing ? existingLocation.code : '');
  const [name, setName] = useState(isEditing ? existingLocation.name : '');
  const [type, setType] = useState(isEditing ? existingLocation.type : 'Internal Location');
  const [parentLocationId, setParentLocationId] = useState(isEditing ? existingLocation.parentLocationId : null);
  
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await api.get('/locations');
      // Filter out current location if editing to prevent circular parent
      const filtered = isEditing 
        ? response.data.filter(loc => loc.id !== existingLocation.id)
        : response.data;
        
      setLocations([
        { label: 'None (Root Location)', value: null },
        ...filtered.map(loc => ({ label: loc.displayName || loc.name, value: loc.id }))
      ]);
    } catch (error) {
      console.error('Fetch locations error:', error);
    }
  };

  const handleSave = async () => {
    if (!code || !name || !type) {
      alert('Please fill in Code, Name and Type');
      return;
    }

    setLoading(true);
    try {
      const payload = { code, name, type, parentLocationId };
      if (isEditing) {
        await api.put(`/locations/${existingLocation.id}`, payload);
      } else {
        await api.post('/locations', payload);
      }
      setLoading(false);
      navigation.goBack();
    } catch (error) {
      setLoading(false);
      const message = error.response?.data?.message || 'Failed to save location';
      alert(message);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Location',
      'Are you sure? Metadata and history for this location will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            setDeleting(true);
            try {
              await api.delete(`/locations/${existingLocation.id}`);
              setDeleting(false);
              navigation.goBack();
            } catch (error) {
              setDeleting(false);
              const msg = error.response?.data?.message || 'Failed to delete';
              alert(msg);
            }
          } 
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader 
        title={isEditing ? "Edit Location" : "Add Location"} 
        onBack={() => navigation.goBack()} 
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formContainer}>
            <GInput 
              label="Location Code" 
              value={code} 
              onChangeText={setCode} 
              placeholder="e.g. WH-A1"
              required 
            />
            
            <View style={styles.gap} />
            
            <GInput 
              label="Location Name" 
              value={name} 
              onChangeText={setName} 
              placeholder="e.g. Warehouse Alpha"
              required 
            />
            
            <View style={styles.gap} />
            
            <GSelect 
              label="Location Type" 
              value={type} 
              onSelect={setType}
              options={[
                { label: 'Internal Location (Stable/Pen)', value: 'Internal Location' },
                { label: 'Customer Location (Sold)', value: 'Customer Location' },
                { label: 'Vendor Location (Sourced)', value: 'Vendor Location' },
                { label: 'Virtual Location (Adjustment)', value: 'Virtual Location' },
                { label: 'Loss Location (Death/Theft)', value: 'Loss Location' }
              ]}
              required
            />

            <View style={styles.gap} />

            <GSelect 
              label="Parent Location" 
              value={parentLocationId} 
              onSelect={setParentLocationId}
              options={locations}
              placeholder="Root Level"
            />
          </View>

          <View style={styles.footer}>
            {isEditing ? (
              <View style={styles.buttonRow}>
                <View style={styles.halfBtn}>
                  <GButton 
                    title="Delete" 
                    variant="outline" 
                    onPress={handleDelete}
                    loading={deleting}
                  />
                </View>
                <View style={styles.halfBtn}>
                  <GButton 
                    title="Save Changes" 
                    onPress={handleSave}
                    loading={loading}
                  />
                </View>
              </View>
            ) : (
              <GButton 
                title="Create Location" 
                onPress={handleSave}
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
  formContainer: {
    marginTop: SPACING.md,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  gap: {
    height: 16,
  },
  footer: {
    marginTop: 'auto',
    paddingVertical: SPACING.xl,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfBtn: {
    width: '48%',
  },
});

export default AddLocationScreen;
