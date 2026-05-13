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

const AddMatingScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const preSelectedAnimal = route.params?.preSelectedAnimal || null;

  // Animal selection
  const [selectedAnimal, setSelectedAnimal] = useState(preSelectedAnimal);
  const [tagInput, setTagInput] = useState('');
  const [fetchingAnimal, setFetchingAnimal] = useState(false);

  const [matingDate, setMatingDate] = useState('');
  const [matingType, setMatingType] = useState('NATURAL');
  const [remark, setRemark] = useState('');

  // Natural
  const [maleTagId, setMaleTagId] = useState('');
  const [maleBreed, setMaleBreed] = useState('');

  // AI
  const [semenId, setSemenId] = useState('');
  const [dose, setDose] = useState('');

  // AI & ET
  const [technician, setTechnician] = useState('');
  const [time, setTime] = useState('');

  // ET
  const [embryoId, setEmbryoId] = useState('');

  // Status
  const [status, setStatus] = useState('NOT_SUCCESSFUL');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [miscarriageDate, setMiscarriageDate] = useState('');
  const [miscarriageReason, setMiscarriageReason] = useState('');

  const [loading, setLoading] = useState(false);

  const handleFetchAnimal = async () => {
    if (!tagInput.trim()) {
      Alert.alert('Error', 'Please enter a Tag ID');
      return;
    }
    setFetchingAnimal(true);
    try {
      const res = await api.get(`/animals/check-tag/${tagInput.trim()}`);
      // Endpoint returns flat animal object directly on success
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
    if (!matingDate || !matingType) {
      Alert.alert('Error', 'Mating Date and Type are required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        animal_id: selectedAnimal.id,
        mating_date: matingDate,
        mating_type: matingType,
        remark,
        male_tag_id: maleTagId || null,
        male_breed: maleBreed || null,
        semen_id: semenId || null,
        dose: dose || null,
        technician: technician || null,
        time: time || null,
        embryo_id: embryoId || null,
        status,
        expected_delivery_date: status === 'PREGNANT' && expectedDeliveryDate ? expectedDeliveryDate : null,
        miscarriage_date: status === 'MISCARRIAGE' && miscarriageDate ? miscarriageDate : null,
        miscarriage_reason: status === 'MISCARRIAGE' ? miscarriageReason : null
      };

      await api.post('/matings', payload);
      setLoading(false);
      navigation.goBack();
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save mating record');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader title="Add Mating Record" onBack={() => navigation.goBack()} />
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
            <GDatePicker containerStyle={{ flex: 1 }} label="Mating Date" value={matingDate} onDateChange={setMatingDate} required />
            <GSelect
              containerStyle={{ flex: 1 }}
              label="Mating Type"
              value={matingType}
              onSelect={setMatingType}
              options={[
                { label: 'Natural', value: 'NATURAL' },
                { label: 'AI', value: 'AI' },
                { label: 'ET', value: 'ET' }
              ]}
              required
            />
          </View>

          {matingType === 'NATURAL' && (
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
              <GInput containerStyle={{ flex: 1 }} label="Male Tag ID" value={maleTagId} onChangeText={setMaleTagId} />
              <GInput containerStyle={{ flex: 1 }} label="Male Breed" value={maleBreed} onChangeText={setMaleBreed} />
            </View>
          )}

          {matingType === 'AI' && (
            <>
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
                <GInput containerStyle={{ flex: 1 }} label="Semen ID" value={semenId} onChangeText={setSemenId} />
                <GInput containerStyle={{ flex: 1 }} label="Dose" value={dose} onChangeText={setDose} />
              </View>
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
                <GInput containerStyle={{ flex: 1 }} label="Technician" value={technician} onChangeText={setTechnician} />
                <GInput containerStyle={{ flex: 1 }} label="Time (AM/PM)" value={time} onChangeText={setTime} />
              </View>
            </>
          )}

          {matingType === 'ET' && (
            <>
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
                <GInput containerStyle={{ flex: 1 }} label="Embryo ID" value={embryoId} onChangeText={setEmbryoId} />
                <GInput containerStyle={{ flex: 1 }} label="Technician" value={technician} onChangeText={setTechnician} />
              </View>
              <View style={{ marginTop: 12 }}>
                <GInput label="Time (AM/PM)" value={time} onChangeText={setTime} />
              </View>
            </>
          )}

          <View style={{ marginTop: 16 }}>
            <GSelect
              label="Mating Status"
              value={status}
              onSelect={setStatus}
              options={[
                { label: 'Not Successful', value: 'NOT_SUCCESSFUL' },
                { label: 'Pregnant', value: 'PREGNANT' },
                { label: 'Miscarriage', value: 'MISCARRIAGE' }
              ]}
            />
          </View>

          {status === 'PREGNANT' && (
            <View style={{ marginTop: 12 }}>
              <GDatePicker label="Expected Delivery Due Date" value={expectedDeliveryDate} onDateChange={setExpectedDeliveryDate} />
            </View>
          )}

          {status === 'MISCARRIAGE' && (
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
              <GDatePicker containerStyle={{ flex: 1 }} label="Miscarriage Date" value={miscarriageDate} onDateChange={setMiscarriageDate} />
              <GInput containerStyle={{ flex: 1 }} label="Reason" value={miscarriageReason} onChangeText={setMiscarriageReason} />
            </View>
          )}

          <View style={{ marginTop: 12 }}>
            <GInput label="Remark" value={remark} onChangeText={setRemark} multiline style={{ minHeight: 80 }} />
          </View>

          <GButton title="Save Mating Record" onPress={handleSave} loading={loading} style={{ marginTop: 24 }} />
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

export default AddMatingScreen;
