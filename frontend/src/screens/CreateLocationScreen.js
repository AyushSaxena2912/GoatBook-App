import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert, SafeAreaView } from 'react-native';
import { SPACING, SHADOW } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import GInput from '../components/GInput';
import GButton from '../components/GButton';
import GSelect from '../components/GSelect';
import { Home, HelpCircle, MapPin } from 'lucide-react-native';
import api from '../api';

const CreateLocationScreen = ({ navigation, route }) => {
  const { isDarkMode, theme } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  
  const locationToEdit = route?.params?.location;

  const [name, setName] = useState(locationToEdit?.name || locationToEdit?.displayName || '');
  const [parentLocationId, setParentLocationId] = useState(locationToEdit?.parentLocationId || locationToEdit?.parent_location_id || null);
  
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await api.get('/locations');
      const formattedLocs = response.data
        .filter(loc => !locationToEdit || loc.id !== locationToEdit.id)
        .map(loc => ({
          label: loc.displayName || loc.name,
          value: loc.id
        }));
      setLocations([{ label: 'None (Top Level)', value: null }, ...formattedLocs]);
    } catch (err) {
      console.error('Error fetching existing locations:', err);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Shed Name is required');
      return;
    }

    setLoading(true);
    try {
      if (locationToEdit) {
        await api.put(`/locations/${locationToEdit.id}`, {
          name,
          code: locationToEdit.code,
          type: locationToEdit.type,
          parentLocationId
        });
        Alert.alert('Success', 'Shed updated successfully!');
      } else {
        const generatedCode = name.replace(/\s+/g, '-').substring(0, 6).toUpperCase() + '-' + Math.floor(Math.random() * 1000);
        
        await api.post('/locations', {
          name,
          code: generatedCode,
          type: 'Location',
          parentLocationId
        });
        Alert.alert('Success', 'New Shed created successfully!');
      }
      
      setLoading(false);
      navigation.goBack();
    } catch (error) {
      setLoading(false);
      const msg = error.response?.data?.message || 'Failed to save shed';
      Alert.alert('Error', msg);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader 
        title={locationToEdit ? "Edit Shed" : "Create New Shed"} 
        onBack={() => navigation.goBack()} 
        leftAlign={true}
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.flex}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
             <View style={[styles.iconWrapper, { backgroundColor: theme.colors.primary + '10' }]}>
                <Home size={28} color={theme.colors.primary} />
             </View>
             <Text style={[styles.infoText, { color: theme.colors.textLight }]}>
               Define the physical sheds, pens, or pastures on your farm to organize your livestock efficiently.
             </Text>
          </View>
          
          <View style={styles.formArea}>
            <GInput 
              label="Shed Name*" 
              value={name} 
              onChangeText={setName} 
              placeholder="e.g. Maternity Ward B"
              required 
              rightIcon={<MapPin size={18} color={theme.colors.textMuted} />}
            />
            
            <View style={styles.spacer} />
            
            <GSelect 
              label="Parent Location (Optional)" 
              placeholder="Select parent shed"
              value={parentLocationId} 
              onSelect={setParentLocationId}
              options={locations}
              rightIcon={<HelpCircle size={18} color={theme.colors.textMuted} />}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: Platform.OS === 'ios' ? 34 : 24 }]}>
        <GButton 
          title={locationToEdit ? "Update Shed" : "Create Shed"} 
          onPress={handleSave}
          loading={loading}
          containerStyle={styles.submitBtn}
        />
      </View>
    </View>
  );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 120,
  },
  infoCard: {
    padding: 20,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
    ...SHADOW.small,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    lineHeight: 20,
    opacity: 0.8,
  },
  formArea: {
    gap: 4,
  },
  spacer: { height: 20 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingTop: 16,
    backgroundColor: theme.colors.background,
    ...SHADOW.large,
  },
  submitBtn: {
    height: 54,
    borderRadius: 14,
  }
});

export default CreateLocationScreen;
