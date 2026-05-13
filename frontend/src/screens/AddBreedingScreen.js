import React, { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import GInput from '../components/GInput';
import GButton from '../components/GButton';
import GSelect from '../components/GSelect';
import GDatePicker from '../components/GDatePicker';
import api from '../api';

const AddBreedingScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const existingAnimal = route.params?.preSelectedAnimal || {};
  
  const [deliveryDate, setDeliveryDate] = useState('');
  const [birthType, setBirthType] = useState('SINGLE');
  const [numMale, setNumMale] = useState('');
  const [numFemale, setNumFemale] = useState('');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!deliveryDate || !birthType) {
      alert('Delivery Date and Birth Type are required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        animal_id: existingAnimal.id,
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
      alert(error.response?.data?.message || 'Failed to save breeding record');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader title="Add Breeding/Delivery" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', gap: 16 }}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 }
});

export default AddBreedingScreen;
