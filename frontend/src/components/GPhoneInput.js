import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList, SafeAreaView, TouchableWithoutFeedback } from 'react-native';
import { ChevronDown, X, Search } from 'lucide-react-native';
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

const GPhoneInput = ({ value, onChangeText, editable, onFocus, onBlur, ...rest }) => {
  const { theme } = useTheme();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { code, number } = useMemo(() => parsePhoneValue(value), [value]);
  const showCode = isFocused || !!number;

  const filteredCodes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return COUNTRY_CODES;
    return COUNTRY_CODES.filter(c =>
      c.country.toLowerCase().includes(q) || c.code.includes(q)
    );
  }, [searchQuery]);

  const handleNumberChange = (num) => {
    onChangeText(`${code} ${num}`.trim());
  };

  const closePicker = () => {
    setPickerVisible(false);
    setSearchQuery('');
  };

  const handleCodeSelect = (newCode) => {
    closePicker();
    onChangeText(`${newCode} ${number}`.trim());
  };

  return (
    <>
      <GInput
        value={number}
        onChangeText={handleNumberChange}
        keyboardType="phone-pad"
        editable={editable}
        onFocus={(e) => { setIsFocused(true); onFocus && onFocus(e); }}
        onBlur={(e) => { setIsFocused(false); onBlur && onBlur(e); }}
        leftIcon={
          showCode ? (
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
          ) : null
        }
        {...rest}
      />

      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={closePicker}
      >
        <TouchableWithoutFeedback onPress={closePicker}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <TouchableWithoutFeedback>
              <SafeAreaView style={{ backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '75%' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: theme.colors.primary, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
                  <Text style={{ color: '#fff', fontSize: 18, fontFamily: theme.typography.semiBold }}>Select Country Code</Text>
                  <TouchableOpacity onPress={closePicker} style={{ position: 'absolute', right: 16 }}>
                    <X size={22} color="#fff" />
                  </TouchableOpacity>
                </View>

                <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, borderRadius: 10, paddingHorizontal: 12, height: 44 }}>
                    <Search size={18} color={theme.colors.textMuted} style={{ marginRight: 8 }} />
                    <TextInput
                      style={{ flex: 1, fontSize: 15, height: '100%', color: theme.colors.text, outlineWidth: 0 }}
                      placeholder="Search country or code..."
                      placeholderTextColor={theme.colors.textMuted}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoCapitalize="none"
                      autoFocus
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <X size={16} color={theme.colors.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <FlatList
                  data={filteredCodes}
                  keyExtractor={(item) => item.code + item.country}
                  contentContainerStyle={{ paddingBottom: 24 }}
                  keyboardShouldPersistTaps="handled"
                  ListEmptyComponent={
                    <Text style={{ textAlign: 'center', padding: 24, fontSize: 14, color: theme.colors.textMuted }}>No matching country</Text>
                  }
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
