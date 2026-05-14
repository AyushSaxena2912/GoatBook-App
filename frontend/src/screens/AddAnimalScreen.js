import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, ScrollView, Image, KeyboardAvoidingView, Platform, Alert, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { SPACING } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { getStyles } from './AddAnimalScreen.styles';
import GHeader from '../components/GHeader';
import GInput from '../components/GInput';
import GButton from '../components/GButton';
import GSelect from '../components/GSelect';
import GDatePicker from '../components/GDatePicker';
import { 
  Check, HelpCircle, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Plus, Scale, Syringe, 
  Heart, Baby, Milk, Shield, Camera, Trash2, Edit2, Calendar
} from 'lucide-react-native';
import api from '../api';
import { getFromCache } from '../utils/cache';
import { uploadToCloudinary as cloudinaryUpload } from '../utils/cloudinary';

const AddAnimalScreen = ({ navigation, route }) => {
  const { isDarkMode, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(theme, isDarkMode, insets), [theme, isDarkMode, insets]);

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
  const [photoExpanded, setPhotoExpanded] = useState(true);
  const [image, setImage] = useState(existingAnimal.imageUrl || null);
  const [uploading, setUploading] = useState(false);

  const [tagNumber, setTagNumber] = useState(existingAnimal.tagNumber || '');
  const [weights, setWeights] = useState([]);
  const [weightsLoading, setWeightsLoading] = useState(false);
  const [vaccinations, setVaccinations] = useState([]);
  const [vaccinationsLoading, setVaccinationsLoading] = useState(false);
  const [vaccinationExpanded, setVaccinationExpanded] = useState(false);
  const [matings, setMatings] = useState([]);
  const [matingsLoading, setMatingsLoading] = useState(false);
  const [breedings, setBreedings] = useState([]);
  const [breedingsLoading, setBreedingsLoading] = useState(false);
  const [breedId, setBreedId] = useState(existingAnimal.breedId || '');
  const [color, setColor] = useState(existingAnimal.color || '');
  const [gender, setGender] = useState(existingAnimal.gender || '');
  const [batchNo, setBatchNo] = useState(existingAnimal.batchNo || '');
  const [acquisitionMethod, setAcquisitionMethod] = useState(existingAnimal.acquisitionMethod || '');
  const [teethStage, setTeethStage] = useState(existingAnimal.teethStage || '');
  const [locationId, setLocationId] = useState(existingAnimal.locationId || null);
  const [animalType, setAnimalType] = useState(existingAnimal.animalType || 'Goat');
  
  const [identificationExpanded, setIdentificationExpanded] = useState(true);
  const [growthExpanded, setGrowthExpanded] = useState(true);
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
  const [purchaseWeight, setPurchaseWeight] = useState(existingAnimal.purchaseWeight?.toString() || '');
  const [landingCost, setLandingCost] = useState(existingAnimal.landingCost?.toString() || '');
  const [femaleCondition, setFemaleCondition] = useState(existingAnimal.femaleCondition || 'NONE');
  const [matingDate, setMatingDate] = useState(existingAnimal.matingDate || '');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(existingAnimal.expectedDeliveryDate || '');

  // Misc
  const [remark, setRemark] = useState(existingAnimal.remark || '');
  const [status, setStatus] = useState(existingAnimal.status || 'Live');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isReadyForSale, setIsReadyForSale] = useState(existingAnimal.isReadyForSale || false);
  const [currentWeight, setCurrentWeight] = useState(existingAnimal.currentWeight?.toString() || '');
  const [salePrice, setSalePrice] = useState(existingAnimal.salePrice?.toString() || '');
  const [deathDate, setDeathDate] = useState(existingAnimal.deathDate || '');
  const [deathReason, setDeathReason] = useState(existingAnimal.deathReason || '');
  const [soldDate, setSoldDate] = useState(existingAnimal.soldAt || '');
  const [sellingPrice, setSellingPrice] = useState(existingAnimal.salePrice?.toString() || '');
  const [soldRemark, setSoldRemark] = useState(existingAnimal.soldRemark || '');
  
  // Insurance specific (UI only for now)
  const [insuranceCompany, setInsuranceCompany] = useState('');
  const [planName, setPlanName] = useState('');
  
  // Weight Edit Modal State
  const [editWeightModalVisible, setEditWeightModalVisible] = useState(false);
  const [editingWeightRecord, setEditingWeightRecord] = useState(null);
  const [editWeightValue, setEditWeightValue] = useState('');
  const [editHeightValue, setEditHeightValue] = useState('');
  const [editDateValue, setEditDateValue] = useState('');
  const [editRemarkValue, setEditRemarkValue] = useState('');
  const [updatingWeight, setUpdatingWeight] = useState(false);
  const [deletingWeight, setDeletingWeight] = useState(false);
  const [policyNumber, setPolicyNumber] = useState('');
  const [agentName, setAgentName] = useState('');

  // UI state
  const [allBreeds, setAllBreeds] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeadHelp, setShowDeadHelp] = useState(false);
  const [showSoldHelp, setShowSoldHelp] = useState(false);

  const [showTagHelp, setShowTagHelp] = useState(false);
  const [showShedHelp, setShowShedHelp] = useState(false);
  const [helpInfo, setHelpInfo] = useState({ visible: false, title: '', content: '' });

  const showHelp = (title, content) => {
    setHelpInfo({ visible: true, title, content });
  };

  const filteredBreeds = useMemo(() => {
    if (!animalType) return [];
    return allBreeds.filter(b => b.animalType === animalType);
  }, [allBreeds, animalType]);

  useFocusEffect(
    useCallback(() => {
      fetchBreeds();
      fetchLocations();
        if (isEditing) {
          fetchWeights();
          fetchVaccinations();
          fetchMatings();
          fetchBreedings();
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
      const res = await api.get(`/weights?animalId=${existingAnimal.id}`);
      setWeights(res.data);
    } catch (err) {
      console.error('Fetch Weights Error:', err);
    } finally {
      setWeightsLoading(false);
    }
  };

  const fetchMatings = async () => {
    try {
      setMatingsLoading(true);
      const response = await api.get(`/matings/animal/${existingAnimal.id}`);
      setMatings(response.data);
    } catch (error) {
      console.error('Fetch matings error:', error);
    } finally {
      setMatingsLoading(false);
    }
  };

  const fetchBreedings = async () => {
    try {
      setBreedingsLoading(true);
      const response = await api.get(`/breedings/animal/${existingAnimal.id}`);
      setBreedings(response.data);
    } catch (error) {
      console.error('Fetch breedings error:', error);
    } finally {
      setBreedingsLoading(false);
    }
  };

  const handleOpenWeightModal = (record) => {
    setEditingWeightRecord(record);
    setEditWeightValue(record.weight?.toString() || '');
    setEditHeightValue(record.height?.toString() || '');
    setEditDateValue(record.date ? new Date(record.date).toISOString().split('T')[0] : '');
    setEditRemarkValue(record.remark || '');
    setEditWeightModalVisible(true);
  };

  const handleUpdateWeight = async () => {
    if (!editWeightValue) {
      Alert.alert('Error', 'Weight is required');
      return;
    }
    
    const parsedWeight = parseFloat(editWeightValue);
    if (parsedWeight > 9999) {
      Alert.alert('Error', 'Weight cannot exceed 9999 KG');
      return;
    }
    
    const parsedHeight = editHeightValue ? parseFloat(editHeightValue) : null;
    if (parsedHeight !== null && parsedHeight > 9999) {
      Alert.alert('Error', 'Height cannot exceed 9999');
      return;
    }

    try {
      setUpdatingWeight(true);
      await api.put(`/weights/${editingWeightRecord.id}`, {
        weight: parsedWeight,
        height: parsedHeight,
        date: editDateValue,
        remark: editRemarkValue
      });
      setEditWeightModalVisible(false);
      fetchWeights();
      Alert.alert('Success', 'Weight record updated successfully');
    } catch (err) {
      console.error('Update Weight Error:', err);
      // Prisma errors or backend errors
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to update weight record';
      Alert.alert('Error', errorMsg);
    } finally {
      setUpdatingWeight(false);
    }
  };

  const confirmDeleteWeight = () => {
    Alert.alert(
      'Delete Weight Record',
      'Are you sure you want to delete this weight record? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'DELETE', 
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingWeight(true);
              await api.delete(`/weights/${editingWeightRecord.id}`);
              setEditWeightModalVisible(false);
              fetchWeights();
              Alert.alert('Deleted', 'Weight record has been removed.');
            } catch (err) {
              console.error('Delete Weight Error:', err);
              Alert.alert('Error', 'Failed to delete weight record');
            } finally {
              setDeletingWeight(false);
            }
          }
        }
      ]
    );
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
    }
  }, [birthDate]);

  const fetchBreeds = async () => {
    try {
      const response = await api.get('/breeds');
      const mapped = response.data.map(b => ({ 
        label: `${b.name} (${b.animalType}) - ${(b.origin || 'INDIAN').toUpperCase()}`, 
        value: b.id, 
        animalType: b.animalType 
      }));
      setAllBreeds(mapped);
    } catch (error) {
      console.warn('Fetch breeds failed, trying cache...', error);
      const cached = await getFromCache('breeds');
      if (cached) {
        const mapped = cached.map(b => ({ 
          label: `${b.name} (${b.animalType}) - ${(b.origin || 'INDIAN').toUpperCase()}`, 
          value: b.id, 
          animalType: b.animalType 
        }));
        setAllBreeds(mapped);
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

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadToCloudinary = async (imageUri) => {
    if (!imageUri || imageUri.startsWith('http')) return imageUri;
    try {
      setUploading(true);
      const uploadedImageUrl = await cloudinaryUpload(imageUri);
      setUploading(false);
      return uploadedImageUrl;
    } catch (error) {
      setUploading(false);
      console.error('Upload to Cloudinary error:', error);
      Alert.alert('Upload Error', 'Failed to upload image. Please check your connection.');
      throw error;
    }
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
      let uploadedImageUrl = image;
      if (image && !image.startsWith('http')) {
        uploadedImageUrl = await uploadToCloudinary(image);
      }

      const payload = { 
        tagNumber, 
        breedId, 
        gender, 
        color,
        batchNo,
        acquisitionMethod,
        teethStage: ['BORN', 'PURCHASED'].includes(acquisitionMethod) ? (teethStage || null) : null,
        locationId,
        imageUrl: uploadedImageUrl,
        status: status,
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
        purchaseWeight: (purchaseWeight && !isNaN(parseFloat(purchaseWeight))) ? parseFloat(purchaseWeight) : null,
        landingCost: (landingCost && !isNaN(parseFloat(landingCost))) ? parseFloat(landingCost) : null,
        femaleCondition: (gender === 'FEMALE') ? femaleCondition : null,
        matingDate: femaleCondition === 'MATED' ? (isValidDate(matingDate) ? matingDate : null) : null,
        expectedDeliveryDate: femaleCondition === 'PREGNANT' ? (isValidDate(expectedDeliveryDate) ? expectedDeliveryDate : null) : null,
        remark,
        isReadyForSale,
        currentWeight: isReadyForSale ? (parseFloat(currentWeight) || null) : null,
        salePrice: isReadyForSale ? (parseFloat(salePrice) || null) : null,
        deathDate: status === 'Dead' ? deathDate : null,
        deathReason: status === 'Dead' ? deathReason : null,
        soldAt: status === 'Sold' ? soldDate : null,
        soldRemark: status === 'Sold' ? soldRemark : null,
        salePrice: status === 'Sold' ? (parseFloat(sellingPrice) || null) : (isReadyForSale ? (parseFloat(salePrice) || null) : null),
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

  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case 'live': return '#4CAF50';
      case 'sold': return '#2196F3';
      case 'dead': return '#F44336';
      default: return '#4CAF50';
    }
  };

  const sectionHeaderStyle = [
    styles.sectionTitle, 
    { 
      color: theme.colors.primary, 
      fontFamily: 'Inter_600SemiBold',
      letterSpacing: 0.5,
      fontSize: 15,
      marginBottom: 20,
      marginTop: 32,
      borderBottomWidth: 1.5,
      borderBottomColor: theme.colors.border,
      paddingBottom: 8,
      paddingHorizontal: 4,
    }
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={theme.colors.primary} translucent={true} />
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setShowStatusModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Status</Text>
            {['Live', 'Sold', 'Dead'].map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.statusOption, status === s && { backgroundColor: isDarkMode ? '#1A1A1A' : '#F9F9F9' }]}
                onPress={() => {
                  setStatus(s);
                  setShowStatusModal(false);
                }}
              >
                <Text style={{ 
                  fontSize: 16, 
                  fontFamily: status === s ? 'Inter_600SemiBold' : 'Inter_500Medium',
                  color: status === s ? theme.colors.primary : theme.colors.text
                }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Dead Record Help Modal */}
      <Modal
        visible={showDeadHelp}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeadHelp(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowDeadHelp(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>About Death Records</Text>
            <Text style={[styles.modalOptionText, { textAlign: 'left', marginBottom: 20, lineHeight: 20, opacity: 0.8 }]}>
              Marking an animal as 'Dead' helps you maintain a complete history of your livestock. 
              By recording the date and specific cause, you can better monitor health trends and improve farm management practices over time.
            </Text>
            <TouchableOpacity 
              style={[styles.statusOption, { borderBottomWidth: 0, justifyContent: 'center' }]} 
              onPress={() => setShowDeadHelp(false)}
            >
              <Text style={[styles.modalOptionText, { color: theme.colors.primary, fontFamily: 'Inter_600SemiBold' }]}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Sold Record Help Modal */}
      <Modal
        visible={showSoldHelp}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSoldHelp(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowSoldHelp(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sale Information</Text>
            <Text style={[styles.modalOptionText, { textAlign: 'left', marginBottom: 20, lineHeight: 20, opacity: 0.8 }]}>
              Use this section to finalize an animal's record once sold. 
              Tracking the exact sale date and price is vital for accurate financial reporting and analyzing your farm's profitability.
            </Text>
            <TouchableOpacity 
              style={[styles.statusOption, { borderBottomWidth: 0, justifyContent: 'center' }]} 
              onPress={() => setShowSoldHelp(false)}
            >
              <Text style={[styles.modalOptionText, { color: theme.colors.primary, fontFamily: 'Inter_600SemiBold' }]}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Tag ID Help Modal */}
      <Modal
        visible={showTagHelp}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTagHelp(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowTagHelp(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Identification Tag ID</Text>
            <Text style={[styles.modalOptionText, { textAlign: 'left', marginBottom: 20, lineHeight: 20, opacity: 0.8 }]}>
              A Tag ID is an essential identifier for every animal. It can be a simple number or a scannable barcode found on the animal's ear tag. 
              Maintaining unique IDs ensures that health, weight, and breeding records are always linked to the correct animal for accurate history tracking and farm management.
            </Text>
            <TouchableOpacity 
              style={[styles.statusOption, { borderBottomWidth: 0, justifyContent: 'center' }]} 
              onPress={() => setShowTagHelp(false)}
            >
              <Text style={[styles.modalOptionText, { color: theme.colors.primary, fontFamily: 'Inter_600SemiBold' }]}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Reusable Record Help Modal */}
      <Modal
        visible={helpInfo.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setHelpInfo({ ...helpInfo, visible: false })}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setHelpInfo({ ...helpInfo, visible: false })}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{helpInfo.title}</Text>
            <Text style={[styles.modalOptionText, { textAlign: 'left', marginBottom: 20, lineHeight: 20, opacity: 0.8 }]}>
              {helpInfo.content}
            </Text>
            <TouchableOpacity 
              style={[styles.statusOption, { borderBottomWidth: 0, justifyContent: 'center' }]} 
              onPress={() => setHelpInfo({ ...helpInfo, visible: false })}
            >
              <Text style={[styles.modalOptionText, { color: theme.colors.primary, fontFamily: 'Inter_600SemiBold' }]}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Shed Help Modal */}
      <Modal
        visible={showShedHelp}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowShedHelp(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowShedHelp(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>What is Shed Name/ No?</Text>
            <Text style={[styles.modalOptionText, { textAlign: 'left', marginBottom: 20, lineHeight: 20, opacity: 0.8 }]}>
              This is the specific area, zone, or compartment of your farm where this animal is primarily kept. 
              Assigning animals to sheds helps in tracking feed consumption, disease control, and space management.
            </Text>
            <TouchableOpacity 
              style={[styles.statusOption, { borderBottomWidth: 0, justifyContent: 'center' }]} 
              onPress={() => setShowShedHelp(false)}
            >
              <Text style={[styles.modalOptionText, { color: theme.colors.primary, fontFamily: 'Inter_600SemiBold' }]}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ChevronLeft color="#FFF" size={28} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{isEditing ? 'Edit Animal' : 'Add Animal'}</Text>
          <TouchableOpacity style={styles.statusContainer} onPress={() => setShowStatusModal(true)}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={styles.statusText}>{status.charAt(0) + status.slice(1).toLowerCase()}</Text>
            <ChevronDown color="#FFF" size={14} strokeWidth={3} style={styles.statusChevron} />
          </TouchableOpacity>
        </View>
      </View>
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={[styles.photoCard, { borderColor: theme.colors.border }]}>
            <TouchableOpacity 
              style={styles.photoHeader} 
              activeOpacity={0.7}
              onPress={() => setPhotoExpanded(!photoExpanded)}
            >
              <View style={styles.iconGroup}>
                <Text style={[styles.photoTitle, { color: theme.colors.primary, fontFamily: 'Inter_600SemiBold' }]}>Add Photo</Text>
                <Camera size={20} color={theme.colors.textMuted} style={{ marginLeft: 8 }} />
              </View>
              {photoExpanded ? <ChevronUp size={20} color={theme.colors.textMuted} /> : <ChevronDown size={20} color={theme.colors.textMuted} />}
            </TouchableOpacity>

            {photoExpanded && (
              <View style={styles.photoContent}>
                {image ? (
                  <View style={{ width: '100%', position: 'relative' }}>
                    <Image source={{ uri: image }} style={styles.imagePreview} />
                    {uploading && (
                      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', borderRadius: 12 }]}>
                        <ActivityIndicator color="#FFF" size="large" />
                      </View>
                    )}
                    <View style={styles.imageActions}>
                      <TouchableOpacity style={styles.imageActionBtn} onPress={takePhoto}>
                        <Edit2 size={18} color="#FFF" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.imageActionBtn} onPress={() => setImage(null)}>
                        <Trash2 size={18} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.row}>
                    <TouchableOpacity 
                      style={[styles.photoPlaceholder, { borderColor: theme.colors.border, flex: 1, marginRight: 8 }]}
                      onPress={takePhoto}
                    >
                      <Camera size={24} color={theme.colors.textMuted} />
                      <Text style={{ color: theme.colors.textMuted, marginTop: 4, fontSize: 12 }}>Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.photoPlaceholder, { borderColor: theme.colors.border, flex: 1 }]}
                      onPress={pickImage}
                    >
                      <Plus size={24} color={theme.colors.textMuted} />
                      <Text style={{ color: theme.colors.textMuted, marginTop: 4, fontSize: 12 }}>Import</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
          {isEditing && status === 'Live' && (
            <View style={styles.readyToSellCard}>
               <View style={styles.readyHeaderRow}>
                  <Text style={[styles.readyTitle, { color: theme.colors.error, fontFamily: 'Inter_600SemiBold' }]}>Ready to Sell</Text>
                  <HelpCircle size={18} color={theme.colors.textMuted} />
               </View>
               <View style={styles.readyOptions}>
                  <CheckBox label="No" value={!isReadyForSale} onToggle={() => setIsReadyForSale(false)} />
                  <View style={{ width: 24 }} />
                  <CheckBox label="Yes" value={isReadyForSale} onToggle={() => setIsReadyForSale(true)} />
               </View>
            </View>
          )}

          {status === 'Dead' && (
            <View style={styles.readyToSellCard}>
               <View style={styles.readyHeaderRow}>
                  <Text style={[styles.readyTitle, { color: theme.colors.primary, fontFamily: 'Inter_600SemiBold' }]}>Dead Record</Text>
                  <TouchableOpacity onPress={() => setShowDeadHelp(true)}>
                    <HelpCircle size={18} color={theme.colors.textMuted} />
                  </TouchableOpacity>
               </View>
               <View style={styles.formContainer}>
                  <GDatePicker 
                    label="Date*" 
                    value={deathDate} 
                    onDateChange={setDeathDate} 
                    containerStyle={{ marginBottom: 12 }}
                  />
                  <GInput 
                    label="Reason" 
                    placeholder="Reason" 
                    value={deathReason} 
                    onChangeText={setDeathReason} 
                  />
               </View>
            </View>
          )}

          {status === 'Sold' && (
            <View style={styles.readyToSellCard}>
               <View style={styles.readyHeaderRow}>
                  <Text style={[styles.readyTitle, { color: theme.colors.primary, fontFamily: 'Inter_600SemiBold' }]}>Sold Record</Text>
                  <TouchableOpacity onPress={() => setShowSoldHelp(true)}>
                    <HelpCircle size={18} color={theme.colors.textMuted} />
                  </TouchableOpacity>
               </View>
               <View style={styles.formContainer}>
                  <View style={styles.row}>
                    <GDatePicker 
                      label="Date*" 
                      value={soldDate} 
                      onDateChange={setSoldDate} 
                      containerStyle={{ flex: 1, marginRight: 12 }}
                    />
                    <GInput 
                      label="Sale Price (Rs.)*" 
                      placeholder="Selling Price" 
                      value={sellingPrice} 
                      onChangeText={setSellingPrice} 
                      keyboardType="numeric"
                      containerStyle={{ flex: 1 }}
                    />
                  </View>
                  <GInput 
                    label="Remark" 
                    placeholder="e.g. Healthy and active" 
                    value={soldRemark} 
                    onChangeText={setSoldRemark} 
                  />
               </View>
            </View>
          )}

          <View style={[styles.photoCard, { borderColor: theme.colors.border }]}>
            <TouchableOpacity 
              style={[styles.photoHeader, { borderBottomWidth: identificationExpanded ? 1 : 0, borderBottomColor: theme.colors.border }]} 
              activeOpacity={0.7}
              onPress={() => setIdentificationExpanded(!identificationExpanded)}
            >
              <View style={styles.iconGroup}>
                <Text style={[styles.photoTitle, { color: theme.colors.primary, fontFamily: 'Inter_600SemiBold' }]}>Identification</Text>
              </View>
              {identificationExpanded ? <ChevronUp size={20} color={theme.colors.textMuted} /> : <ChevronDown size={20} color={theme.colors.textMuted} />}
            </TouchableOpacity>

            {identificationExpanded && (
              <View style={styles.photoContent}>
                <View style={[styles.formContainer, { marginTop: 16 }]}>
                  <View style={styles.row}>
                    <GInput 
                      containerStyle={styles.halfWidth}
                      label="Tag ID" 
                      value={tagNumber} 
                      onChangeText={setTagNumber} 
                      placeholder="e.g. 777"
                      required 
                      helpAction={() => setShowTagHelp(true)}
                    />
                    <GSelect 
                      containerStyle={styles.halfWidth}
                      label="Animal Type" 
                      value={animalType} 
                      onSelect={(val) => {
                        setAnimalType(val);
                        setBreedId(''); 
                      }}
                      options={[
                        { label: 'Goat', value: 'Goat' },
                        { label: 'Sheep', value: 'Sheep' }
                      ]}
                      placeholder="Select Type"
                      required
                    />
                  </View>

                  <View style={styles.row}>
                    <GSelect 
                      containerStyle={styles.halfWidth}
                      label="Breed" 
                      value={breedId} 
                      onSelect={setBreedId}
                      options={filteredBreeds}
                      placeholder={animalType ? "Select Breed" : "Select Type First"}
                      disabled={!animalType}
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

                  <View style={styles.row}>
                    <GInput 
                      containerStyle={styles.halfWidth}
                      label="Color" 
                      value={color}
                      onChangeText={setColor}
                      placeholder="Type"
                    />
                    <GInput 
                      containerStyle={styles.halfWidth}
                      label="Batch No" 
                      value={batchNo} 
                      onChangeText={setBatchNo} 
                      placeholder="e.g. Gshs"
                    />
                  </View>

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
                      helpAction={() => setShowShedHelp(true)}
                    />
                  </View>

                  {gender === 'MALE' && (
                    <View style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      marginTop: 16, 
                      marginBottom: 8,
                      marginHorizontal: 4,
                      justifyContent: 'flex-start'
                    }}>
                      <Text style={styles.maleLabel}>Male Options:</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <CheckBox label="Breeder" value={isBreeder} onToggle={toggleBreeder} />
                        <View style={{ width: 12 }} />
                        <CheckBox label="Qurbani" value={isQurbani} onToggle={toggleQurbani} />
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* GROWTH & BACKGROUND CARD */}
          {((gender === 'FEMALE') || (acquisitionMethod === 'PURCHASED') || (acquisitionMethod === 'BORN')) && (
            <View style={[styles.photoCard, { borderColor: theme.colors.border }]}>
              <TouchableOpacity 
                style={[styles.photoHeader, { borderBottomWidth: growthExpanded ? 1 : 0, borderBottomColor: theme.colors.border }]} 
                activeOpacity={0.7}
                onPress={() => setGrowthExpanded(!growthExpanded)}
              >
                <View style={styles.iconGroup}>
                  <Text style={[styles.photoTitle, { color: theme.colors.primary, fontFamily: 'Inter_600SemiBold' }]}>Growth & Background</Text>
                </View>
                {growthExpanded ? <ChevronUp size={20} color={theme.colors.textMuted} /> : <ChevronDown size={20} color={theme.colors.textMuted} />}
              </TouchableOpacity>

              {growthExpanded && (
                <View style={styles.photoContent}>
                  <View style={[styles.formContainer, { marginTop: 16 }]}>
                    {/* Born specific fields */}
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

                    {/* AGE and BIRTH TYPE */}
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

                    {/* Teeth Stage dropdown */}
                    {(acquisitionMethod === 'BORN' || acquisitionMethod === 'PURCHASED') && (
                      <View style={styles.row}>
                        <GSelect 
                          containerStyle={styles.halfWidth}
                          label="Teeth Stage" 
                          value={teethStage} 
                          onSelect={setTeethStage}
                          options={[
                            { label: 'Boney Teeth', value: 'Boney Teeth' },
                            { label: '2 Teeth', value: '2 Teeth' },
                            { label: '4 Teeth', value: '4 Teeth' },
                            { label: '6 Teeth', value: '6 Teeth' },
                            { label: '8 Teeth', value: '8 Teeth' },
                            { label: 'More than 10 Teeth', value: 'More than 10 Teeth' }
                          ]}
                          placeholder="Select Stage"
                        />
                      </View>
                    )}

                    {/* PARENTS: Only if Born at farm */}
                    {acquisitionMethod === 'BORN' && (
                      <View style={styles.row}>
                        <GInput 
                          containerStyle={styles.halfWidth}
                          label="Mother Tag ID" 
                          value={motherTagId}
                          onChangeText={setMotherTagId}
                          placeholder="e.g. 2001"
                        />
                        <GInput 
                          containerStyle={styles.halfWidth}
                          label="Father Tag ID" 
                          value={fatherTagId}
                          onChangeText={setFatherTagId}
                          placeholder="e.g. 2002"
                        />
                      </View>
                    )}

                    {/* PURCHASE SECTION */}
                    {acquisitionMethod === 'PURCHASED' && (
                      <>
                        <View style={styles.row}>
                          <GDatePicker 
                            label="Purchase Date" 
                            value={purchaseDate} 
                            onDateChange={setPurchaseDate}
                            placeholder="Select Date"
                            required
                          />
                        </View>
                        <View style={styles.row}>
                          <GInput 
                            containerStyle={styles.halfWidth}
                            label="Purchase Price" 
                            value={purchasePrice} 
                            onChangeText={setPurchasePrice} 
                            keyboardType="number-pad"
                            placeholder="e.g. 5000"
                            required
                          />
                          <GInput 
                            containerStyle={styles.halfWidth}
                            label="Landing Cost" 
                            value={landingCost} 
                            onChangeText={setLandingCost} 
                            keyboardType="number-pad"
                            placeholder="e.g. 300"
                          />
                        </View>
                        <View style={styles.row}>
                          <GInput 
                            containerStyle={styles.halfWidth}
                            label="Purchase Wt (KG)" 
                            value={purchaseWeight} 
                            onChangeText={setPurchaseWeight} 
                            keyboardType="decimal-pad"
                            placeholder="e.g. 20.5"
                          />
                        </View>
                      </>
                    )}
                    
                  {gender === 'FEMALE' && acquisitionMethod === 'PURCHASED' && (
                    <View style={styles.row}>
                      <GSelect 
                        containerStyle={styles.halfWidth}
                        label="Female Cond." 
                        value={femaleCondition} 
                        onSelect={(val) => {
                          setFemaleCondition(val);
                          if (val === 'MATED') setExpectedDeliveryDate('');
                          if (val === 'PREGNANT') setMatingDate('');
                        }}
                        options={[
                          { label: 'Mated', value: 'MATED' },
                          { label: 'Pregnant', value: 'PREGNANT' }
                        ]}
                        placeholder="Select"
                      />
                      {femaleCondition === 'MATED' ? (
                        <GDatePicker 
                          containerStyle={styles.halfWidth}
                          label="Mating Date" 
                          value={matingDate} 
                          onDateChange={setMatingDate}
                        />
                      ) : femaleCondition === 'PREGNANT' ? (
                        <GDatePicker 
                          containerStyle={styles.halfWidth}
                          label="Delivery Due Date" 
                          value={expectedDeliveryDate} 
                          onDateChange={setExpectedDeliveryDate}
                        />
                      ) : (
                        <View style={styles.halfWidth} />
                      )}
                    </View>
                  )}

                    <GInput 
                      label="Remark" 
                      value={remark} 
                      onChangeText={setRemark} 
                      placeholder="e.g. Healthy and active"
                      multiline
                      style={{ minHeight: 80, paddingTop: 12, color: theme.colors.text }}
                    />
                  </View>
                </View>
              )}
            </View>
          )}

          {isEditing && (
            <>
              {/* WEIGHT HISTORY */}
              <View style={[styles.weightSection, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <TouchableOpacity 
                  style={[styles.weightHeader, { borderBottomWidth: weightExpanded ? 1 : 0, borderBottomColor: theme.colors.border }]}
                  activeOpacity={0.7}
                  onPress={() => setWeightExpanded(!weightExpanded)}
                >
                  <View style={[styles.row, { marginBottom: 0, alignItems: 'center' }]}>
                    <Text style={[sectionHeaderStyle, { marginBottom: 0, marginTop: 0, borderBottomWidth: 0, paddingBottom: 0 }]}>Weight History</Text>
                    <TouchableOpacity onPress={() => showHelp('What is Weight Record?', 'This section allows you to maintain weight of animal that you measure periodically. This will help you to analyze weight gain chart.')}>
                      <HelpCircle size={14} color={theme.colors.textMuted} style={{ marginLeft: 6, marginTop: -1 }} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                  {weightExpanded ? <ChevronUp size={20} color={theme.colors.textMuted} /> : <ChevronDown size={20} color={theme.colors.textMuted} />}
                </TouchableOpacity>
                
                {weightExpanded && (
                  <View style={styles.weightContent}>
                      <TouchableOpacity 
                        style={styles.addNewBtn}
                        onPress={() => navigation.navigate('AddWeight', { tagNumber: existingAnimal.tagNumber })}
                      >
                        <Plus size={14} color="#FFF" />
                        <Text style={styles.addNewText}>Add New Record</Text>
                      </TouchableOpacity>

                    {weightsLoading ? (
                      <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 20 }} />
                    ) : weights.length > 0 ? (
                      <View style={styles.weightList}>
                        {weights.map((w, idx) => (
                          <TouchableOpacity 
                            key={w.id} 
                            style={[styles.weightItem, { borderBottomColor: theme.colors.border }, idx === weights.length - 1 && { borderBottomWidth: 0 }]}
                            onPress={() => handleOpenWeightModal(w)}
                            activeOpacity={0.7}
                          >
                            <View style={[styles.weightIconBox, { backgroundColor: isDarkMode ? theme.colors.surface : '#FFF1EA' }]}>
                              <Calendar size={20} color={theme.colors.textMuted} />
                            </View>
                            <View style={styles.weightInfoBlock}>
                              <Text style={[styles.weightKg, { color: theme.colors.text }]}>{w.weight} KG</Text>
                              <Text style={[styles.weightDate, { color: theme.colors.textLight }]}>{new Date(w.date).toLocaleDateString()}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              {w.height ? (
                                <View style={[styles.heightInfoBlock, { marginRight: 12 }]}>
                                  <Text style={[styles.weightLabel, { color: theme.colors.textLight }]}>Height</Text>
                                  <Text style={[styles.weightValue, { color: theme.colors.text }]}>{w.height}</Text>
                                </View>
                              ) : null}
                              <ChevronRight size={20} color={theme.colors.textMuted} />
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : (
                      <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                        <Text style={[styles.noRecordsText, { color: theme.colors.textMuted }]}>No records found</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* VACCINATION RECORD */}
              <View style={[styles.weightSection, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <TouchableOpacity 
                  style={[styles.weightHeader, { borderBottomWidth: vaccinationExpanded ? 1 : 0, borderBottomColor: theme.colors.border }]}
                  activeOpacity={0.7}
                  onPress={() => setVaccinationExpanded(!vaccinationExpanded)}
                >
                <View style={[styles.row, { marginBottom: 0, alignItems: 'center' }]}>
                  <Text style={[sectionHeaderStyle, { marginBottom: 0, marginTop: 0, borderBottomWidth: 0, paddingBottom: 0 }]}>Vaccination Record</Text>
                  <TouchableOpacity onPress={() => showHelp('What is Vaccination Record?', 'This section allows you to maintain each vaccination given to the animal. You can specify vaccination date, vaccination name and other detail like Dr. Name or dose, etc.')}>
                    <HelpCircle size={14} color={theme.colors.textMuted} style={{ marginLeft: 6, marginTop: -1 }} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
                {vaccinationExpanded ? <ChevronUp size={20} color={theme.colors.textMuted} /> : <ChevronDown size={20} color={theme.colors.textMuted} />}
              </TouchableOpacity>
                {vaccinationExpanded && (
                  <View style={styles.weightContent}>
                    <TouchableOpacity 
                      style={styles.addNewBtn}
                      onPress={() => navigation.navigate('AddVaccination', { mode: 'single', preSelectedAnimal: existingAnimal })}
                    >
                      <Plus size={14} color="#FFF" />
                      <Text style={styles.addNewText}>Add New Record</Text>
                    </TouchableOpacity>

                    {vaccinationsLoading ? (
                      <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 20 }} />
                    ) : vaccinations.length > 0 ? (
                      <View style={styles.weightList}>
                        {vaccinations.map((v, idx) => (
                          <TouchableOpacity 
                            key={v.id} 
                            style={[styles.weightItem, { borderBottomColor: theme.colors.border }, idx === vaccinations.length - 1 && { borderBottomWidth: 0 }]}
                            onPress={() => navigation.navigate('AddVaccination', { mode: 'single', record: v })}
                          >
                            <View style={styles.weightIconBox}>
                              <Syringe size={16} color={theme.colors.textMuted} />
                            </View>
                            <View style={styles.weightInfoBlock}>
                              <Text style={[styles.weightKg, { color: theme.colors.text }]}>{v.vaccine?.name}</Text>
                              <Text style={[styles.weightDate, { color: theme.colors.textLight }]}>{new Date(v.date).toLocaleDateString()}</Text>
                            </View>
                            {v.nextDueDate && (
                              <View style={[styles.heightInfoBlock, { minWidth: 100 }]}>
                                <Text style={[styles.weightLabel, { color: theme.colors.primary, fontFamily: theme.typography.medium }]}>Due Date</Text>
                                <Text style={[styles.weightValue, { color: theme.colors.text, fontFamily: theme.typography.semiBold }]}>{new Date(v.nextDueDate).toLocaleDateString()}</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : (
                      <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                        <Text style={[styles.noRecordsText, { color: theme.colors.textMuted }]}>No records found</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>



              {/* MATING RECORD */}
              <View style={[styles.weightSection, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <TouchableOpacity 
                  style={[styles.weightHeader, { borderBottomWidth: matingExpanded ? 1 : 0, borderBottomColor: theme.colors.border }]}
                  activeOpacity={0.7}
                  onPress={() => setMatingExpanded(!matingExpanded)}
                >
                  <View style={[styles.row, { marginBottom: 0, alignItems: 'center' }]}>
                    <Text style={[sectionHeaderStyle, { marginBottom: 0, marginTop: 0, borderBottomWidth: 0, paddingBottom: 0 }]}>Mating Record</Text>
                    <TouchableOpacity onPress={() => showHelp('What is Mating Record?', 'This section allows you to maintain mating details of animal. This will help you to analyze when goat expected to become pregnant and delivered kids.')}>
                      <HelpCircle size={14} color={theme.colors.textMuted} style={{ marginLeft: 6, marginTop: -1 }} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                  {matingExpanded ? <ChevronUp size={20} color={theme.colors.textMuted} /> : <ChevronDown size={20} color={theme.colors.textMuted} />}
                </TouchableOpacity>
                  {matingExpanded && (
                    <View style={styles.weightContent}>
                      <TouchableOpacity 
                        style={styles.addNewBtn}
                        onPress={() => navigation.navigate('MatingList', { prefillTag: existingAnimal.tag_number, autoOpenAdd: true, timestamp: Date.now() })}
                      >
                        <Plus size={14} color="#FFF" />
                        <Text style={styles.addNewText}>Manage Matings</Text>
                      </TouchableOpacity>
                      
                      {matingsLoading ? (
                        <ActivityIndicator color={theme.colors.primary} />
                      ) : matings.length > 0 ? (
                        <View style={styles.weightList}>
                          {matings.map((m, idx) => (
                            <View 
                              key={m.id} 
                              style={[styles.weightItem, { borderBottomColor: theme.colors.border }, idx === matings.length - 1 && { borderBottomWidth: 0 }]}
                            >
                              <View style={styles.weightIconBox}>
                                <Heart size={16} color={theme.colors.primary} />
                              </View>
                              <View style={styles.weightInfoBlock}>
                                <Text style={[styles.weightKg, { color: theme.colors.text }]}>{m.mating_type}</Text>
                                <Text style={[styles.weightDate, { color: theme.colors.textLight }]}>{new Date(m.mating_date).toLocaleDateString()}</Text>
                              </View>
                              <View style={[styles.heightInfoBlock, { minWidth: 100 }]}>
                                <Text style={[styles.weightLabel, { color: theme.colors.primary, fontFamily: theme.typography.medium }]}>Status</Text>
                                <Text style={[styles.weightValue, { color: theme.colors.text, fontFamily: theme.typography.semiBold }]}>{m.status}</Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                          <Text style={[styles.noRecordsText, { color: theme.colors.textMuted }]}>No records found</Text>
                        </View>
                      )}
                    </View>
                  )}
              </View>

              {/* BREEDING/DELIVERY */}
              <View style={[styles.weightSection, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <TouchableOpacity 
                  style={[styles.weightHeader, { borderBottomWidth: breedingExpanded ? 1 : 0, borderBottomColor: theme.colors.border }]}
                  activeOpacity={0.7}
                  onPress={() => setBreedingExpanded(!breedingExpanded)}
                >
                  <View style={[styles.row, { marginBottom: 0, alignItems: 'center' }]}>
                    <Text style={[sectionHeaderStyle, { marginBottom: 0, marginTop: 0, borderBottomWidth: 0, paddingBottom: 0 }]}>Breeding/Delivery Record</Text>
                    <TouchableOpacity onPress={() => showHelp('What Is Breeding Record?', 'This section allow you to maintain each breeding record of individual goat.You can specify delivery date, birth type and also provid temporary tag id to the litters/kids and other detail like gender, birth weight, etc.')}>
                      <HelpCircle size={14} color={theme.colors.textMuted} style={{ marginLeft: 6, marginTop: -1 }} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                  {breedingExpanded ? <ChevronUp size={20} color={theme.colors.textMuted} /> : <ChevronDown size={20} color={theme.colors.textMuted} />}
                </TouchableOpacity>
                  {breedingExpanded && (
                    <View style={styles.weightContent}>
                      <TouchableOpacity 
                        style={styles.addNewBtn}
                        onPress={() => navigation.navigate('BreedingList', { prefillTag: existingAnimal.tag_number, autoOpenAdd: true, timestamp: Date.now() })}
                      >
                        <Plus size={14} color="#FFF" />
                        <Text style={styles.addNewText}>Manage Breedings</Text>
                      </TouchableOpacity>
                      
                      {breedingsLoading ? (
                        <ActivityIndicator color={theme.colors.primary} />
                      ) : breedings.length > 0 ? (
                        <View style={styles.weightList}>
                          {breedings.map((b, idx) => (
                            <View 
                              key={b.id} 
                              style={[styles.weightItem, { borderBottomColor: theme.colors.border }, idx === breedings.length - 1 && { borderBottomWidth: 0 }]}
                            >
                              <View style={styles.weightIconBox}>
                                <Baby size={16} color={theme.colors.primary} />
                              </View>
                              <View style={styles.weightInfoBlock}>
                                <Text style={[styles.weightKg, { color: theme.colors.text }]}>{b.birth_type}</Text>
                                <Text style={[styles.weightDate, { color: theme.colors.textLight }]}>{new Date(b.delivery_date).toLocaleDateString()}</Text>
                              </View>
                              <View style={[styles.heightInfoBlock, { minWidth: 100 }]}>
                                <Text style={[styles.weightLabel, { color: theme.colors.primary, fontFamily: theme.typography.medium }]}>Male/Female</Text>
                                <Text style={[styles.weightValue, { color: theme.colors.text, fontFamily: theme.typography.semiBold }]}>{b.num_male} / {b.num_female}</Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                          <Text style={[styles.noRecordsText, { color: theme.colors.textMuted }]}>No records found</Text>
                        </View>
                      )}
                    </View>
                  )}
              </View>

              {/* MILK HISTORY */}
              <View style={[styles.weightSection, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <TouchableOpacity 
                  style={[styles.weightHeader, { borderBottomWidth: milkExpanded ? 1 : 0, borderBottomColor: theme.colors.border }]}
                  activeOpacity={0.7}
                  onPress={() => setMilkExpanded(!milkExpanded)}
                >
                  <View style={[styles.row, { marginBottom: 0, alignItems: 'center' }]}>
                    <Text style={[sectionHeaderStyle, { marginBottom: 0, marginTop: 0, borderBottomWidth: 0, paddingBottom: 0 }]}>Milk History</Text>
                    <TouchableOpacity onPress={() => showHelp('What is Milk History?', 'Track daily or periodic milk production of your female goats. This helps in identifying high-yielding animals and monitoring lactation cycles.')}>
                      <HelpCircle size={14} color={theme.colors.textMuted} style={{ marginLeft: 6, marginTop: -1 }} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                  {milkExpanded ? <ChevronUp size={20} color={theme.colors.textMuted} /> : <ChevronDown size={20} color={theme.colors.textMuted} />}
                </TouchableOpacity>
                  {milkExpanded && (
                    <View style={styles.weightContent}>
                      <TouchableOpacity 
                        style={styles.addNewBtn}
                        onPress={() => {}}
                      >
                        <Plus size={14} color="#FFF" />
                        <Text style={styles.addNewText}>Add New Record</Text>
                      </TouchableOpacity>
                      <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                        <Text style={[styles.noRecordsText, { color: theme.colors.textMuted }]}>No records found</Text>
                      </View>
                    </View>
                  )}
              </View>

              {/* COMPLETELY REBUILT INSURANCE CARD - FIXED AND LOCKED LAYOUT */}
              <View style={{ 
                borderRadius: 16, 
                borderWidth: 1.5, 
                borderColor: theme.colors.border, 
                backgroundColor: theme.colors.surface, 
                marginBottom: 12, 
                overflow: 'hidden' 
              }}>
                <TouchableOpacity 
                  style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderBottomWidth: insuranceExpanded ? 1 : 0, 
                    borderBottomColor: theme.colors.border
                  }} 
                  activeOpacity={0.7}
                  onPress={() => setInsuranceExpanded(!insuranceExpanded)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Text style={{ 
                      fontSize: 15, 
                      color: theme.colors.primary, 
                      fontFamily: 'Inter_600SemiBold'
                    }}>Insurance</Text>
                    <TouchableOpacity 
                      onPress={() => showHelp('What is Insurance?', 'Store insurance details for your livestock, including company name, policy number, and coverage period, ensuring your farm assets are well-protected.')}
                      style={{ marginLeft: 8 }}
                    >
                      <HelpCircle size={14} color={theme.colors.textMuted} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                  {insuranceExpanded ? <ChevronUp size={20} color={theme.colors.textMuted} /> : <ChevronDown size={20} color={theme.colors.textMuted} />}
                </TouchableOpacity>

                {insuranceExpanded && (
                  <View style={{ padding: 12, paddingTop: 16 }}>
                    <View style={styles.formContainer}>
                      <View style={styles.row}>
                        <GInput 
                          containerStyle={styles.halfWidth}
                          label="Insurance Company" 
                          placeholder="Company Name" 
                          value={insuranceCompany}
                          onChangeText={setInsuranceCompany}
                        />
                        <GInput 
                          containerStyle={styles.halfWidth}
                          label="Plan Name" 
                          placeholder="Plan Name" 
                          value={planName}
                          onChangeText={setPlanName}
                        />
                      </View>
                      <View style={styles.row}>
                        <GInput 
                          containerStyle={styles.halfWidth}
                          label="Policy Number" 
                          placeholder="Policy No" 
                          value={policyNumber}
                          onChangeText={setPolicyNumber}
                        />
                        <GInput 
                          containerStyle={styles.halfWidth}
                          label="Agent Name" 
                          placeholder="Agent Name" 
                          value={agentName}
                          onChangeText={setAgentName}
                        />
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: insets.bottom || 16 }]}>
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

      {/* EDIT WEIGHT MODAL */}
      <Modal
        visible={editWeightModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditWeightModalVisible(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setEditWeightModalVisible(false)}
        >
          <View style={{ 
            width: '90%', 
            backgroundColor: theme.colors.surface, 
            borderRadius: 16, 
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: theme.colors.border
          }}>
            <View style={{ backgroundColor: theme.colors.primary, padding: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontFamily: theme.typography.semiBold, color: '#FFF' }}>Edit Weight</Text>
            </View>

            <View style={{ padding: 20 }}>
              <View style={{ marginBottom: 12 }}>
                <GDatePicker
                  label="Date*"
                  value={editDateValue}
                  onDateChange={setEditDateValue}
                  required
                />
              </View>

              <View style={{ marginBottom: 12 }}>
                <GInput
                  label="Weight*"
                  value={editWeightValue}
                  onChangeText={setEditWeightValue}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 55"
                  required
                />
              </View>

              <View style={{ marginBottom: 12 }}>
                <GInput
                  label="Height"
                  value={editHeightValue}
                  onChangeText={setEditHeightValue}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 5"
                />
              </View>

              <View style={{ marginBottom: 20 }}>
                <GInput
                  label="Remark"
                  value={editRemarkValue}
                  onChangeText={setEditRemarkValue}
                  placeholder="e.g. Healthy"
                  multiline
                />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity 
                  disabled={deletingWeight || updatingWeight}
                  onPress={confirmDeleteWeight}
                  style={{ 
                    flex: 1, 
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    borderColor: theme.colors.primary, 
                    paddingVertical: 14, 
                    borderRadius: 10, 
                    marginRight: 8, 
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {deletingWeight ? (
                    <ActivityIndicator color={theme.colors.primary} size="small" />
                  ) : (
                    <Text style={{ color: theme.colors.primary, fontSize: 16, fontFamily: theme.typography.semiBold }}>Delete</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  disabled={deletingWeight || updatingWeight}
                  onPress={handleUpdateWeight}
                  style={{ 
                    flex: 1, 
                    backgroundColor: theme.colors.primary, 
                    paddingVertical: 14, 
                    borderRadius: 10, 
                    marginLeft: 8, 
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {updatingWeight ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={{ color: '#FFF', fontSize: 16, fontFamily: theme.typography.semiBold }}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default AddAnimalScreen;
