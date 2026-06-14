import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SPACING } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';

const LanguageSelectionScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिंदी (Hindi)' },
    { code: 'mr', label: 'मराठी (Marathi)' },
    { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
    { code: 'bn', label: 'বাংলা (Bengali)' }
  ];

  const handleLanguageSelect = async (langCode) => {
    if (i18n.language === langCode) return;

    setLoading(true);
    try {
      // 1. Instant UI update
      await i18n.changeLanguage(langCode);
      
      // 2. Cache in AsyncStorage
      await AsyncStorage.setItem('user-language', langCode);

      // 3. Update Backend
      await api.patch('/users/language', { language: langCode });
      
      navigation.goBack();
    } catch (error) {
      console.error('Failed to change language:', error);
      Alert.alert('Error', 'Failed to save language preference to server.');
      // Revert if API fails (optional, but good UX)
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader title={t('settings.selectLanguage', 'Select Language')} onBack={() => navigation.goBack()} />
      
      <View style={styles.content}>
        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={{ color: theme.colors.text, marginLeft: 10 }}>Saving...</Text>
          </View>
        )}

        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.languageRow,
              { 
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface 
              },
              i18n.language === lang.code && { borderColor: theme.colors.primary }
            ]}
            onPress={() => handleLanguageSelect(lang.code)}
            disabled={loading}
          >
            <Text style={[styles.languageText, { color: theme.colors.text }]}>
              {lang.label}
            </Text>
            {i18n.language === lang.code && (
              <Check color={theme.colors.primary} size={24} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  languageText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  loader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  }
});

export default LanguageSelectionScreen;
