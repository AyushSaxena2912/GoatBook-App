import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Alert, TouchableOpacity, FlatList, Modal } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import GInput from '../components/GInput';
import GButton from '../components/GButton';
import GSelect from '../components/GSelect';
import GDatePicker from '../components/GDatePicker';
import { Search, Tag, X } from 'lucide-react-native';
import api from '../api';

const AddMatingScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const preSelectedAnimal = route.params?.preSelectedAnimal || null;

  // Animal selection state (used when no preSelectedAnimal)
  const [selectedAnimal, setSelectedAnimal] = useState(preSelectedAnimal);
  const [animals, setAnimals] = useState([]);
  const [animalSearch, setAnimalSearch] = useState('');
  const [animalPickerVisible, setAnimalPickerVisible] = useState(false);

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

  useEffect(() => {
    if (!preSelectedAnimal) {
      fetchAnimals();
    }
  }, []);

  const fetchAnimals = async () => {
    try {
      const res = await api.get('/animals');
      // Only show females for mating
      setAnimals(res.data.filter(a => a.gender === 'Female' || a.gender === 'female'));
    } catch (err) {
      console.error('Fetch animals error:', err);
    }
  };

  const filteredAnimals = animals.filter(a =>
    a.tagNumber?.toLowerCase().includes(animalSearch.toLowerCase()) ||
    a.Breeds?.name?.toLowerCase().includes(animalSearch.toLowerCase())
  );

  const handleSave = async () => {
    if (!selectedAnimal) {
      Alert.alert('Error', 'Please select an animal first.');
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

          {/* Animal Selector */}
          <TouchableOpacity
            onPress={() => !preSelectedAnimal && setAnimalPickerVisible(true)}
            style={[styles.animalSelector, { 
              backgroundColor: theme.colors.surface,
              borderColor: selectedAnimal ? theme.colors.primary : theme.colors.border,
            }]}
            activeOpacity={preSelectedAnimal ? 1 : 0.7}
          >
            <Tag size={18} color={theme.colors.primary} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.animalSelectorLabel, { color: theme.colors.textMuted }]}>Female Animal *</Text>
              <Text style={[styles.animalSelectorValue, { color: selectedAnimal ? theme.colors.text : theme.colors.textMuted }]}>
                {selectedAnimal ? `Tag: ${selectedAnimal.tagNumber || selectedAnimal.tag_number}` : 'Tap to select animal'}
              </Text>
            </View>
            {!preSelectedAnimal && <Text style={{ color: theme.colors.primary, fontSize: 12 }}>Change</Text>}
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
            <GDatePicker
              containerStyle={{ flex: 1 }}
              label="Mating Date"
              value={matingDate}
              onDateChange={setMatingDate}
              required
            />
            <GSelect
              containerStyle={{ flex: 1 }}
              label="Mating Type"
              value={matingType}
              onSelect={setMatingType}
              options={[
                { label: 'Natural', value: 'NATURAL' },
                { label: 'Artificial Insemination (AI)', value: 'AI' },
                { label: 'Embryo Transplant (ET)', value: 'ET' }
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
              <GDatePicker
                label="Expected Delivery Due Date"
                value={expectedDeliveryDate}
                onDateChange={setExpectedDeliveryDate}
              />
            </View>
          )}

          {status === 'MISCARRIAGE' && (
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
              <GDatePicker
                containerStyle={{ flex: 1 }}
                label="Miscarriage Date"
                value={miscarriageDate}
                onDateChange={setMiscarriageDate}
              />
              <GInput
                containerStyle={{ flex: 1 }}
                label="Reason"
                value={miscarriageReason}
                onChangeText={setMiscarriageReason}
              />
            </View>
          )}

          <View style={{ marginTop: 12 }}>
            <GInput label="Remark" value={remark} onChangeText={setRemark} multiline style={{ minHeight: 80 }} />
          </View>

          <GButton title="Save Mating Record" onPress={handleSave} loading={loading} style={{ marginTop: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Animal Picker Modal */}
      <Modal visible={animalPickerVisible} animationType="slide" transparent>
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerContainer, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: theme.colors.text }]}>Select Female Animal</Text>
              <TouchableOpacity onPress={() => setAnimalPickerVisible(false)}>
                <X size={22} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <View style={[styles.searchBox, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <Search size={16} color={theme.colors.textMuted} />
              <GInput
                style={{ flex: 1, borderWidth: 0, marginBottom: 0 }}
                placeholder="Search by tag or breed..."
                value={animalSearch}
                onChangeText={setAnimalSearch}
              />
            </View>
            <FlatList
              data={filteredAnimals}
              keyExtractor={i => i.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.animalItem, { borderBottomColor: theme.colors.border }]}
                  onPress={() => {
                    setSelectedAnimal(item);
                    setAnimalPickerVisible(false);
                    setAnimalSearch('');
                  }}
                >
                  <Tag size={14} color={theme.colors.primary} />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={[styles.animalItemTag, { color: theme.colors.text }]}>{item.tagNumber}</Text>
                    <Text style={[styles.animalItemBreed, { color: theme.colors.textMuted }]}>{item.Breeds?.name || 'No breed'}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>No female animals found</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  animalSelector: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 12, borderWidth: 1.5,
  },
  animalSelectorLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  animalSelectorValue: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginTop: 2 },
  pickerOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'
  },
  pickerContainer: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  pickerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, marginBottom: 12 },
  animalItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  animalItemTag: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  animalItemBreed: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  emptyText: { textAlign: 'center', padding: 30, fontFamily: 'Inter_400Regular' },
});

export default AddMatingScreen;
