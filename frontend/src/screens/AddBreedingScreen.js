import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import GInput from '../components/GInput';
import GButton from '../components/GButton';
import GSelect from '../components/GSelect';
import GDatePicker from '../components/GDatePicker';
import { Tag, CheckCircle } from 'lucide-react-native';
import api from '../api';

const AddBreedingScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const preSelectedAnimal = route.params?.preSelectedAnimal || null;

  // Animal selection
  const [selectedAnimal, setSelectedAnimal] = useState(preSelectedAnimal);
  const [tagInput, setTagInput] = useState('');
  const [fetchingAnimal, setFetchingAnimal] = useState(false);

  const [deliveryDate, setDeliveryDate] = useState('');
  const [birthType, setBirthType] = useState('SINGLE');
  const [numMale, setNumMale] = useState('');
  const [numFemale, setNumFemale] = useState('');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFetchAnimal = async () => {
    if (!tagInput.trim()) {
      Alert.alert('Error', 'Please enter a Tag ID');
      return;
    }
    setFetchingAnimal(true);
    try {
      const res = await api.get(`/animals/check-tag/${tagInput.trim()}`);
      if (res.data?.id) {
        setSelectedAnimal(res.data);
      } else {
        Alert.alert('Not Found', `No animal found with Tag ID "${tagInput}"`);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        Alert.alert('Not Found', `No animal found with Tag ID "${tagInput}"`);
      } else {
        Alert.alert('Error', 'Failed to search animal. Please try again.');
      }
    } finally {
      setFetchingAnimal(false);
    }
  };

  const handleSave = async () => {
    if (!selectedAnimal) {
      Alert.alert('Error', 'Please fetch an animal by Tag ID first.');
      return;
    }
    if (!deliveryDate || !birthType) {
      Alert.alert('Error', 'Delivery Date and Birth Type are required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        animal_id: selectedAnimal.id,
        delivery_date: deliveryDate,
        birth_type: birthType,
        num_male: numMale ? parseInt(numMale, 10) : 0,
        num_female: numFemale ? parseInt(numFemale, 10) : 0,
        remark
      };

      await api.post('/breedings', payload);
      setLoading(false);
      navigation.goBack();
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save breeding record');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader title="Add Breeding/Delivery" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>

          {/* Animal Tag ID Input */}
          {!preSelectedAnimal ? (
            <View style={[styles.tagSection, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>Female Animal Tag ID *</Text>
              <View style={styles.tagInputRow}>
                <View style={{ flex: 1 }}>
                  <GInput
                    placeholder="Enter Tag ID (e.g. G-001)"
                    value={tagInput}
                    onChangeText={text => { setTagInput(text); setSelectedAnimal(null); }}
                    style={{ marginBottom: 0 }}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.fetchBtn, { backgroundColor: theme.colors.primary }]}
                  onPress={handleFetchAnimal}
                  disabled={fetchingAnimal}
                >
                  {fetchingAnimal
                    ? <ActivityIndicator color="#FFF" size="small" />
                    : <Text style={styles.fetchBtnText}>Add</Text>
                  }
                </TouchableOpacity>
              </View>

              {selectedAnimal && (
                <View style={[styles.animalFound, { backgroundColor: theme.colors.primary + '12', borderColor: theme.colors.primary + '40' }]}>
                  <CheckCircle size={16} color={theme.colors.primary} />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={[styles.animalFoundTag, { color: theme.colors.text }]}>
                      Tag: {selectedAnimal.tagNumber || selectedAnimal.tag_number}
                    </Text>
                    <Text style={[styles.animalFoundBreed, { color: theme.colors.textMuted }]}>
                      {selectedAnimal.breedName || selectedAnimal.Breeds?.name || ''} • {selectedAnimal.gender}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.tagSection, { backgroundColor: theme.colors.primary + '12', borderColor: theme.colors.primary + '40' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Tag size={16} color={theme.colors.primary} />
                <View style={{ marginLeft: 8 }}>
                  <Text style={[styles.animalFoundTag, { color: theme.colors.text }]}>
                    Tag: {preSelectedAnimal.tagNumber || preSelectedAnimal.tag_number}
                  </Text>
                  <Text style={[styles.animalFoundBreed, { color: theme.colors.textMuted }]}>
                    {preSelectedAnimal.Breeds?.name || ''} • {preSelectedAnimal.gender}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
            <GDatePicker containerStyle={{ flex: 1 }} label="Delivery Date" value={deliveryDate} onDateChange={setDeliveryDate} required />
            <GSelect
              containerStyle={{ flex: 1 }}
              label="Birth Type"
              value={birthType}
              onSelect={setBirthType}
              options={[
                { label: 'Single', value: 'SINGLE' },
                { label: 'Twin', value: 'TWIN' },
                { label: 'Triplet', value: 'TRIPLET' },
                { label: 'Quadruplet', value: 'QUADRUPLET' },
                { label: 'Others', value: 'OTHERS' }
              ]}
              required
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
            <GInput containerStyle={{ flex: 1 }} label="Number of Male" value={numMale} onChangeText={setNumMale} keyboardType="number-pad" />
            <GInput containerStyle={{ flex: 1 }} label="Number of Female" value={numFemale} onChangeText={setNumFemale} keyboardType="number-pad" />
          </View>

          <View style={{ marginTop: 12 }}>
            <GInput label="Remark" value={remark} onChangeText={setRemark} multiline style={{ minHeight: 80 }} />
          </View>

          <GButton title="Save Delivery Record" onPress={handleSave} loading={loading} style={{ marginTop: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  tagSection: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 4 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', marginBottom: 8, letterSpacing: 0.3 },
  tagInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fetchBtn: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  fetchBtnText: { color: '#FFF', fontFamily: 'Inter_700Bold', fontSize: 14 },
  animalFound: { flexDirection: 'row', alignItems: 'center', marginTop: 10, padding: 10, borderRadius: 8, borderWidth: 1 },
  animalFoundTag: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  animalFoundBreed: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
});

export default AddBreedingScreen;
