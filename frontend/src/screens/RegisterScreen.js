import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, SHADOW } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import GInput from '../components/GInput';
import GButton from '../components/GButton';
import api, { setAuthToken, setSelectedFarm } from '../api';

import { ArrowLeft } from 'lucide-react-native';

const RegisterScreen = ({ navigation }) => {
  const { isDarkMode, theme } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  // Form state to store user and farm details
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    farmName: '',
    farmLocation: ''
  });
  const [loading, setLoading] = useState(false);

  // Function to handle user registration
  const handleRegister = async () => {
    // 1. Basic validation: ensure all mandatory fields have values
    if (!formData.firstName || !formData.email || !formData.password || !formData.farmName) {
      alert('Please fill in required fields');
      return;
    }

    // 2. Security Check: ensure password and confirmation match
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // 3. Prepare payload for the backend API
      const payload = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        farmName: formData.farmName,
        farmLocation: formData.farmLocation
      };

      // 4. Send POST request to registration endpoint
      const response = await api.post('/auth/register', payload);
      
      // 5. Success locally: store the session token and the default farm ID
      await setAuthToken(response.data.token);
      await setSelectedFarm(response.data.farm.id);
      
      setLoading(false);
      // 6. Navigate to the main application area (MainDrawer)
      navigation.replace('MainDrawer');
    } catch (error) {
      setLoading(false);
      console.error('REGISTER ERROR:', error);
      
      // 7. Error handling: show backend message or fallback
      let message = 'Registration failed';
      if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      alert(message);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

        <View style={styles.titleContainer}>
            <Text style={styles.mainTitle}>Register</Text>
            <Text style={styles.subTitle}>Start your journey to smarter goat farming.</Text>
        </View>

        <View style={styles.form}>
            <Text style={styles.sectionTitle}>Personal Details</Text>
            <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                    <GInput 
                        label="First Name" 
                        value={formData.firstName} 
                        onChangeText={(v) => updateField('firstName', v)} 
                        required 
                    />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                    <GInput 
                        label="Last Name" 
                        value={formData.lastName} 
                        onChangeText={(v) => updateField('lastName', v)} 
                    />
                </View>
            </View>
            <View style={styles.gap} />
            <GInput 
                label="Email" 
                value={formData.email} 
                onChangeText={(v) => updateField('email', v)} 
                placeholder="example@mail.com"
                keyboardType="email-address"
                autoCapitalize="none"
                required 
            />
            <View style={styles.gap} />
            <GInput 
                label="Phone Number" 
                value={formData.phone} 
                onChangeText={(v) => updateField('phone', v)} 
                placeholder="9876543210"
                keyboardType="phone-pad"
            />
            <View style={styles.gap} />
            <GInput 
                label="Password" 
                value={formData.password} 
                onChangeText={(v) => updateField('password', v)} 
                secureTextEntry 
                required 
            />
            <View style={styles.gap} />
            <GInput 
                label="Re-Type Password" 
                value={formData.confirmPassword} 
                onChangeText={(v) => updateField('confirmPassword', v)} 
                secureTextEntry 
                required 
            />

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Farm Details</Text>
            <GInput 
                label="Farm Name" 
                value={formData.farmName} 
                onChangeText={(v) => updateField('farmName', v)} 
                required 
            />
            <View style={styles.gap} />
            <GInput 
                label="Farm Location" 
                value={formData.farmLocation} 
                onChangeText={(v) => updateField('farmLocation', v)} 
            />

            <GButton 
                title="Register" 
                onPress={handleRegister} 
                loading={loading}
                containerStyle={styles.nextBtn}
            />

            <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.link}>Login</Text>
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
    paddingBottom: 40,
  },
  backButton: {
    paddingTop: 40,
    marginBottom: 20,
    marginLeft: -8,
  },
  titleContainer: {
    marginBottom: 40,
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
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: theme.colors.primary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottomWidth: 1.5,
    borderBottomColor: theme.colors.border,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gap: {
    height: 16,
  },
  nextBtn: {
    marginTop: 40,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
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

export default RegisterScreen;
