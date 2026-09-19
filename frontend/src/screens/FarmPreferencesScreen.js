import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, ActivityIndicator, StyleSheet, Platform, TouchableOpacity, Alert, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING, SHADOW } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { useFarmSettings } from '../context/FarmSettingsContext';
import GHeader from '../components/GHeader';
import GButton from '../components/GButton';
import GSelect from '../components/GSelect';
import { ChevronDown, ChevronUp, Check, HelpCircle } from 'lucide-react-native';
import api from '../api';
import { useTranslation } from 'react-i18next';

const WEIGHT_UNITS = [
  { label: 'Kilogram (KG)', value: 'KG' },
  { label: 'Pound (LB)', value: 'LB' },
];
const HEIGHT_UNITS = [
  { label: 'Inch (IN)', value: 'IN' },
  { label: 'Centimeter (CM)', value: 'CM' },
];

const DEFAULT_TYPE_CONFIG = {
  allowed: true,
  gestationPeriodDays: '150',
  femaleKidEmptyMonths: '7',
  adultFemaleEmptyMonths: '5',
};

const toEditable = (type) => ({
  allowed: type?.allowed ?? true,
  gestationPeriodDays: String(type?.gestationPeriodDays ?? 150),
  femaleKidEmptyMonths: String(type?.femaleKidEmptyMonths ?? 7),
  adultFemaleEmptyMonths: String(type?.adultFemaleEmptyMonths ?? 5),
});

const FarmPreferencesScreen = ({ navigation }) => {
  const { isDarkMode, theme } = useTheme();
  const { refreshFarmSettings } = useFarmSettings();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);

  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const [unitsOpen, setUnitsOpen] = useState(true);
  const [animalsOpen, setAnimalsOpen] = useState(true);
  const [expandedType, setExpandedType] = useState(null);

  const [weightUnit, setWeightUnit] = useState('KG');
  const [heightUnit, setHeightUnit] = useState('IN');
  const [goat, setGoat] = useState(DEFAULT_TYPE_CONFIG);
  const [sheep, setSheep] = useState(DEFAULT_TYPE_CONFIG);
  const [helpModal, setHelpModal] = useState({ visible: false, title: '', message: '' });

  const fetchSettings = async () => {
    try {
      setFetching(true);
      const [settingsRes, profileRes] = await Promise.all([
        api.get('/farm-settings'),
        api.get('/users/profile'),
      ]);

      const data = settingsRes.data;
      setWeightUnit(data.units?.weight || 'KG');
      setHeightUnit(data.units?.height || 'IN');
      setGoat(toEditable(data.animalTypes?.goat));
      setSheep(toEditable(data.animalTypes?.sheep));

      const role = profileRes.data?.employeeProfile?.employeeType;
      setIsOwner(role === 'OWNER');
    } catch (error) {
      console.error('Fetch farm settings error:', error);
      Alert.alert('Error', 'Failed to load farm settings');
    } finally {
      setFetching(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSettings();
    }, [])
  );

  const toggleType = (type, setType) => {
    setType({ ...type, allowed: !type.allowed });
  };

  const updateTypeField = (setType) => (field, value) => {
    setType((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!goat.allowed && !sheep.allowed) {
      Alert.alert('Validation', 'At least one animal type must remain allowed.');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        units: { weight: weightUnit, height: heightUnit },
        animalTypes: {
          goat: {
            allowed: goat.allowed,
            gestationPeriodDays: parseInt(goat.gestationPeriodDays, 10) || 150,
            femaleKidEmptyMonths: parseInt(goat.femaleKidEmptyMonths, 10) || 0,
            adultFemaleEmptyMonths: parseInt(goat.adultFemaleEmptyMonths, 10) || 0,
          },
          sheep: {
            allowed: sheep.allowed,
            gestationPeriodDays: parseInt(sheep.gestationPeriodDays, 10) || 150,
            femaleKidEmptyMonths: parseInt(sheep.femaleKidEmptyMonths, 10) || 0,
            adultFemaleEmptyMonths: parseInt(sheep.adultFemaleEmptyMonths, 10) || 0,
          },
        },
      };
      await api.put('/farm-settings', payload);
      await refreshFarmSettings();
      Alert.alert('Success', 'Farm settings updated successfully');
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update farm settings';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const showHelp = (title, message) => setHelpModal({ visible: true, title, message });
  const closeHelp = () => setHelpModal({ visible: false, title: '', message: '' });

  if (fetching) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const renderSettingRow = (label, value, onChangeText, suffix, help) => (
    <View style={styles.settingRow}>
      <View style={styles.settingRowLabelWrap}>
        <Text style={styles.settingRowLabel}>{label}</Text>
        {help && (
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={help}
          >
            <HelpCircle size={14} color={theme.colors.textLight} style={{ marginLeft: 5 }} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.settingRowInputRow}>
        <TextInput
          style={styles.settingRowInput}
          value={value}
          onChangeText={(v) => onChangeText(v.replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
          maxLength={4}
          placeholderTextColor={theme.colors.textMuted}
        />
        <Text style={styles.settingRowSuffix}>{suffix}</Text>
      </View>
    </View>
  );

  const renderAnimalTypeRow = (key, label, config, setConfig) => {
    const isExpanded = expandedType === key;
    return (
      <View key={key} style={styles.typeBlock}>
        <TouchableOpacity
          style={styles.typeRow}
          activeOpacity={0.7}
          onPress={() => setExpandedType(isExpanded ? null : key)}
        >
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => toggleType(config, setConfig)}
            style={[
              styles.checkbox,
              config.allowed
                ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                : { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }
            ]}
          >
            {config.allowed && <Check size={14} color="#fff" strokeWidth={3} />}
          </TouchableOpacity>
          <Text style={styles.typeLabel}>{label}</Text>
          {isExpanded ? (
            <ChevronUp size={20} color={theme.colors.textLight} />
          ) : (
            <ChevronDown size={20} color={theme.colors.textLight} />
          )}
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.typeDetails}>
            {renderSettingRow(
              'Gestation Period',
              config.gestationPeriodDays,
              (v) => updateTypeField(setConfig)('gestationPeriodDays', v),
              'Days',
              () => showHelp('Gestation Period', 'Average number of days from mating to delivery for this animal type. Used to suggest an expected delivery date.')
            )}

            <View style={styles.subHeaderRow}>
              <Text style={styles.subHeader}>Female Condition</Text>
              <TouchableOpacity
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => showHelp('Female Condition (Empty / Not Pregnant Period)', 'Controls the minimum rest period the app enforces before a female can be recorded as delivering again.')}
              >
                <HelpCircle size={14} color={theme.colors.textLight} style={{ marginLeft: 5 }} />
              </TouchableOpacity>
            </View>

            {renderSettingRow(
              'Female Kid Empty',
              config.femaleKidEmptyMonths,
              (v) => updateTypeField(setConfig)('femaleKidEmptyMonths', v),
              'Months age after birth'
            )}
            {renderSettingRow(
              'Adult Female Empty',
              config.adultFemaleEmptyMonths,
              (v) => updateTypeField(setConfig)('adultFemaleEmptyMonths', v),
              'Months after breeding',
              () => showHelp('Adult Female Empty', 'Minimum gap (in months) the app requires between two delivery records for the same female.')
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <GHeader title={t('settings.farmPreferencesTitle', 'Farm Settings')} onBack={() => navigation.goBack()} leftAlign />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Unit of Measurement */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.cardHeader} activeOpacity={0.7} onPress={() => setUnitsOpen(!unitsOpen)}>
            <Text style={styles.cardTitle}>Unit Of Measurement</Text>
            {unitsOpen ? (
              <ChevronUp size={20} color={theme.colors.textLight} />
            ) : (
              <ChevronDown size={20} color={theme.colors.textLight} />
            )}
          </TouchableOpacity>

          {unitsOpen && (
            <View style={styles.cardBody}>
              <GSelect
                label="Weight"
                value={weightUnit}
                onSelect={setWeightUnit}
                options={WEIGHT_UNITS}
                disabled={!isOwner}
                helpAction={() => showHelp('Weight Unit', 'Unit used across the app when displaying animal weights.')}
              />
              <View style={styles.gap} />
              <GSelect
                label="Height"
                value={heightUnit}
                onSelect={setHeightUnit}
                options={HEIGHT_UNITS}
                disabled={!isOwner}
                helpAction={() => showHelp('Height Unit', 'Unit used when recording animal height/length.')}
              />
            </View>
          )}
        </View>

        {/* Animals Allowed */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.cardHeader} activeOpacity={0.7} onPress={() => setAnimalsOpen(!animalsOpen)}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>Animals Allowed</Text>
              <TouchableOpacity
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => showHelp('Animals Allowed', 'GoatBook currently supports Goat and Sheep. Uncheck a type to hide it from farm-level reporting; tap a row to configure its breeding settings.')}
              >
                <HelpCircle size={15} color={theme.colors.textLight} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
            {animalsOpen ? (
              <ChevronUp size={20} color={theme.colors.textLight} />
            ) : (
              <ChevronDown size={20} color={theme.colors.textLight} />
            )}
          </TouchableOpacity>

          {animalsOpen && (
            <View style={styles.cardBody}>
              {renderAnimalTypeRow('goat', 'Goat', goat, setGoat)}
              {renderAnimalTypeRow('sheep', 'Sheep', sheep, setSheep)}
            </View>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {isOwner && (
        <View style={[styles.footerContainer, { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 10 : 20 }]}>
          <GButton
            title={t('common.save', 'Save')}
            onPress={handleSave}
            loading={saving}
          />
        </View>
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={helpModal.visible}
        onRequestClose={closeHelp}
      >
        <TouchableOpacity style={styles.helpOverlay} activeOpacity={1} onPress={closeHelp}>
          <TouchableOpacity activeOpacity={1} style={styles.helpContent}>
            <View style={styles.helpIconContainer}>
              <HelpCircle color={theme.colors.primary} size={32} strokeWidth={1.5} />
            </View>
            <Text style={styles.helpTitle}>{helpModal.title}</Text>
            <Text style={styles.helpMessage}>{helpModal.message}</Text>
            <TouchableOpacity style={styles.helpButton} onPress={closeHelp}>
              <Text style={styles.helpButtonText}>{t('common.gotIt', 'Got it')}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: theme.colors.primary,
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 16,
  },
  gap: {
    height: 4,
  },
  typeBlock: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  typeLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: theme.colors.text,
  },
  typeDetails: {
    paddingBottom: 8,
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  subHeader: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  settingRowLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  settingRowLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: theme.colors.text,
  },
  settingRowInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingRowInput: {
    width: 60,
    height: 38,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: theme.colors.text,
    marginRight: 8,
  },
  settingRowSuffix: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: theme.colors.textLight,
    flexShrink: 1,
  },
  footerContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...SHADOW.lg,
  },

  // Help Modal
  helpOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  helpContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  helpIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  helpTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  helpMessage: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  helpButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  helpButtonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});

export default FarmPreferencesScreen;
