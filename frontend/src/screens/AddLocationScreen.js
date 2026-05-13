import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import GInput from '../components/GInput';
import GButton from '../components/GButton';
import GSelect from '../components/GSelect';
import api from '../api';
import { Scan, HelpCircle, X, Tag, MapPin, Info } from 'lucide-react-native';
import { SPACING, SHADOW } from '../theme';

const AddLocationScreen = ({ navigation, route }) => {
  const { isDarkMode, theme } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);

  const [tagNumber, setTagNumber] = useState('');
  const [animal, setAnimal] = useState(null);
  const [locationId, setLocationId] = useState(null);
  const [newLocationName, setNewLocationName] = useState('');
  const [remark, setRemark] = useState('');
  
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await api.get('/locations');
      setLocations(response.data.map(loc => ({ 
        label: loc.displayName || loc.name, 
        value: loc.id 
      })));
    } catch (error) {
      console.error('Fetch locations error:', error);
    }
  };

  const handleSearchAnimal = async () => {
    if (!tagNumber) {
      Alert.alert('Validation', 'Please enter a Tag ID');
      return;
    }
    setSearching(true);
    try {
      const response = await api.get(`/animals/check-tag/${tagNumber}`);
      setAnimal(response.data);
      setSearching(false);
    } catch (error) {
      setSearching(false);
      setAnimal(null);
      Alert.alert('Not Found', 'Animal with this Tag ID not found in your farm.');
    }
  };

  const handleSave = async () => {
    if (!animal) {
      Alert.alert('Required', 'Please add an animal by searching its Tag ID first.');
      return;
    }

    if (!locationId && !newLocationName) {
      Alert.alert('Required', 'Please select an existing shed or enter a name for a new one.');
      return;
    }

    setLoading(true);
    try {
      let targetLocationId = locationId;

      if (newLocationName) {
        const locRes = await api.post('/locations', {
          name: newLocationName,
          code: newLocationName.toUpperCase().substring(0, 5),
          type: 'Internal Location'
        });
        targetLocationId = locRes.data.id;
      }

      await api.put(`/animals/${animal.id}`, {
        locationId: targetLocationId,
        remark: remark
      });

      setLoading(false);
      Alert.alert('Success', 'Location assigned successfully');
      navigation.goBack();
    } catch (error) {
      setLoading(false);
      const message = error.response?.data?.message || 'Failed to assign location';
      Alert.alert('Error', message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader 
        title="Add Location/Shed" 
        onBack={() => navigation.goBack()} 
        leftAlign={true}
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.flex}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formArea}>
            {/* Tag ID Search Row */}
            <View style={styles.inputRow}>
              <View style={styles.inputFlex}>
                <GInput 
                  label="Enter Tag ID*" 
                  value={tagNumber} 
                  onChangeText={(val) => {
                    setTagNumber(val);
                    if (!val) setAnimal(null);
                  }} 
                  required 
                  rightIcon={tagNumber ? (
                    <TouchableOpacity onPress={() => {setTagNumber(''); setAnimal(null);}}>
                        <X size={18} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                  ) : null}
                />
              </View>
              <TouchableOpacity 
                style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
                onPress={handleSearchAnimal}
                activeOpacity={0.8}
                disabled={searching}
              >
                <Text style={styles.addBtnText}>{searching ? '...' : 'Add'}</Text>
              </TouchableOpacity>
            </View>

            {/* Animal Card (Preview) */}
            {animal && (
              <View style={[styles.animalCard, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.cardAccent} />
                <View style={styles.animalCardContent}>
                  <View style={styles.animalHeader}>
                    <View style={styles.tagBadgeMain}>
                       <Tag size={14} color={theme.colors.primary} />
                       <Text style={[styles.animalTitle, { color: theme.colors.text }]}>#{animal.tagNumber}</Text>
                    </View>
                    <Text style={[styles.animalBreed, { color: theme.colors.textLight }]}>{animal.breedName}</Text>
                  </View>
                  <View style={styles.animalMetaRow}>
                    <Text style={[styles.metaItem, { color: theme.colors.textLight }]}>{animal.gender}</Text>
                    <View style={styles.dot} />
                    <Text style={[styles.metaItem, { color: theme.colors.textLight }]}>{animal.ageInMonths} Months</Text>
                    <View style={styles.dot} />
                    <View style={styles.currentLocBadge}>
                        <MapPin size={10} color={theme.colors.primary} />
                        <Text style={[styles.currentLocText, { color: theme.colors.primary }]}>{animal.currentLocationName}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
            

            {/* Location Selectors */}
            <GSelect 
              label="Existing Location/Shed" 
              placeholder="Select from your sheds"
              value={locationId} 
              onSelect={(val) => {
                setLocationId(val);
                if (val) setNewLocationName('');
              }}
              options={locations}
              rightIcon={<HelpCircle size={18} color={theme.colors.textMuted} />}
            />
            
            <GInput 
              label="Add New Location" 
              placeholder="E.g. Shed B - North"
              value={newLocationName} 
              onChangeText={(val) => {
                setNewLocationName(val);
                if (val) setLocationId(null);
              }} 
              rightIcon={<HelpCircle size={18} color={theme.colors.textMuted} />}
            />

            <GInput 
              label="Remark" 
              placeholder="Reason for movement (Optional)"
              value={remark} 
              onChangeText={setRemark} 
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed Footer */}
      <View style={[styles.footer, { paddingBottom: Platform.OS === 'ios' ? 34 : 16 }]}>
        <GButton 
          title="Submit" 
          onPress={handleSave}
          loading={loading}
          containerStyle={styles.submitBtn}
        />
      </View>
    </View>
  );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: 40,
  },
  formArea: {
    gap: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  inputFlex: {
    flex: 1,
  },
  addBtn: {
    height: 52,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  addBtnText: {
    color: '#FFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  animalCard: {
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    marginTop: 12,
    ...SHADOW.small,
  },
  cardAccent: {
    width: 6,
    backgroundColor: theme.colors.primary,
  },
  animalCardContent: {
    padding: 16,
    flex: 1,
  },
  animalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagBadgeMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  animalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  animalBreed: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    opacity: 0.7,
  },
  animalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaItem: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.colors.textMuted,
  },
  currentLocBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary + '10',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentLocText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border + '15',
    marginVertical: 20,
  },
  spacer: {
    height: 12,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  submitBtn: {
    height: 54,
    borderRadius: 14,
  }
});

export default AddLocationScreen;
