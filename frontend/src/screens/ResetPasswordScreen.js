import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import GInput from '../components/GInput';
import GButton from '../components/GButton';
import api from '../api';
import { ArrowLeft } from 'lucide-react-native';

const ResetPasswordScreen = ({ navigation, route }) => {
  const { isDarkMode, theme } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const { identifier: initialIdentifier } = route.params || {};
  
  const [identifier, setIdentifier] = useState(initialIdentifier || '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!identifier || !code || !newPassword || !confirmPassword) {
      alert('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', { 
        identifier, 
        code, 
        newPassword 
      });
      alert(response.data.message);
      navigation.navigate('Login');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reset password';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft color={theme.colors.primary} size={30} />
        </TouchableOpacity>

        <View style={styles.formWrapper}>
            <View style={styles.titleContainer}>
                <Text style={styles.mainTitle}>Reset Password</Text>
                <Text style={styles.subTitle}>Enter the code sent to your email/phone and your new password.</Text>
            </View>

            <View style={styles.form}>
                <GInput 
                    label="Email or Phone" 
                    value={identifier} 
                    onChangeText={setIdentifier} 
                    placeholder="email or phone number"
                    autoCapitalize="none"
                    required 
                    editable={!initialIdentifier}
                />
                <View style={styles.gap} />
                <GInput 
                    label="Reset Code" 
                    value={code} 
                    onChangeText={setCode} 
                    placeholder="123456"
                    keyboardType="number-pad"
                    required 
                />
                <View style={styles.gap} />
                <GInput 
                    label="New Password" 
                    value={newPassword} 
                    onChangeText={setNewPassword} 
                    secureTextEntry 
                    required 
                />
                <View style={styles.gap} />
                <GInput 
                    label="Confirm New Password" 
                    value={confirmPassword} 
                    onChangeText={setConfirmPassword} 
                    secureTextEntry 
                    required 
                />
                
                <GButton 
                    title="Reset Password" 
                    onPress={handleResetPassword} 
                    loading={loading}
                    containerStyle={styles.submitBtn}
                />
            </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backButton: {
    paddingTop: 40,
    marginBottom: 20,
    marginLeft: -8,
  },
  formWrapper: {
    flex: 1,
  },
  titleContainer: {
    marginBottom: 60,
  },
  mainTitle: {
    fontSize: 32,
    fontFamily: 'Montserrat_600SemiBold',
    color: theme.colors.primary,
    letterSpacing: -1,
  },
  subTitle: {
    fontSize: 16,
    marginTop: 8,
    fontFamily: 'Montserrat_500Medium',
    color: theme.colors.textLight,
  },
  form: {
    flex: 1,
  },
  gap: {
    height: 16,
  },
  submitBtn: {
    marginTop: 40,
  },
});

export default ResetPasswordScreen;
