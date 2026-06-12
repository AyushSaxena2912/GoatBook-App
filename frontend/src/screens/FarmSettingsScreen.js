import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator, StyleSheet, Platform, KeyboardAvoidingView, TouchableOpacity, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING, SHADOW } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import GInput from '../components/GInput';
import GButton from '../components/GButton';
import GSelect from '../components/GSelect';
import { ShieldAlert, Store, Camera, ImageIcon, Trash2, Plus, MinusCircle } from 'lucide-react-native';
import api from '../api';
import * as ImagePicker from 'expo-image-picker';
import { uploadToCloudinary as cloudinaryUpload } from '../utils/cloudinary';

const FarmSettingsScreen = ({ navigation }) => {
  const { isDarkMode, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(theme, isDarkMode, insets), [theme, isDarkMode, insets]);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    email: '',
    logoUrl: null
  });
  
  // Dynamic phones
  const [phones, setPhones] = useState(['', '']);

  const [originalData, setOriginalData] = useState(null);
  const [originalPhones, setOriginalPhones] = useState([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [uploading, setUploading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchFarmDetails();
    }, [])
  );

  const fetchFarmDetails = async () => {
    try {
      setFetching(true);
      const [farmRes, profileRes] = await Promise.all([
        api.get('/farms/current'),
        api.get('/users/profile'),
      ]);
      const farm = farmRes.data;
      
      const mappedData = {
        name: farm.name || '',
        location: farm.location || '',
        address: farm.address || '',
        city: farm.city || '',
        state: farm.state || '',
        country: farm.country || 'India',
        email: farm.email || '',
        logoUrl: farm.logoUrl || null
      };

      let initialPhones = farm.phones && farm.phones.length > 0 ? farm.phones : (farm.phone ? [farm.phone] : []);
      // Pad to at least 2 inputs
      while (initialPhones.length < 2) {
        initialPhones.push('');
      }

      setFormData(mappedData);
      setPhones(initialPhones);
      
      setOriginalData(mappedData);
      setOriginalPhones([...initialPhones]);

      const role = profileRes.data?.employeeProfile?.employeeType;
      setIsOwner(role === 'OWNER');
    } catch (error) {
      console.error('Fetch farm error:', error);
      Alert.alert('Error', 'Failed to load farm details');
    } finally {
      setFetching(false);
    }
  };

  const pickImage = async () => {
    if (!isOwner) return;
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setFormData({ ...formData, logoUrl: result.assets[0].uri });
    }
  };

  const takePhoto = async () => {
    if (!isOwner) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions to make this work!');
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setFormData({ ...formData, logoUrl: result.assets[0].uri });
    }
  };

  const handlePhoneChange = (text, index) => {
    const newPhones = [...phones];
    newPhones[index] = text;
    setPhones(newPhones);
  };

  const addPhoneField = () => {
    setPhones([...phones, '']);
  };

  const removePhoneField = (index) => {
    const newPhones = phones.filter((_, i) => i !== index);
    if (newPhones.length < 2) {
      newPhones.push('');
    }
    setPhones(newPhones);
  };

  const handleUpdate = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Farm name cannot be empty');
      return;
    }
    try {
      setLoading(true);
      
      let finalLogoUrl = formData.logoUrl;
      if (formData.logoUrl && !formData.logoUrl.startsWith('http')) {
        setUploading(true);
        finalLogoUrl = await cloudinaryUpload(formData.logoUrl);
        setUploading(false);
      }

      // Filter out empty phones
      const cleanPhones = phones.filter(p => p.trim() !== '');

      await api.put('/farms/current', { 
        ...formData,
        logoUrl: finalLogoUrl,
        phones: cleanPhones,
        phone: cleanPhones.length > 0 ? cleanPhones[0] : '' // legacy field
      });

      // Update state to reflect saved status
      setFormData({ ...formData, logoUrl: finalLogoUrl });
      setOriginalData({ ...formData, logoUrl: finalLogoUrl });
      setOriginalPhones([...phones]);
      
      Alert.alert('Success', 'Farm details updated successfully');
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update farm details';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleReset = () => {
    if (originalData) {
      setFormData(originalData);
      setPhones([...originalPhones]);
    }
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData) || JSON.stringify(phones) !== JSON.stringify(originalPhones);

  if (fetching) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const INDIAN_STATES = [
    { label: 'Andhra Pradesh', value: 'Andhra Pradesh' },
    { label: 'Assam', value: 'Assam' },
    { label: 'Bihar', value: 'Bihar' },
    { label: 'Chhattisgarh', value: 'Chhattisgarh' },
    { label: 'Delhi', value: 'Delhi' },
    { label: 'Goa', value: 'Goa' },
    { label: 'Gujarat', value: 'Gujarat' },
    { label: 'Haryana', value: 'Haryana' },
    { label: 'Jharkhand', value: 'Jharkhand' },
    { label: 'Karnataka', value: 'Karnataka' },
    { label: 'Kerala', value: 'Kerala' },
    { label: 'Madhya Pradesh', value: 'Madhya Pradesh' },
    { label: 'Maharashtra', value: 'Maharashtra' },
    { label: 'Odisha', value: 'Odisha' },
    { label: 'Punjab', value: 'Punjab' },
    { label: 'Rajasthan', value: 'Rajasthan' },
    { label: 'Tamil Nadu', value: 'Tamil Nadu' },
    { label: 'Telangana', value: 'Telangana' },
    { label: 'Uttar Pradesh', value: 'Uttar Pradesh' },
    { label: 'West Bengal', value: 'West Bengal' }
  ];

  return (
    <View style={styles.container}>
      <GHeader title="Farm Settings" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Owner warning */}
          {!isOwner && (
            <View style={[styles.infoBox, {
              backgroundColor: isDarkMode ? '#451A03' : '#FFFBEB',
              borderColor: isDarkMode ? '#F59E0B66' : '#FEF3C7',
            }]}>
              <ShieldAlert size={18} color={isDarkMode ? '#F59E0B' : '#B45309'} />
              <Text style={[styles.infoText, { color: isDarkMode ? '#FCD34D' : '#92400E' }]}>
                Only farm owners can modify these settings.
              </Text>
            </View>
          )}

          {/* Logo Section */}
          <View style={styles.photoSection}>
            <TouchableOpacity style={[styles.avatarCircle, { borderColor: theme.colors.primary }]} onPress={pickImage} disabled={!isOwner}>
              {formData.logoUrl ? (
                <Image source={{ uri: formData.logoUrl }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Store size={44} color={theme.colors.primary} />
                </View>
              )}
            </TouchableOpacity>
            
            {isOwner && (
              <View style={styles.photoActions}>
                <TouchableOpacity style={[styles.photoBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} onPress={takePhoto}>
                  <Camera size={16} color={theme.colors.primary} />
                  <Text style={[styles.photoBtnText, { color: theme.colors.text }]}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.photoBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} onPress={pickImage}>
                  <ImageIcon size={16} color={theme.colors.primary} />
                  <Text style={[styles.photoBtnText, { color: theme.colors.text }]}>Gallery</Text>
                </TouchableOpacity>
                {formData.logoUrl && (
                  <TouchableOpacity style={[styles.photoBtn, { backgroundColor: theme.colors.error + '10', borderColor: theme.colors.error + '30' }]} onPress={() => setFormData({ ...formData, logoUrl: null })}>
                    <Trash2 size={16} color={theme.colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            )}
            <Text style={[styles.photoHint, { color: theme.colors.textMuted }]}>Farm Logo (Used in Invoices)</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Basic Details</Text>
            
            <GInput
              label="Farm Name"
              value={formData.name}
              onChangeText={(v) => setFormData({...formData, name: v})}
              placeholder="e.g. Goatwala Farm"
              required
              editable={isOwner}
            />
            <View style={styles.gap} />

            <GInput
              label="Short Location"
              value={formData.location}
              onChangeText={(v) => setFormData({...formData, location: v})}
              placeholder="e.g. Village, District"
              editable={isOwner}
            />
            <View style={styles.gap} />

            <GInput
              label="Farm Email"
              value={formData.email}
              onChangeText={(v) => setFormData({...formData, email: v})}
              placeholder="farm@email.com"
              keyboardType="email-address"
              editable={isOwner}
            />
            <View style={styles.gap} />

            {/* Dynamic Phones */}
            <Text style={[styles.subTitle, { color: theme.colors.text }]}>Farm Phone Numbers</Text>
            {phones.map((p, index) => (
              <View key={index.toString()} style={styles.phoneRow}>
                <View style={{ flex: 1 }}>
                  <GInput
                    label={`Phone Number ${index + 1}`}
                    value={p}
                    onChangeText={(v) => handlePhoneChange(v, index)}
                    placeholder="9876543210"
                    keyboardType="phone-pad"
                    editable={isOwner}
                  />
                </View>
                {isOwner && phones.length > 2 && (
                  <TouchableOpacity 
                    style={styles.removePhoneBtn}
                    onPress={() => removePhoneField(index)}
                  >
                    <MinusCircle size={22} color={theme.colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {isOwner && (
              <TouchableOpacity style={styles.addPhoneBtn} onPress={addPhoneField}>
                <Plus size={16} color={theme.colors.primary} />
                <Text style={[styles.addPhoneText, { color: theme.colors.primary }]}>Add Another Phone Number</Text>
              </TouchableOpacity>
            )}

            <View style={styles.gap} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: SPACING.xl }]}>Full Address</Text>
            
            <GInput
              label="Address Line"
              value={formData.address}
              onChangeText={(v) => setFormData({...formData, address: v})}
              placeholder="Street / Area / Colony"
              multiline
              numberOfLines={2}
              editable={isOwner}
            />
            <View style={styles.gap} />

            <GInput
              label="City / District"
              value={formData.city}
              onChangeText={(v) => setFormData({...formData, city: v})}
              placeholder="City Name"
              editable={isOwner}
            />
            <View style={styles.gap} />

            <GSelect
              label="State"
              value={formData.state}
              onSelect={(v) => setFormData({...formData, state: v})}
              options={INDIAN_STATES}
              searchable={true}
              searchPlaceholder="Search State..."
            />
            <View style={styles.gap} />

            <GSelect
              label="Country"
              value={formData.country}
              onSelect={(v) => setFormData({...formData, country: v})}
              options={[
                { label: 'India', value: 'India' },
                { label: 'USA', value: 'USA' },
                { label: 'UK', value: 'UK' },
                { label: 'Australia', value: 'Australia' }
              ]}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Save Buttons */}
      {isOwner && hasChanges && (
        <View style={[styles.footerContainer, { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 10 : 20 }]}>
          <View style={styles.buttonRow}>
            <View style={styles.halfBtn}>
              <GButton 
                title="Reset" 
                variant="outline" 
                onPress={handleReset}
                disabled={loading || uploading}
              />
            </View>
            <View style={styles.halfBtn}>
              <GButton 
                title={uploading ? "Uploading..." : "Save Changes"} 
                onPress={handleUpdate}
                loading={loading || uploading}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const getStyles = (theme, isDarkMode, insets) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 120, // Clear the sticky footer
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingTop: 8,
  },
  avatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  photoBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  photoHint: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  formContainer: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: SPACING.lg,
    letterSpacing: -0.5,
  },
  subTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  gap: {
    height: 14,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  removePhoneBtn: {
    marginTop: 34,
    marginLeft: 10,
    padding: 4,
  },
  addPhoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 4,
  },
  addPhoneText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    marginLeft: 6,
  },
  infoBox: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    gap: 10,
  },
  infoText: {
    fontSize: 13,
    flex: 1,
    fontFamily: 'Inter_500Medium',
    lineHeight: 18,
  },
  footerContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...SHADOW.lg, 
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  halfBtn: {
    width: '48%',
  }
});

export default FarmSettingsScreen;
