import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, Platform, Alert, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, SHADOW } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import GInput from '../components/GInput';
import GButton from '../components/GButton';
import GDatePicker from '../components/GDatePicker';
import { Scan, Info } from 'lucide-react-native';
import api from '../api';
import { useFocusEffect } from '@react-navigation/native';
import GAlert from '../components/GAlert';

const AddWeightScreen = ({ route, navigation }) => {
  const { isDarkMode, theme } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const initialTag = route.params?.tagNumber || '';
  const [tagNumber, setTagNumber] = useState(initialTag);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [remark, setRemark] = useState('');
  const [animalInfo, setAnimalInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingAnimal, setFetchingAnimal] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  useEffect(() => {
    if (initialTag) {
      fetchAnimalDetails(initialTag);
    }
  }, [initialTag]);

  const fetchAnimalDetails = async (tag) => {
    if (!tag) return;
    try {
      setFetchingAnimal(true);
      const response = await api.get(`/animals?tagNumber=${tag}`);
      if (response.data && response.data.length > 0) {
        setAnimalInfo(response.data[0]);
      } else {
        setAnimalInfo(null);
      }
    } catch (error) {
      console.error('Fetch animal details error:', error);
      setAnimalInfo(null);
    } finally {
      setFetchingAnimal(false);
    }
  };

  const handleTagChange = (text) => {
    setTagNumber(text);
    if (text.length >= 3) {
      fetchAnimalDetails(text);
    } else {
      setAnimalInfo(null);
    }
  };

  const handleSubmit = async () => {
    if (!tagNumber || !weight) {
      Alert.alert('Required', 'Please enter both Tag ID and Weight');
      return;
    }

    try {
      setLoading(true);
      
      // Explicit validation check to ensure tag exists
      const checkRes = await api.get(`/animals?tagNumber=${tagNumber}`);
      if (!checkRes.data || checkRes.data.length === 0) {
        Alert.alert('Invalid Tag ID', 'The scanned Tag ID does not exist in our system. Please check and try again.');
        setLoading(false);
        return;
      }

      await api.post('/weights', {
        tagNumber,
        weight: parseFloat(weight),
        height: height ? parseFloat(height) : null,
        date,
        remark
      });
      setSuccessVisible(true);
    } catch (error) {
      console.error('Add weight error:', error);
      const msg = error.response?.data?.message || 'Failed to add weight record';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader 
        title="Add Weight" 
        onBack={() => navigation.goBack()} 
        leftAlign={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <GInput 
                label="Tag ID" 
                value={tagNumber} 
                onChangeText={handleTagChange} 
                placeholder="2912"
                required
              />
            </View>
          </View>

          {fetchingAnimal && (
            <View style={styles.infoBox}>
              <Text style={[styles.infoText, { color: theme.colors.textMuted }]}>Fetching animal details...</Text>
            </View>
          )}

          {animalInfo && (
            <View style={styles.animalDetailCard}>
               <View style={styles.detailRow}>
                <Info size={16} color={theme.colors.primary} />
                <Text style={[styles.detailLabel, { color: theme.colors.textLight }]}>Breed: </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>{animalInfo.breed?.name || animalInfo.Breed?.name}</Text>
              </View>
              <View style={styles.detailRow}>
                <Info size={16} color={theme.colors.primary} />
                <Text style={[styles.detailLabel, { color: theme.colors.textLight }]}>Gender: </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>{animalInfo.gender}</Text>
              </View>
            </View>
          )}

          <View style={styles.row}>
            <GDatePicker 
              label="Date" 
              value={date} 
              onDateChange={setDate}
              placeholder="09-09-2025"
              required
            />
          </View>

          <View style={styles.row}>
            <GInput 
              label="Weight" 
              value={weight} 
              onChangeText={setWeight} 
              keyboardType="decimal-pad"
              placeholder="55"
              required
            />
          </View>

          <View style={styles.row}>
            <GInput 
              label="Height" 
              value={height} 
              onChangeText={setHeight} 
              keyboardType="decimal-pad"
              placeholder="5"
            />
          </View>

          <View style={styles.row}>
            <GInput 
              label="Remark" 
              value={remark} 
              onChangeText={setRemark} 
              placeholder="New!"
              multiline
              numberOfLines={3}
              style={{ color: theme.colors.text }}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <GButton 
          title="Submit Record" 
          onPress={handleSubmit} 
          loading={loading}
        />
      </View>

      <GAlert 
        visible={successVisible}
        title="Success!"
        message={`Weight record for Tag ${tagNumber} has been saved successfully.`}
        type="success"
        confirmText="Excellent"
        onClose={() => {
          setSuccessVisible(false);
          navigation.goBack();
        }}
      />
    </View>
  );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 20,
  },
  formCard: {
    paddingBottom: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  flex: {
    flex: 1,
  },
  infoBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#1A1A1A' : '#F8FAFC',
  },
  infoText: {
    fontSize: 14,
    fontFamily: theme.typography.regular,
  },
  animalDetailCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: theme.typography.medium,
    marginLeft: 10,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: theme.typography.semiBold,
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    paddingBottom: Platform.OS === 'ios' ? 30 : SPACING.lg,
  },
});
export default AddWeightScreen;
