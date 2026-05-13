import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, SHADOW } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import GInput from '../components/GInput';
import GButton from '../components/GButton';
import GSelect from '../components/GSelect';
import api from '../api';
import { User, Camera, ImageIcon, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadToCloudinary as cloudinaryUpload } from '../utils/cloudinary';

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
    employeeType: '',
    profilePhotoUrl: null
  });
  
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

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
        profilePhotoUrl: data.profilePhotoUrl || null,
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

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setFormData({ ...formData, profilePhotoUrl: result.assets[0].uri });
    }
  };

  const takePhoto = async () => {
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
      setFormData({ ...formData, profilePhotoUrl: result.assets[0].uri });
    }
  };

  const uploadToCloudinary = async (imageUri) => {
    if (!imageUri || imageUri.startsWith('http')) return imageUri;
    try {
      setUploading(true);
      const uploadedImageUrl = await cloudinaryUpload(imageUri);
      setUploading(false);
      return uploadedImageUrl;
    } catch (error) {
      setUploading(false);
      console.error('Upload error:', error);
      Alert.alert('Upload Error', 'Failed to upload photo.');
      throw error;
    }
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  const handleReset = () => {
    setFormData(originalData);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let uploadedPhotoUrl = formData.profilePhotoUrl;
      if (formData.profilePhotoUrl && !formData.profilePhotoUrl.startsWith('http')) {
        uploadedPhotoUrl = await uploadToCloudinary(formData.profilePhotoUrl);
      }

      await api.put('/users/profile', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        profilePhotoUrl: uploadedPhotoUrl
      });
      setFormData({ ...formData, profilePhotoUrl: uploadedPhotoUrl });
      setOriginalData({ ...formData, profilePhotoUrl: uploadedPhotoUrl });
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
          {/* Profile Photo */}
          <View style={styles.photoSection}>
            <TouchableOpacity style={[styles.avatarCircle, { borderColor: theme.colors.primary }]} onPress={pickImage}>
              {formData.profilePhotoUrl ? (
                <Image source={{ uri: formData.profilePhotoUrl }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary + '15' }]}>
                  <User size={44} color={theme.colors.primary} />
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.photoActions}>
              <TouchableOpacity style={[styles.photoBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} onPress={takePhoto}>
                <Camera size={16} color={theme.colors.primary} />
                <Text style={[styles.photoBtnText, { color: theme.colors.text }]}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.photoBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} onPress={pickImage}>
                <ImageIcon size={16} color={theme.colors.primary} />
                <Text style={[styles.photoBtnText, { color: theme.colors.text }]}>Gallery</Text>
              </TouchableOpacity>
              {formData.profilePhotoUrl && (
                <TouchableOpacity style={[styles.photoBtn, { backgroundColor: theme.colors.error + '10', borderColor: theme.colors.error + '30' }]} onPress={() => setFormData({ ...formData, profilePhotoUrl: null })}>
                  <Trash2 size={16} color={theme.colors.error} />
                </TouchableOpacity>
              )}
            </View>
          </View>

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
              editable={formData.employeeType === 'OWNER'}
              style={formData.employeeType !== 'OWNER' && { color: theme.colors.textMuted }}
            />
            
            <View style={styles.gap} />
            
            <GInput 
              label="Phone Number" 
              value={formData.phone} 
              onChangeText={(v) => setFormData({...formData, phone: v})}
              keyboardType="phone-pad"
              editable={formData.employeeType === 'OWNER'}
              style={formData.employeeType !== 'OWNER' && { color: theme.colors.textMuted }}
            />

            {formData.employeeType !== 'OWNER' && (
              <Text style={{ fontSize: 12, color: theme.colors.textLight, marginTop: 4, fontFamily: 'Inter_500Medium', fontStyle: 'italic' }}>
                * Only the Farm Owner can update your phone number or email.
              </Text>
            )}

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

        </ScrollView>
      </KeyboardAvoidingView>

      {hasChanges && (
        <View style={[styles.footerContainer, { paddingBottom: Platform.OS === 'ios' ? 30 : 20 }]}>
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
                title={uploading ? "Uploading..." : "Save Changes"} 
                onPress={handleSave}
                loading={saving}
                disabled={uploading}
              />
            </View>
          </View>
        </View>
      )}
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
    paddingBottom: 120, // Increased to clear fixed footer
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
  formContainer: {
    marginBottom: SPACING.xl,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: SPACING.lg,
    letterSpacing: -0.5,
    color: theme.colors.text,
  },
  gap: {
    height: 14,
  },
  footerContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...SHADOW.lg, // Added for that boxy shadow look
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

export default ProfileSettingsScreen;
