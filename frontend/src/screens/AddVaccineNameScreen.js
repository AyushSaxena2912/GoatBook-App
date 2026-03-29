import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, SHADOW } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import GInput from '../components/GInput';
import GButton from '../components/GButton';
import api from '../api';
import { useFocusEffect } from '@react-navigation/native';
import { ListPlus } from 'lucide-react-native';

const AddVaccineNameScreen = ({ navigation }) => {
  const { isDarkMode, theme } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const [name, setName] = useState('');
  const [daysBetween, setDaysBetween] = useState('');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [vaccines, setVaccines] = useState([]);
  const [vaccinesLoading, setVaccinesLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchVaccines();
    }, [])
  );

  const fetchVaccines = async () => {
    try {
      setVaccinesLoading(true);
      const response = await api.get('/vaccines');
      setVaccines(response.data);
      setVaccinesLoading(false);
    } catch (error) {
      console.error('Fetch vaccines error:', error);
      setVaccinesLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Vaccine name is required');
      return;
    }

    setLoading(true);
    try {
      await api.post('/vaccines', {
        name,
        daysBetween: daysBetween ? parseInt(daysBetween) : 0,
        remark
      });
      setLoading(false);
      Alert.alert('Success', 'Vaccine name added successfully');
      setName('');
      setDaysBetween('');
      setRemark('');
      fetchVaccines(); // Refresh the list
    } catch (error) {
      setLoading(false);
      const msg = error.response?.data?.message || 'Failed to save vaccine';
      Alert.alert('Error', msg);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader title="Add Vaccine" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.formCard}>
            <GInput 
              label="Vaccine Name*" 
              value={name} 
              onChangeText={setName} 
              placeholder="Enter name"
              required 
            />
            
            <View style={styles.daysRow}>
              <Text style={[styles.daysLabel, { color: theme.colors.text }]}>Given Every*</Text>
              <GInput 
                containerStyle={styles.daysInputBox}
                value={daysBetween} 
                onChangeText={setDaysBetween} 
                placeholder="0"
                keyboardType="number-pad"
              />
              <Text style={[styles.daysSuffix, { color: theme.colors.text }]}>Days</Text>
            </View>

            <Text style={[styles.helperText, { color: theme.colors.primary }]}>
              Given number of days help to find next due date for vaccination. Enter correct days for vaccine to get alert on due date. Enter zero for one time vaccination.
            </Text>

            <GInput 
              label="Remark" 
              value={remark} 
              onChangeText={setRemark} 
              placeholder="Optional"
              multiline
              style={{ minHeight: 80, paddingTop: 12, color: theme.colors.text }}
            />
          </View>

          <View style={styles.footer}>
            <GButton 
              title="SAVE VACCINE" 
              onPress={handleSave} 
              loading={loading}
            />
          </View>

          {/* List View for Vaccine Names */}
          <View style={[styles.listSection, { borderTopColor: theme.colors.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Existing Vaccines</Text>
            {vaccinesLoading ? (
              <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 20 }} />
            ) : vaccines.length > 0 ? (
              vaccines.map((v) => (
                <View key={v.id} style={styles.vaccineItem}>
                  <View style={styles.vaccineIcon}>
                    <ListPlus size={20} color={theme.colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.vaccineLabel, { color: theme.colors.text }]}>{v.name}</Text>
                    <Text style={[styles.vaccineDays, { color: theme.colors.textLight }]}>Every {v.daysBetween} days</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={[styles.emptyText, { color: theme.colors.textLight }]}>No vaccines defined yet</Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  formCard: {
    paddingBottom: SPACING.lg,
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  daysLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    marginRight: 10,
  },
  daysInputBox: {
    width: 90,
    marginBottom: 0,
  },
  daysSuffix: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    marginLeft: 10,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: SPACING.lg,
    fontFamily: 'Montserrat_600SemiBold',
  },
  footer: {
    marginTop: SPACING.md,
    marginBottom: 30,
  },
  listSection: {
    marginTop: 20,
    paddingTop: 24,
    borderTopWidth: 1.5,
    borderTopColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat_600SemiBold',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  vaccineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  vaccineIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    backgroundColor: isDarkMode ? '#1A1A1A' : '#EEF2FF',
  },
  vaccineLabel: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
  },
  vaccineDays: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: 'Montserrat_500Medium',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 24,
    fontStyle: 'italic',
    fontFamily: 'Montserrat_500Medium',
  },
});

export default AddVaccineNameScreen;
