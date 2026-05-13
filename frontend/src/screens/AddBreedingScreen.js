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

const AddBreedingScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const preSelectedAnimal = route.params?.preSelectedAnimal || null;

  // Animal selection state
  const [selectedAnimal, setSelectedAnimal] = useState(preSelectedAnimal);
  const [animals, setAnimals] = useState([]);
  const [animalSearch, setAnimalSearch] = useState('');
  const [animalPickerVisible, setAnimalPickerVisible] = useState(false);

  const [deliveryDate, setDeliveryDate] = useState('');
  const [birthType, setBirthType] = useState('SINGLE');
  const [numMale, setNumMale] = useState('');
  const [numFemale, setNumFemale] = useState('');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!preSelectedAnimal) {
      fetchAnimals();
    }
  }, []);

  const fetchAnimals = async () => {
    try {
      const res = await api.get('/animals');
      // Only females can have breeding records
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
              label="Delivery Date"
              value={deliveryDate}
              onDateChange={setDeliveryDate}
              required
            />
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
            <GInput
              containerStyle={{ flex: 1 }}
              label="Number of Male"
              value={numMale}
              onChangeText={setNumMale}
              keyboardType="number-pad"
            />
            <GInput
              containerStyle={{ flex: 1 }}
              label="Number of Female"
              value={numFemale}
              onChangeText={setNumFemale}
              keyboardType="number-pad"
            />
          </View>

          <View style={{ marginTop: 12 }}>
            <GInput label="Remark" value={remark} onChangeText={setRemark} multiline style={{ minHeight: 80 }} />
          </View>

          <GButton title="Save Delivery Record" onPress={handleSave} loading={loading} style={{ marginTop: 24 }} />
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

export default AddBreedingScreen;
