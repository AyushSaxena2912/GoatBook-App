import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, Linking } from 'react-native';
import { COLORS, SPACING, SHADOW } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import GInput from '../components/GInput';
import GButton from '../components/GButton';
import api, { setAuthToken, setSelectedFarm } from '../api';
import { registerForPushNotificationsAsync } from '../utils/notificationService';

const LoginScreen = ({ navigation }) => {
  const { isDarkMode, theme } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please enter your Phone/Email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { identifier: email, password });
      const { token, farms } = response.data;
      
      await setAuthToken(token);
      
      if (farms && farms.length > 1) {
        navigation.replace('FarmSelection', { farms });
      } else if (farms && farms.length === 1) {
        await setSelectedFarm(farms[0].id);
        
        // Register for push notifications after login/farm selection
        registerForPushNotificationsAsync().catch(err => 
          console.error('Failed to register for push notifications:', err)
        );

        try {
          navigation.replace('MainDrawer');
        } catch (navError) {
          console.error('Navigation Error:', navError);
          alert('Navigation Failed: ' + navError.message);
        }
      } else {
        alert('No farms found for this account.');
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      const message = error.response?.data?.message || 'Login failed';
      alert(message);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        <View style={styles.formWrapper}>
            <View style={styles.logoContainer}>
                <Image source={require('../../assets/login-logo.png')} style={styles.logoImage} />
                <Text style={styles.logoText}>GoatBook</Text>
            </View>
            <View style={styles.titleContainer}>
                <Text style={styles.mainTitle}>Login</Text>
                <Text style={styles.subTitle}>Login to your account and manage your farm.</Text>
            </View>

            <View style={styles.form}>
                <GInput 
                    label="Email or Phone" 
                    value={email} 
                    onChangeText={setEmail} 
                    placeholder="email or phone number"
                    autoCapitalize="none"
                    required 
                />
                <View style={{ height: 20 }} />
                <GInput 
                    label="Password" 
                    value={password} 
                    onChangeText={setPassword} 
                    secureTextEntry 
                    required 
                />
                
                <TouchableOpacity 
                    style={styles.forgotPass}
                    onPress={() => navigation.navigate('ForgotPassword')}
                >
                    <Text style={[styles.forgotText, { color: theme.colors.primary, fontFamily: theme.typography.medium }]}>Forgot password?</Text>
                </TouchableOpacity>

                <GButton 
                    title="Login" 
                    onPress={handleLogin} 
                    loading={loading}
                    containerStyle={styles.loginBtn}
                />

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Don’t have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.link}>Register</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={styles.spegiFooter} 
                  onPress={() => Linking.openURL('https://www.spegitech.com')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.spegiText, { color: theme.colors.textMuted || '#9CA3AF' }]}>
                    Developed by SPEGI Technologies Pvt. Ltd.
                  </Text>
                </TouchableOpacity>
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
  },
  formWrapper: {
    paddingTop: 40,
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 24,
    marginBottom: 0,
  },
  logoText: {
    fontSize: 26,
    fontFamily: theme.typography.bold,
    color: theme.colors.primary,
    marginTop: -16,
  },
  titleContainer: {
    marginBottom: 40,
  },
  mainTitle: {
    fontSize: 32,
    fontFamily: 'Inter_600SemiBold',
    color: theme.colors.primary,
    letterSpacing: -1,
  },
  subTitle: {
    fontSize: 16,
    marginTop: 8,
    fontFamily: 'Inter_500Medium',
    color: theme.colors.textLight,
  },
  form: {
    flex: 1,
  },
  forgotPass: {
    alignSelf: 'flex-end',
    marginTop: 12,
    marginBottom: 30,
  },
  forgotText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
  loginBtn: {
    marginTop: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: theme.colors.textLight,
  },
  link: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  spegiFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
    marginTop: 10,
  },
  spegiText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
});

export default LoginScreen;
