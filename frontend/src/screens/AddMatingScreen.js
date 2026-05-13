import React, { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import GInput from '../components/GInput';
import GButton from '../components/GButton';
import GSelect from '../components/GSelect';
import GDatePicker from '../components/GDatePicker';
import api from '../api';

const AddMatingScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const existingAnimal = route.params?.preSelectedAnimal || {};
  
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

  const handleSave = async () => {
    if (!matingDate || !matingType) {
      alert('Mating Date and Type are required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        animal_id: existingAnimal.id,
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
      alert(error.response?.data?.message || 'Failed to save mating record');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader title="Add Mating Record" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', gap: 16 }}>
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
                <GInput containerStyle={{ flex: 1 }} label="Time (e.g. AM/PM)" value={time} onChangeText={setTime} />
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
                <GInput label="Time (e.g. AM/PM)" value={time} onChangeText={setTime} />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 }
});

export default AddMatingScreen;
