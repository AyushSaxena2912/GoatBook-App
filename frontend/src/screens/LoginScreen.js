import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { COLORS, SPACING, SHADOW } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import GInput from '../components/GInput';
import GButton from '../components/GButton';
import api, { setAuthToken, setSelectedFarm } from '../api';

const LoginScreen = ({ navigation }) => {
  const { isDarkMode, theme } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please enter your email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { identifier: email, password });
      const { token, farms } = response.data;
      
      await setAuthToken(token);
      
      if (farms && farms.length > 1) {
        setLoading(false);
        navigation.replace('FarmSelection', { farms });
      } else if (farms && farms.length === 1) {
        await setSelectedFarm(farms[0].id);
        setLoading(false);
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
            <View style={styles.titleContainer}>
                <Text style={styles.mainTitle}>Login</Text>
                <Text style={styles.subTitle}>Login to Goatwala Farm APP!</Text>
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
    paddingTop: 80,
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
  forgotPass: {
    alignSelf: 'flex-end',
    marginTop: 12,
    marginBottom: 30,
  },
  forgotText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontFamily: 'Montserrat_600SemiBold',
  },
  loginBtn: {
    marginTop: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 15,
    fontFamily: 'Montserrat_500Medium',
    color: theme.colors.textLight,
  },
  link: {
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  }
});

export default LoginScreen;
