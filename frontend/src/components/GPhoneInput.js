import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, SafeAreaView, TouchableWithoutFeedback } from 'react-native';
import { ChevronDown, X } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import GInput from './GInput';

export const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'USA / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' },
  { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
  { code: '+977', country: 'Nepal', flag: '🇳🇵' },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
];

export const DEFAULT_COUNTRY_CODE = '+91';

// Splits a stored phone value like "+91 9876543210" into its code + local number.
// Values with no recognized code prefix (e.g. legacy data saved before this
// feature existed) fall back to the default code so nothing breaks.
export const parsePhoneValue = (value) => {
  const raw = String(value || '').trim();
  const match = COUNTRY_CODES.find(c => raw.startsWith(c.code + ' ') || raw === c.code);
  if (match) {
    return { code: match.code, number: raw.slice(match.code.length).trim() };
  }
  return { code: DEFAULT_COUNTRY_CODE, number: raw };
};

const GPhoneInput = ({ value, onChangeText, editable, ...rest }) => {
  const { theme } = useTheme();
  const [pickerVisible, setPickerVisible] = useState(false);
  const { code, number } = useMemo(() => parsePhoneValue(value), [value]);

  const handleNumberChange = (num) => {
    onChangeText(`${code} ${num}`.trim());
  };

  const handleCodeSelect = (newCode) => {
    setPickerVisible(false);
    onChangeText(`${newCode} ${number}`.trim());
  };

  return (
    <>
      <GInput
        value={number}
        onChangeText={handleNumberChange}
        keyboardType="phone-pad"
        editable={editable}
        leftIcon={
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 10, marginRight: 2, borderRightWidth: 1, borderRightColor: theme.colors.border }}
            onPress={() => editable !== false && setPickerVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
          >
            <Text style={{ fontSize: 15, fontFamily: theme.typography.semiBold, color: editable === false ? theme.colors.textMuted : theme.colors.text, marginRight: 3 }}>
              {code}
            </Text>
            {editable !== false && <ChevronDown size={14} color={theme.colors.textMuted} />}
          </TouchableOpacity>
        }
        {...rest}
      />

      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setPickerVisible(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <TouchableWithoutFeedback>
              <SafeAreaView style={{ backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: theme.colors.primary, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
                  <Text style={{ color: '#fff', fontSize: 18, fontFamily: theme.typography.semiBold }}>Select Country Code</Text>
                  <TouchableOpacity onPress={() => setPickerVisible(false)} style={{ position: 'absolute', right: 16 }}>
                    <X size={22} color="#fff" />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={COUNTRY_CODES}
                  keyExtractor={(item) => item.code + item.country}
                  contentContainerStyle={{ paddingBottom: 24 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
                        item.code === code && { backgroundColor: theme.colors.primary + '10' }
                      ]}
                      onPress={() => handleCodeSelect(item.code)}
                    >
                      <Text style={{ fontSize: 20, marginRight: 12 }}>{item.flag}</Text>
                      <Text style={{ flex: 1, fontSize: 15, fontFamily: theme.typography.medium, color: theme.colors.text }}>{item.country}</Text>
                      <Text style={{ fontSize: 15, fontFamily: theme.typography.semiBold, color: theme.colors.primary }}>{item.code}</Text>
                    </TouchableOpacity>
                  )}
                />
              </SafeAreaView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

export default GPhoneInput;
