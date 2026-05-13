import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, KeyboardAvoidingView, Platform, Alert, TouchableOpacity, Modal } from 'react-native';
import { COLORS, SPACING, SHADOW } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import GInput from '../components/GInput';
import GButton from '../components/GButton';
import GSelect from '../components/GSelect';
import GConfirmModal from '../components/GConfirmModal';
import api from '../api';
import { KeyRound, Mail, UserRound, Camera, ImageIcon, Trash2, X, AlertTriangle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadToCloudinary as cloudinaryUpload } from '../utils/cloudinary';

const AddEmployeeScreen = ({ navigation, route }) => {
  const { isDarkMode, theme } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const isEditing = !!route.params?.employee;
  const existingEmployee = route.params?.employee;

  const [firstName, setFirstName] = useState(isEditing ? (existingEmployee.name || '').split(' ')[0] : '');
  const [lastName, setLastName] = useState(isEditing ? (existingEmployee.name || '').split(' ').slice(1).join(' ') : '');
  const [email, setEmail] = useState(isEditing ? existingEmployee.email : '');
  const [password, setPassword] = useState(''); // Only used for registration or reset
  const [phone, setPhone] = useState(isEditing ? existingEmployee.phone : '');
  const [role, setRole] = useState(isEditing ? existingEmployee.role : 'EMPLOYEE');
  const [state, setState] = useState(isEditing ? existingEmployee.state || 'Working' : 'Working');
  const [profilePhoto, setProfilePhoto] = useState(isEditing ? existingEmployee.profilePhotoUrl : null);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const pickImage = async () => {
    setShowImagePicker(false);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setProfilePhoto(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    setShowImagePicker(false);
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
      setProfilePhoto(result.assets[0].uri);
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
      Alert.alert('Upload Error', 'Failed to upload photo. Please check your connection.');
      throw error;
    }
  };

  const handleSave = async () => {
    if (!firstName || !email || (!isEditing && !password)) {
      Alert.alert('Validation Error', 'Please fill in Name, Email, and Password');
      return;
    }

    const fullName = `${firstName} ${lastName}`.trim();

    setLoading(true);
    try {
      let uploadedPhotoUrl = profilePhoto;
      if (profilePhoto && !profilePhoto.startsWith('http')) {
        uploadedPhotoUrl = await uploadToCloudinary(profilePhoto);
      }

      if (isEditing) {
        await api.put(`/users/employees/${existingEmployee.id}`, { name: fullName, role, email, phone, state, profilePhotoUrl: uploadedPhotoUrl });
        Alert.alert('Success', 'Employee updated successfully');
      } else {
        await api.post('/users/employees', { name: fullName, email, password, role, phone, state });
        // Photo can only be added when editing (after creation)
        Alert.alert('Success', 'Employee created successfully');
      }
      setLoading(false);
      navigation.goBack();
    } catch (error) {
      setLoading(false);
      const msg = error.response?.data?.message || 'Operation failed';
      const detail = error.response?.data?.error ? `\n\nDetail: ${error.response.data.error}` : '';
      Alert.alert('Error', `${msg}${detail}`);
    }
  };

  const handleResetPassword = async () => {
    if (!password) {
      Alert.alert('Validation Error', 'Please enter a new password');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/users/employees/${existingEmployee.id}/reset-password`, { newPassword: password });
      alert('Employee password reset successfully');
      setPassword('');
      setShowPasswordReset(false);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      alert('Failed to reset password');
    }
  };

  const handleStatusToggle = () => {
    setShowConfirmModal(true);
  };

  const performToggle = async () => {
    const isTerminating = state === 'Working';
    const nextState = isTerminating ? 'Terminated' : 'Working';
    
    setShowConfirmModal(false);
    setLoading(true);
    try {
      await api.put(`/users/employees/${existingEmployee.id}/status`, { state: nextState });
      setState(nextState);
      if (Platform.OS === 'web') {
        alert(`Employee ${isTerminating ? 'terminated' : 're-activated'} successfully.`);
      } else {
        Alert.alert('Success', `Employee ${isTerminating ? 'terminated' : 're-activated'} successfully.`);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to update status';
      if (Platform.OS === 'web') alert(errorMsg);
      else Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader 
        title={isEditing ? "Edit employee" : "Add employee"} 
        onBack={() => navigation.goBack()} 
        leftAlign
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Enhanced Profile Photo Section */}
          <View style={styles.photoSection}>
            <TouchableOpacity 
              style={[styles.avatarCircle, { borderColor: theme.colors.primary }]} 
              onPress={() => setShowImagePicker(true)}
              activeOpacity={0.8}
            >
              {profilePhoto ? (
                <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
                  {firstName ? (
                    <Text style={[styles.avatarInitial, { color: 'white' }]}>
                      {firstName[0].toUpperCase()}
                    </Text>
                  ) : (
                    <View style={styles.placeholderLabelContainer}>
                      <Text style={[styles.placeholderLabelText, { color: 'white' }]}>EE</Text>
                    </View>
                  )}
                </View>
              )}
              <View style={[styles.editBadge, { backgroundColor: theme.colors.primary }]}>
                <Camera size={15} color="white" />
              </View>
            </TouchableOpacity>

            {/* Status Badge below photo */}
            {isEditing && existingEmployee?.role !== 'OWNER' && (
              <View style={[
                styles.statusBadge, 
                { backgroundColor: state === 'Terminated' ? theme.colors.error + '15' : theme.colors.success + '15',
                  borderColor: state === 'Terminated' ? theme.colors.error + '30' : theme.colors.success + '30' }
              ]}>
                <View style={[styles.statusDot, { backgroundColor: state === 'Terminated' ? theme.colors.error : theme.colors.success }]} />
                <Text style={[styles.statusText, { color: state === 'Terminated' ? theme.colors.error : theme.colors.success }]}>
                  {state.charAt(0).toUpperCase() + state.slice(1).toLowerCase()}
                </Text>
              </View>
            )}
          </View>
 
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Identity Details</Text>
            
            <GInput 
              label="First Name" 
              value={firstName} 
              onChangeText={setFirstName} 
              placeholder="Deepak"
              required 
            />
            
            <View style={styles.gap} />
            
            <GInput 
              label="Last Name" 
              value={lastName} 
              onChangeText={setLastName} 
              placeholder="Kumar"
            />
            
            <View style={styles.gap} />
            
            <GInput 
              label="Phone Number" 
              value={phone} 
              onChangeText={setPhone} 
              keyboardType="phone-pad"
              required 
            />
            
            <View style={styles.gap} />
            
            <GInput 
              label="Email Address" 
              value={email} 
              onChangeText={setEmail} 
              keyboardType="email-address"
              autoCapitalize="none"
              required 
            />
 
            {!isEditing && (
              <>
                <View style={styles.gap} />
                <GInput 
                  label="Temporary Password" 
                  value={password} 
                  onChangeText={setPassword} 
                  secureTextEntry 
                  placeholder="Set login password"
                  required 
                />
              </>
            )}
          </View>
 
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Work Role</Text>
            {existingEmployee?.role === 'OWNER' ? (
              <View style={[styles.readOnlyRole, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '30' }]}>
                <View style={[styles.roleIconCircle, { backgroundColor: theme.colors.primary + '20' }]}>
                  <KeyRound size={18} color={theme.colors.primary} />
                </View>
                <View style={styles.roleTextContainer}>
                  <Text style={[styles.readOnlyRoleText, { color: theme.colors.text }]}>Owner (Primary Access)</Text>
                  <Text style={[styles.roleSubtext, { color: theme.colors.textLight }]}>This account has full farm management control</Text>
                </View>
              </View>
            ) : (
              <GSelect 
                label="Assigned Role" 
                value={role} 
                onSelect={setRole}
                options={[
                  { label: 'Manager', value: 'MANAGER' },
                  { label: 'Supervisor', value: 'SUPERVISOR' },
                  { label: 'Veterinarian', value: 'VETERINARIAN' },
                  { label: 'Farm Worker', value: 'EMPLOYEE' },
                  { label: 'Butcher', value: 'BUTCHER' },
                  { label: 'Agent', value: 'AGENT' }
                ]}
                required
              />
            )}
          </View>
 
          {isEditing && (
            <View style={[styles.resetSection, { backgroundColor: theme.colors.surface }]}>
              {!showPasswordReset ? (
                <TouchableOpacity 
                  style={styles.resetTrigger} 
                  onPress={() => setShowPasswordReset(true)}
                >
                  <KeyRound size={20} color={theme.colors.primary} />
                  <Text style={[styles.resetTriggerText, { color: theme.colors.primary }]}>
                    {existingEmployee?.role === 'OWNER' ? "Reset Account Password" : "Reset Employee Password"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.resetBox}>
                  <GInput 
                    label="New Password" 
                    value={password} 
                    onChangeText={setPassword} 
                    secureTextEntry 
                    placeholder="Enter new password"
                  />
                  <View style={styles.resetActions}>
                    <TouchableOpacity onPress={() => setShowPasswordReset(false)}>
                      <Text style={[styles.cancelText, { color: theme.colors.textLight }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleResetPassword}>
                      <Text style={[styles.confirmText, { color: theme.colors.error }]}>Reset Now</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
          
          {/* Bottom padding for better scroll feel */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modern Fixed Footer */}
      <View style={[styles.footerContainer, { paddingBottom: Platform.OS === 'ios' ? 34 : 24 }]}>
        <GButton 
          title={uploading ? "Uploading photo..." : (isEditing ? "Save changes" : "Create employee")} 
          onPress={handleSave}
          loading={loading && !showPasswordReset}
          disabled={uploading}
        />
        
        {isEditing && existingEmployee?.role !== 'OWNER' && (
          <TouchableOpacity 
            style={styles.terminateBtn} 
            onPress={handleStatusToggle}
            activeOpacity={0.6}
          >
            <Text style={[styles.terminateBtnText, { color: state === 'Working' ? theme.colors.error : theme.colors.primary }]}>
              {state === 'Working' ? "Terminate Employee Access" : "Re-activate Employee Access"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Premium Image Picker Modal */}
      <Modal
        visible={showImagePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImagePicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowImagePicker(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Upload Photo</Text>
              <TouchableOpacity onPress={() => setShowImagePicker(false)}>
                <X size={24} color={theme.colors.textLight} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalOptions}>
              <TouchableOpacity style={styles.modalOption} onPress={takePhoto}>
                <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Camera size={24} color={theme.colors.primary} />
                </View>
                <Text style={[styles.optionText, { color: theme.colors.text }]}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalOption} onPress={pickImage}>
                <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '15' }]}>
                  <ImageIcon size={24} color={theme.colors.primary} />
                </View>
                <Text style={[styles.optionText, { color: theme.colors.text }]}>Choose From Gallery</Text>
              </TouchableOpacity>

              {profilePhoto && (
                <TouchableOpacity style={styles.modalOption} onPress={() => { setProfilePhoto(null); setShowImagePicker(false); }}>
                  <View style={[styles.iconCircle, { backgroundColor: theme.colors.error + '15' }]}>
                    <Trash2 size={24} color={theme.colors.error} />
                  </View>
                  <Text style={[styles.optionText, { color: theme.colors.error }]}>Remove Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <GConfirmModal
        visible={showConfirmModal}
        title={state === 'Working' ? "Terminate Employee?" : "Re-activate Employee?"}
        message={state === 'Working' 
          ? 'Are you sure you want to terminate this employee? They will lose all access immediately and cannot log in, but all historical records and changes they made will be safely preserved in the farm logs.'
          : 'This will restore the employee\'s access to the farm. They will be able to log in with their existing credentials.'
        }
        confirmText={state === 'Working' ? "Yes, Terminate" : "Yes, Re-activate"}
        onConfirm={performToggle}
        onCancel={() => setShowConfirmModal(false)}
        variant={state === 'Working' ? "destructive" : "primary"}
        loading={loading}
      />
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
  photoSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingTop: 12,
  },
  avatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    overflow: 'visible', // Allow badge to show outside
    marginBottom: 16,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 55,
  },
  avatarInitial: {
    fontSize: 44,
    fontFamily: 'Inter_600SemiBold',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.md,
    elevation: 4, // For Android pop-out
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: SPACING.md,
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + '50',
    paddingBottom: 8,
  },
  gap: {
    height: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  resetSection: {
    marginTop: SPACING.sm,
    padding: SPACING.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  resetTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resetTriggerText: {
    marginLeft: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  resetBox: {
    marginTop: SPACING.sm,
  },
  resetActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.md,
    gap: 20,
  },
  cancelText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  confirmText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  footerContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border + '30',
    ...SHADOW.lg,
  },
  terminateBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  terminateBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  modalOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalOption: {
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  placeholderLabelContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderLabelText: {
    fontSize: 34,
    fontFamily: 'Inter_800ExtraBold',
    letterSpacing: -1,
  },
  readOnlyRole: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  roleIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  roleTextContainer: {
    flex: 1,
  },
  readOnlyRoleText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  roleSubtext: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
  }
});

export default AddEmployeeScreen;
