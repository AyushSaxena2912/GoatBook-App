import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, SHADOW } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import GInput from '../components/GInput';
import GButton from '../components/GButton';
import api from '../api';

const ChangePasswordScreen = ({ navigation }) => {
  const { isDarkMode, theme } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!currentPassword || !newPassword) {
      alert('Please fill in both fields');
      return;
    }

    if (newPassword.length < 6) {
      alert('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await api.post('/users/change-password', {
        currentPassword,
        newPassword
      });
      setLoading(false);
      alert('Password updated successfully!');
      navigation.goBack();
    } catch (error) {
      setLoading(false);
      const message = error.response?.data?.message || 'Failed to update password';
      alert(message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader title="Change Password" onBack={() => navigation.goBack()} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.form}>
            <GInput 
              label="Current Password" 
              value={currentPassword} 
              onChangeText={setCurrentPassword} 
              secureTextEntry 
              required 
            />
            
            <View style={styles.inputGap} />
 
            <GInput 
              label="New Password" 
              value={newPassword} 
              onChangeText={setNewPassword} 
              secureTextEntry 
              required 
            />
          </View>
 
          <View style={styles.footer}>
            <GButton 
              title="SAVE PASSWORD" 
              onPress={handleSave} 
              loading={loading}
              containerStyle={styles.saveBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    flexGrow: 1,
    paddingBottom: 40,
  },
  form: {
    marginTop: SPACING.md,
  },
  inputGap: {
    height: 16,
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  saveBtn: {
    marginTop: 10,
  },
});

export default ChangePasswordScreen;
