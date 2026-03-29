import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { COLORS, SPACING, SHADOW } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import GInput from '../components/GInput';
import GButton from '../components/GButton';
import GSelect from '../components/GSelect';
import api from '../api';

const ProfileSettingsScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    employeeType: ''
  });
  
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/profile');
      const data = response.data;
      
      const mappedData = {
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        employeeType: data.employeeProfile?.employeeType || '',
        // These fields would be in a separate Profile model in a real app
        address: '',
        city: '',
        state: '',
        country: 'India'
      };

      setFormData(mappedData);
      setOriginalData(mappedData);
      setLoading(false);
    } catch (error) {
      console.error('Fetch profile error:', error);
      setLoading(false);
    }
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  const handleReset = () => {
    setFormData(originalData);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/users/profile', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      });
      setOriginalData(formData);
      setSaving(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      setSaving(false);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader title="Profile Settings" onBack={() => navigation.goBack()} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <GInput 
              label="Full Name" 
              value={formData.name} 
              onChangeText={(v) => setFormData({...formData, name: v})} 
              required 
            />
            
            <View style={styles.gap} />
            
            <GInput 
              label="Email Address" 
              value={formData.email} 
              onChangeText={(v) => setFormData({...formData, email: v})} 
              keyboardType="email-address"
            />
            
            <View style={styles.gap} />
            
            <GInput 
              label="Phone Number" 
              value={formData.phone} 
              onChangeText={(v) => setFormData({...formData, phone: v})}
              keyboardType="phone-pad"
            />

            <View style={styles.gap} />

            <GInput 
              label="Role" 
              value={formData.employeeType} 
              editable={false}
              containerStyle={{ opacity: 0.7 }}
            />

            <Text style={[styles.sectionTitle, { marginTop: SPACING.xl }]}>Address Details</Text>
            
            <GInput 
              label="Address" 
              value={formData.address} 
              onChangeText={(v) => setFormData({...formData, address: v})} 
            />
            
            <View style={styles.gap} />
            
            <GSelect 
              label="Country" 
              value={formData.country} 
              onSelect={(v) => setFormData({...formData, country: v})}
              options={[
                { label: 'India', value: 'India' },
                { label: 'USA', value: 'USA' },
                { label: 'UK', value: 'UK' }
              ]}
            />
          </View>

          {hasChanges && (
            <View style={styles.buttonRow}>
              <View style={styles.halfBtn}>
                <GButton 
                  title="Reset" 
                  variant="outline" 
                  onPress={handleReset}
                />
              </View>
              <View style={styles.halfBtn}>
                <GButton 
                  title="Save Changes" 
                  onPress={handleSave}
                  loading={saving}
                />
              </View>
            </View>
          )}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  formContainer: {
    marginBottom: SPACING.xl,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat_600SemiBold',
    marginBottom: SPACING.lg,
    letterSpacing: -0.5,
    color: theme.colors.text,
  },
  gap: {
    height: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  halfBtn: {
    width: '48%',
  }
});

export default ProfileSettingsScreen;
