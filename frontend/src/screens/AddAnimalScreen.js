import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SPACING } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { getStyles } from './AddAnimalScreen.styles';
import GHeader from '../components/GHeader';
import GInput from '../components/GInput';
import GButton from '../components/GButton';
import GSelect from '../components/GSelect';
import GDatePicker from '../components/GDatePicker';
import { 
  Check, HelpCircle, ChevronDown, ChevronUp, Plus, Scale, Syringe, 
  Heart, Baby, Milk, Shield 
} from 'lucide-react-native';
import api from '../api';
import { getFromCache } from '../utils/cache';

const AddAnimalScreen = ({ navigation, route }) => {
  const { isDarkMode, theme } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);

  const CheckBox = ({ label, value, onToggle }) => {
    return (
      <TouchableOpacity style={styles.checkboxContainer} onPress={onToggle} activeOpacity={0.7}>
        <View style={[styles.checkbox, { borderColor: theme.colors.border }, value && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}>
          {value && <Check size={14} color="#FFF" />}
        </View>
        <Text style={[styles.checkboxLabel, { color: theme.colors.text }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const isEditing = !!route.params?.animal;
  const existingAnimal = route.params?.animal || {};
  const [weightExpanded, setWeightExpanded] = useState(false);

  const [tagNumber, setTagNumber] = useState(existingAnimal.tagNumber || '');
  const [weights, setWeights] = useState([]);
  const [weightsLoading, setWeightsLoading] = useState(false);
  const [vaccinations, setVaccinations] = useState([]);
  const [vaccinationsLoading, setVaccinationsLoading] = useState(false);
  const [vaccinationExpanded, setVaccinationExpanded] = useState(false);
  const [breedId, setBreedId] = useState(existingAnimal.breedId || '');
  const [color, setColor] = useState(existingAnimal.color || '');
  const [gender, setGender] = useState(existingAnimal.gender || '');
  const [batchNo, setBatchNo] = useState(existingAnimal.batchNo || '');
  const [acquisitionMethod, setAcquisitionMethod] = useState(existingAnimal.acquisitionMethod || '');
  const [locationId, setLocationId] = useState(existingAnimal.locationId || null);
  
  const [matingExpanded, setMatingExpanded] = useState(false);
  const [breedingExpanded, setBreedingExpanded] = useState(false);
  const [milkExpanded, setMilkExpanded] = useState(false);
  const [insuranceExpanded, setInsuranceExpanded] = useState(false);
  
  // Age and Parents
  const [birthDate, setBirthDate] = useState(existingAnimal.birthDate || '');
  const [birthWeight, setBirthWeight] = useState(existingAnimal.birthWeight?.toString() || '');
  const [ageInMonths, setAgeInMonths] = useState(existingAnimal.ageInMonths?.toString() || '');
  const [birthType, setBirthType] = useState(existingAnimal.birthType || '');
  const [motherTagId, setMotherTagId] = useState(existingAnimal.motherTagId || '');
  const [fatherTagId, setFatherTagId] = useState(existingAnimal.fatherTagId || '');
  
  // Male specific
  const [isBreeder, setIsBreeder] = useState(existingAnimal.isBreeder || false);
  const [isQurbani, setIsQurbani] = useState(existingAnimal.isQurbani || false);

  // Purchased specific
  const [purchaseDate, setPurchaseDate] = useState(existingAnimal.purchaseDate || '');
  const [purchasePrice, setPurchasePrice] = useState(existingAnimal.purchasePrice?.toString() || '');
  const [femaleCondition, setFemaleCondition] = useState(existingAnimal.femaleCondition || 'NONE');

  // Misc
  const [remark, setRemark] = useState(existingAnimal.remark || '');
  const [animalStatus, setAnimalStatus] = useState(existingAnimal.status || 'LIVE');
  const [isReadyForSale, setIsReadyForSale] = useState(existingAnimal.isReadyForSale || false);
  const [currentWeight, setCurrentWeight] = useState(existingAnimal.currentWeight?.toString() || '');
  const [salePrice, setSalePrice] = useState(existingAnimal.salePrice?.toString() || '');

  // UI state
  const [breeds, setBreeds] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchBreeds();
      fetchLocations();
      if (isEditing) {
        fetchWeights();
        fetchVaccinations();
      }
    }, [])
  );

  const fetchVaccinations = async () => {
    try {
      setVaccinationsLoading(true);
      const response = await api.get(`/vaccines/records?animalId=${existingAnimal.id}`);
      setVaccinations(response.data);
    } catch (error) {
      console.error('Fetch vaccinations error:', error);
    } finally {
      setVaccinationsLoading(false);
    }
  };

  const fetchWeights = async () => {
    try {
      setWeightsLoading(true);
      const response = await api.get(`/weights?animalId=${existingAnimal.id}`);
      setWeights(response.data);
    } catch (error) {
      console.error('Fetch weights error:', error);
    } finally {
      setWeightsLoading(false);
    }
  };

  // Rules: Uncheck male specific boxes if gender changes to FEMALE
  useEffect(() => {
    if (gender === 'FEMALE') {
      setIsBreeder(false);
      setIsQurbani(false);
    }
  }, [gender]);

  // Rules: Reset specific fields when method changes
  useEffect(() => {
    if (acquisitionMethod === 'BORN') {
      setPurchaseDate('');
      setPurchasePrice('');
      setFemaleCondition('NONE');
    } else {
      setMotherTagId('');
      setFatherTagId('');
    }
  }, [acquisitionMethod]);

  // Calculate age when birth date changes
  useEffect(() => {
    if (birthDate && birthDate !== '') {
      const birth = new Date(birthDate);
      if (!isNaN(birth.getTime())) {
        const now = new Date();
        let months = (now.getFullYear() - birth.getFullYear()) * 12;
        months -= birth.getMonth();
        months += now.getMonth();
        if (months < 0) months = 0;
        setAgeInMonths(months.toString());
      } else {
        setAgeInMonths('');
      }
    } else {
      // If birthDate is cleared, we don't necessarily clear age if it was manually entered
      // but if it was auto-calculated, maybe we should? 
      // For now, let's just ensure it's not NaN.
    }
  }, [birthDate]);

  const fetchBreeds = async () => {
    try {
      const response = await api.get('/breeds');
      setBreeds(response.data.map(b => ({ label: `${b.name} (${b.animalType})`, value: b.id, animalType: b.animalType })));
    } catch (error) {
      console.warn('Fetch breeds failed, trying cache...', error);
      const cached = await getFromCache('breeds');
      if (cached) {
        setBreeds(cached.map(b => ({ label: `${b.name} (${b.animalType})`, value: b.id, animalType: b.animalType })));
      }
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await api.get('/locations');
      const transformed = response.data.map(loc => ({ 
        label: loc.displayName || loc.name, 
        value: loc.id 
      }));
      setLocations([{ label: 'No Location Assigned', value: null }, ...transformed]);
    } catch (error) {
      console.warn('Fetch locations failed, trying cache...', error);
      const cached = await getFromCache('locations');
      if (cached) {
        const transformed = cached.map(loc => ({ 
          label: loc.displayName || loc.name, 
          value: loc.id 
        }));
        setLocations([{ label: 'No Location Assigned', value: null }, ...transformed]);
      }
    }
  };

  const toggleBreeder = () => {
    if (gender !== 'MALE') return;
    setIsBreeder(prev => {
      if (!prev) setIsQurbani(false);
      return !prev;
    });
  };

  const toggleQurbani = () => {
    if (gender !== 'MALE') return;
    setIsQurbani(prev => {
      if (!prev) setIsBreeder(false);
      return !prev;
    });
  };

  const handleSave = async () => {
    if (!tagNumber || !breedId || !gender || !acquisitionMethod) {
      alert('Please fill in all required fields marked with *');
      return;
    }

    if (acquisitionMethod === 'PURCHASED') {
      if (!purchaseDate || !purchasePrice || !ageInMonths) {
        alert('Purchase date, price, and age in months are required for purchased animals.');
        return;
      }
    }

    const isValidDate = (d) => {
      if (!d || d === '' || d === 'Invalid Date' || d === 'Invalid date') return false;
      const date = new Date(d);
      return !isNaN(date.getTime());
    };

    setLoading(true);
    try {
      const payload = { 
        tagNumber, 
        breedId, 
        gender, 
        color,
        batchNo,
        acquisitionMethod,
        locationId,
        birthDate: isValidDate(birthDate) ? birthDate : null,
        birthWeight: (birthWeight && !isNaN(parseFloat(birthWeight))) ? parseFloat(birthWeight) : null,
        ageInMonths: (ageInMonths && !isNaN(parseInt(ageInMonths))) ? parseInt(ageInMonths) : null,
        birthType: birthType || null,
        motherTagId: acquisitionMethod === 'BORN' ? (motherTagId || null) : null,
        fatherTagId: acquisitionMethod === 'BORN' ? (fatherTagId || null) : null,
        isBreeder: gender === 'MALE' ? isBreeder : false,
        isQurbani: gender === 'MALE' ? isQurbani : false,
        purchaseDate: (acquisitionMethod === 'PURCHASED' && isValidDate(purchaseDate)) ? purchaseDate : null,
        purchasePrice: (purchasePrice && !isNaN(parseFloat(purchasePrice))) ? parseFloat(purchasePrice) : null,
        femaleCondition: (gender === 'FEMALE' && acquisitionMethod === 'PURCHASED') ? femaleCondition : null,
        remark,
        status: animalStatus,
        isReadyForSale,
        currentWeight: isReadyForSale ? (parseFloat(currentWeight) || null) : null,
        salePrice: isReadyForSale ? (parseFloat(salePrice) || null) : null,
      };

      if (isEditing) {
        await api.put(`/animals/${existingAnimal.id}`, payload);
      } else {
        await api.post('/animals', payload);
      }
      setLoading(false);
      navigation.goBack();
    } catch (error) {
      setLoading(false);
      const message = error.response?.data?.message || 'Failed to save animal';
      alert(message);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Animal',
      'Are you sure you want to delete this animal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            setDeleting(true);
            try {
              await api.delete(`/animals/${existingAnimal.id}`);
              setDeleting(false);
              navigation.navigate('AnimalList');
            } catch (error) {
              setDeleting(false);
              const msg = error.response?.data?.message || 'Failed to delete animal';
              alert(msg);
            }
          } 
        }
      ]
    );
  };

  const sectionHeaderStyle = [
    styles.sectionTitle, 
    { 
      color: theme.colors.primary, 
      fontFamily: 'Montserrat_600SemiBold',
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontSize: 14,
      marginBottom: 16,
      marginTop: 24,
      borderBottomWidth:1.5,
      borderBottomColor: theme.colors.border,
      paddingBottom: 8
    }
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader 
        title={isEditing ? "Edit Animal" : "Add New Animal"} 
        onBack={() => navigation.goBack()} 
        rightIcon={isEditing && (
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: animalStatus === 'LIVE' ? '#10B981' : '#EF4444' }]} />
            <Text style={styles.statusText}>{animalStatus}</Text>
          </View>
        )}
      />
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {isEditing && (
            <View style={styles.readyToSellCard}>
               <View style={styles.readyHeaderRow}>
                  <Text style={[styles.readyTitle, { color: theme.colors.error }]}>READY TO SELL</Text>
                  <HelpCircle size={18} color={theme.colors.textMuted} />
               </View>
               <View style={styles.readyOptions}>
                  <CheckBox label="No" value={!isReadyForSale} onToggle={() => setIsReadyForSale(false)} />
                  <View style={{ width: 24 }} />
                  <CheckBox label="Yes" value={isReadyForSale} onToggle={() => setIsReadyForSale(true)} />
               </View>
            </View>
          )}

          <Text style={sectionHeaderStyle}>Identification</Text>

          <View style={styles.formContainer}>
            {/* ROW 1 */}
            <View style={styles.row}>
              <GInput 
                containerStyle={styles.halfWidth}
                label="Tag ID" 
                value={tagNumber} 
                onChangeText={setTagNumber} 
                placeholder="2912"
                required 
              />
              <GInput 
                containerStyle={styles.halfWidth}
                label="Animal Type" 
                value={breedId ? breeds.find(b => b.value === breedId)?.animalType || 'Goat' : 'Goat'} 
                editable={false}
                style={{ backgroundColor: theme.colors.surface, color: theme.colors.textMuted }}
              />
            </View>

            {/* ROW 2 */}
            <View style={styles.row}>
              <GSelect 
                containerStyle={styles.halfWidth}
                label="Breed" 
                value={breedId} 
                onSelect={setBreedId}
                options={breeds}
                placeholder="Select..."
                required
              />
              <GSelect 
                containerStyle={styles.halfWidth}
                label="Gender" 
                value={gender} 
                onSelect={setGender}
                options={[
                  { label: 'Male', value: 'MALE' },
                  { label: 'Female', value: 'FEMALE' }
                ]}
                required
              />
            </View>

            {/* MALE CONDITIONAL ROW (Aligned with fields) */}
            {gender === 'MALE' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 12, marginLeft: 11 }}>
                <Text style={{ 
                  fontSize: 14, 
                  color: theme.colors.text, 
                  fontFamily: theme.typography.semiBold,
                  marginRight: 16,
                  fontWeight: '500'
                }}>Male Options:</Text>
                <CheckBox label="Breeder" value={isBreeder} onToggle={toggleBreeder} />
                <View style={{ width: 16 }} />
                <CheckBox label="Qurbani" value={isQurbani} onToggle={toggleQurbani} />
              </View>
            )}

            {/* ROW 3 */}
            <View style={styles.row}>
               <GInput 
                containerStyle={styles.halfWidth}
                label="Color" 
                value={color}
                onChangeText={setColor}
                placeholder="e.g. Red"
              />
              <GInput 
                containerStyle={styles.halfWidth}
                label="Batch No" 
                value={batchNo} 
                onChangeText={setBatchNo} 
                placeholder="e.g. 31"
              />
            </View>

            {/* ROW 4 */}
            <View style={styles.row}>
              <GSelect 
                containerStyle={styles.halfWidth}
                label="Source" 
                value={acquisitionMethod} 
                onSelect={setAcquisitionMethod}
                options={[
                  { label: 'Born At Farm', value: 'BORN' },
                  { label: 'Purchased', value: 'PURCHASED' }
                ]}
                required
              />
              <GSelect 
                containerStyle={styles.halfWidth}
                label="Location" 
                value={locationId} 
                onSelect={setLocationId}
                options={locations}
                placeholder="Select..."
              />
            </View>

            {/* GROWTH SECTION: Only visible if Gender is Female OR acquisitionMethod is PURCHASED/BORN check images */}
            {((gender === 'FEMALE') || (acquisitionMethod === 'PURCHASED') || (acquisitionMethod === 'BORN')) && (
              <>
                <Text style={sectionHeaderStyle}>Growth & Background</Text>
                
                {/* Born specific fields check image 3 */}
                {acquisitionMethod === 'BORN' && (
                  <View style={styles.row}>
                    <GDatePicker 
                      containerStyle={styles.halfWidth}
                      label="Birth Date" 
                      value={birthDate} 
                      onDateChange={setBirthDate}
                      placeholder="Select Date"
                      required
                    />
                    <GInput 
                      containerStyle={styles.halfWidth}
                      label="Birth Wt." 
                      value={birthWeight} 
                      onChangeText={setBirthWeight} 
                      keyboardType="decimal-pad"
                      placeholder="e.g. 5.5"
                    />
                  </View>
                )}

                {/* AGE and BIRTH TYPE: Visible if Female or Method is set */}
                <View style={styles.row}>
                  <GInput 
                    containerStyle={styles.halfWidth}
                    label="Age (Months)" 
                    value={ageInMonths} 
                    onChangeText={setAgeInMonths} 
                    keyboardType="number-pad"
                    placeholder="e.g. 12"
                    required={(acquisitionMethod === 'PURCHASED' || gender === 'FEMALE')}
                  />
                  <GSelect 
                    containerStyle={styles.halfWidth}
                    label="Birth Type" 
                    value={birthType} 
                    onSelect={setBirthType}
                    options={[
                      { label: 'Single', value: 'SINGLE' },
                      { label: 'Twin', value: 'TWIN' },
                      { label: 'Triplet', value: 'TRIPLET' },
                      { label: 'Quadruplet', value: 'QUADRUPLET' }
                    ]}
                    placeholder="Select Type"
                  />
                </View>

                {/* PARENTS: Only if Born at farm */}
                {acquisitionMethod === 'BORN' && (
                  <View style={styles.row}>
                    <GInput 
                      containerStyle={styles.halfWidth}
                      label="Mother Tag ID" 
                      value={motherTagId}
                      onChangeText={setMotherTagId}
                      placeholder="e.g. 1974"
                    />
                    <GInput 
                      containerStyle={styles.halfWidth}
                      label="Father Tag ID" 
                      value={fatherTagId}
                      onChangeText={setFatherTagId}
                      placeholder="e.g. 1974"
                    />
                  </View>
                )}
              </>
            )}

            {/* PURCHASE SECTION */}
            {acquisitionMethod === 'PURCHASED' && (
              <>
                <View style={styles.row}>
                  <GDatePicker 
                    containerStyle={styles.halfWidth}
                    label="Purchase Date" 
                    value={purchaseDate} 
                    onDateChange={setPurchaseDate}
                    placeholder="Select Date"
                    required
                  />
                  <GInput 
                    containerStyle={styles.halfWidth}
                    label="Purchase Price" 
                    value={purchasePrice} 
                    onChangeText={setPurchasePrice} 
                    keyboardType="number-pad"
                    placeholder="e.g. 5000"
                    required
                  />
                </View>
                {gender === 'FEMALE' && (
                  <View style={styles.row}>
                    <GSelect 
                      containerStyle={styles.halfWidth}
                      label="Female Cond." 
                      value={femaleCondition} 
                      onSelect={setFemaleCondition}
                      options={[
                        { label: 'None', value: 'NONE' },
                        { label: 'Mated', value: 'MATED' },
                        { label: 'Pregnant', value: 'PREGNANT' }
                      ]}
                    />
                    <View style={styles.halfWidth} />
                  </View>
                )}
              </>
            )}

            <GInput 
              label="Remark" 
              value={remark} 
              onChangeText={setRemark} 
              placeholder="e.g. Good!"
              multiline
              style={{ minHeight: 80, paddingTop: 12, color: theme.colors.text }}
            />
          </View>

          {isEditing && (
            <View style={[styles.weightSection, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <TouchableOpacity 
                style={[styles.weightHeader, { borderBottomColor: theme.colors.border }]}
                activeOpacity={0.7}
                onPress={() => setWeightExpanded(!weightExpanded)}
              >
                <View style={styles.row}>
                  <Text style={styles.sectionTitle}>WEIGHT HISTORY</Text>
                </View>
                {weightExpanded ? <ChevronUp size={20} color={theme.colors.textMuted} /> : <ChevronDown size={20} color={theme.colors.textMuted} />}
              </TouchableOpacity>
              
              {weightExpanded && (
                <View style={styles.weightContent}>
                  <TouchableOpacity 
                    style={styles.addNewBtn}
                    onPress={() => navigation.navigate('AddWeight', { tagNumber: existingAnimal.tagNumber })}
                  >
                    <Plus size={16} color="#FFF" />
                    <Text style={styles.addNewText}>Add New Record</Text>
                  </TouchableOpacity>

                  {weightsLoading ? (
                    <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 20 }} />
                  ) : weights.length > 0 ? (
                    <View style={styles.weightList}>
                      {weights.map((w, idx) => (
                        <View key={w.id} style={[styles.weightItem, { borderBottomColor: theme.colors.border }, idx === weights.length - 1 && { borderBottomWidth: 0 }]}>
                          <View style={[styles.weightIconBox, { backgroundColor: isDarkMode ? theme.colors.surface : '#FFF1EA' }]}>
                            <Scale size={16} color={theme.colors.primary} />
                          </View>
                          <View style={styles.weightInfoBlock}>
                            <Text style={[styles.weightKg, { color: theme.colors.text }]}>{w.weight} KG</Text>
                            <Text style={[styles.weightDate, { color: theme.colors.textLight }]}>{w.date}</Text>
                          </View>
                          {w.height && (
                            <View style={styles.heightInfoBlock}>
                              <Text style={[styles.weightLabel, { color: theme.colors.textLight }]}>Height</Text>
                              <Text style={[styles.weightValue, { color: theme.colors.text }]}>{w.height}</Text>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={[styles.noRecordsText, { color: theme.colors.textMuted }]}>No records found</Text>
                  )}
                </View>
              )}
            </View>
          )}

          {isEditing && (
            <>
              {/* VACCINATION RECORD */}
              <View style={[styles.weightSection, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <TouchableOpacity 
                  style={[styles.weightHeader, { borderBottomColor: theme.colors.border }]}
                  activeOpacity={0.7}
                  onPress={() => setVaccinationExpanded(!vaccinationExpanded)}
                >
                <View style={styles.row}>
                  <Text style={styles.sectionTitle}>VACCINATION RECORD</Text>
                </View>
                {vaccinationExpanded ? <ChevronUp size={20} color={theme.colors.textMuted} /> : <ChevronDown size={20} color={theme.colors.textMuted} />}
              </TouchableOpacity>
                {vaccinationExpanded && (
                  <View style={styles.weightContent}>
                    <TouchableOpacity 
                      style={styles.addNewBtn}
                      onPress={() => navigation.navigate('AddVaccination', { mode: 'single', preSelectedAnimal: existingAnimal })}
                    >
                      <Plus size={16} color="#FFF" />
                      <Text style={styles.addNewText}>Add New Record</Text>
                    </TouchableOpacity>
                    
                    {vaccinationsLoading ? (
                      <ActivityIndicator color={theme.colors.primary} />
                    ) : vaccinations.length > 0 ? (
                      <View style={styles.weightList}>
                        {vaccinations.map((v, idx) => (
                          <TouchableOpacity 
                            key={v.id} 
                            style={[styles.weightItem, { borderBottomColor: theme.colors.border }, idx === vaccinations.length - 1 && { borderBottomWidth: 0 }]}
                            onPress={() => navigation.navigate('AddVaccination', { mode: 'single', record: v })}
                          >
                            <View style={styles.weightIconBox}>
                              <Syringe size={16} color={theme.colors.primary} />
                            </View>
                            <View style={styles.weightInfoBlock}>
                              <Text style={[styles.weightKg, { color: theme.colors.text }]}>{v.vaccine?.name}</Text>
                              <Text style={[styles.weightDate, { color: theme.colors.textLight }]}>{v.date}</Text>
                            </View>
                            {v.nextDueDate && (
                              <View style={[styles.heightInfoBlock, { minWidth: 100 }]}>
                                <Text style={[styles.weightLabel, { color: theme.colors.primary, fontFamily: theme.typography.medium }]}>Due Date</Text>
                                <Text style={[styles.weightValue, { color: theme.colors.text, fontFamily: theme.typography.semiBold }]}>{v.nextDueDate}</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : (
                      <Text style={[styles.noRecordsText, { color: theme.colors.textMuted, fontFamily: theme.typography.regular }]}>No Records found</Text>
                    )}
                  </View>
                )}
              </View>



              {/* MATING RECORD */}
              <View style={[styles.weightSection, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <TouchableOpacity 
                  style={[styles.weightHeader, { borderBottomColor: theme.colors.border }]}
                  activeOpacity={0.7}
                  onPress={() => setMatingExpanded(!matingExpanded)}
                >
                  <View style={[styles.row, { marginBottom: 0, alignItems: 'center' }]}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.primary, marginBottom: 0, fontSize: 15, fontFamily: theme.typography.semiBold }]}>MATING RECORD</Text>
                  </View>
                  {matingExpanded ? <ChevronUp size={20} color={theme.colors.textMuted} /> : <ChevronDown size={20} color={theme.colors.textMuted} />}
                </TouchableOpacity>
                {matingExpanded && (
                  <View style={styles.weightContent}>
                    <TouchableOpacity style={styles.addNewBtn}>
                      <Plus size={16} color="#FFF" />
                      <Text style={styles.addNewText}>Add New Record</Text>
                    </TouchableOpacity>
                    <Text style={[styles.noRecordsText, { color: theme.colors.textMuted, fontFamily: theme.typography.regular }]}>No Records found</Text>
                  </View>
                )}
              </View>

              {/* BREEDING/DELIVERY */}
              <View style={[styles.weightSection, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <TouchableOpacity 
                  style={[styles.weightHeader, { borderBottomColor: theme.colors.border }]}
                  activeOpacity={0.7}
                  onPress={() => setBreedingExpanded(!breedingExpanded)}
                >
                  <View style={[styles.row, { marginBottom: 0, alignItems: 'center' }]}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.primary, marginBottom: 0, fontSize: 15, fontFamily: theme.typography.semiBold }]}>BREEDING/DELIVERY RECORD</Text>
                  </View>
                  {breedingExpanded ? <ChevronUp size={20} color={theme.colors.textMuted} /> : <ChevronDown size={20} color={theme.colors.textMuted} />}
                </TouchableOpacity>
                {breedingExpanded && (
                  <View style={styles.weightContent}>
                     <TouchableOpacity style={styles.addNewBtn}>
                      <Plus size={16} color="#FFF" />
                      <Text style={styles.addNewText}>Add New Record</Text>
                    </TouchableOpacity>
                    <Text style={[styles.noRecordsText, { color: theme.colors.textMuted, fontFamily: theme.typography.regular }]}>No Records found</Text>
                  </View>
                )}
              </View>

              {/* MILK HISTORY */}
              <View style={[styles.weightSection, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <TouchableOpacity 
                  style={[styles.weightHeader, { borderBottomColor: theme.colors.border }]}
                  activeOpacity={0.7}
                  onPress={() => setMilkExpanded(!milkExpanded)}
                >
                  <View style={[styles.row, { marginBottom: 0, alignItems: 'center' }]}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.primary, marginBottom: 0, fontSize: 15, fontFamily: theme.typography.semiBold }]}>MILK HISTORY</Text>
                  </View>
                  {milkExpanded ? <ChevronUp size={20} color={theme.colors.textMuted} /> : <ChevronDown size={20} color={theme.colors.textMuted} />}
                </TouchableOpacity>
                {milkExpanded && (
                  <View style={styles.weightContent}>
                    <TouchableOpacity style={styles.addNewBtn}>
                      <Plus size={16} color="#FFF" />
                      <Text style={styles.addNewText}>Add New Record</Text>
                    </TouchableOpacity>
                    <Text style={[styles.noRecordsText, { color: theme.colors.textMuted, fontFamily: theme.typography.regular }]}>No Records found</Text>
                  </View>
                )}
              </View>

              {/* INSURANCE */}
              <View style={[styles.weightSection, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <TouchableOpacity 
                  style={[styles.weightHeader, { borderBottomColor: theme.colors.border }]}
                  activeOpacity={0.7}
                  onPress={() => setInsuranceExpanded(!insuranceExpanded)}
                >
                  <View style={[styles.row, { marginBottom: 0, alignItems: 'center' }]}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.primary, marginBottom: 0, fontSize: 15, fontFamily: theme.typography.semiBold }]}>INSURANCE</Text>
                  </View>
                  {insuranceExpanded ? <ChevronUp size={20} color={theme.colors.textMuted} /> : <ChevronDown size={20} color={theme.colors.textMuted} />}
                </TouchableOpacity>
                {insuranceExpanded && (
                  <View style={[styles.weightContent, { paddingHorizontal: 4 }]}>
                    <GInput label="Insurance Company" placeholder="Insurance Company" />
                    <GInput label="Plan Name" placeholder="Plan Name" />
                    <GInput label="Policy Number" placeholder="Policy Number" />
                    <GInput label="Agent Name" placeholder="Agent Name" />
                  </View>
                )}
              </View>
            </>
          )}

          <View style={styles.footer}>
            {isEditing ? (
              <View style={styles.buttonRow}>
                <View style={[styles.halfBtn, { marginRight: 8 }]}>
                  <GButton 
                    title="Delete" 
                    variant="outline" 
                    onPress={handleDelete}
                    loading={deleting}
                  />
                </View>
                <View style={styles.halfBtn}>
                  <GButton 
                    title="Save Changes" 
                    onPress={handleSave}
                    loading={loading}
                  />
                </View>
              </View>
            ) : (
              <GButton 
                title="Create Animal Record" 
                onPress={handleSave} 
                loading={loading}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};



export default AddAnimalScreen;
