import React, { createContext, useState, useContext, useCallback } from 'react';
import api from '../api';

const FarmSettingsContext = createContext();

const KG_TO_LB = 2.20462;
const CM_TO_IN = 0.393701;

const DEFAULT_SETTINGS = {
  units: { weight: 'KG', height: 'IN' },
  animalTypes: {
    goat: { allowed: true },
    sheep: { allowed: true },
  },
};

const round1 = (n) => Math.round(n * 10) / 10;

export const FarmSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  const refreshFarmSettings = useCallback(async () => {
    try {
      const res = await api.get('/farm-settings');
      setSettings(res.data);
      setLoaded(true);
      return res.data;
    } catch (err) {
      // Not logged in yet, or no farm selected — keep defaults, no user-facing error.
      return null;
    }
  }, []);

  const weightUnit = settings.units?.weight || 'KG';
  const heightUnit = settings.units?.height || 'IN';

  // Canonical storage is always KG / CM. These only affect display + input formatting.
  const kgToDisplay = useCallback((kgValue) => {
    if (kgValue === null || kgValue === undefined || kgValue === '') return { value: kgValue, unit: weightUnit };
    const num = Number(kgValue);
    if (Number.isNaN(num)) return { value: kgValue, unit: weightUnit };
    return weightUnit === 'LB'
      ? { value: round1(num * KG_TO_LB), unit: 'LB' }
      : { value: round1(num), unit: 'KG' };
  }, [weightUnit]);

  const displayToKg = useCallback((displayValue) => {
    if (displayValue === null || displayValue === undefined || displayValue === '') return displayValue;
    const num = Number(displayValue);
    if (Number.isNaN(num)) return displayValue;
    return weightUnit === 'LB' ? round1(num / KG_TO_LB) : num;
  }, [weightUnit]);

  const cmToDisplay = useCallback((cmValue) => {
    if (cmValue === null || cmValue === undefined || cmValue === '') return { value: cmValue, unit: heightUnit };
    const num = Number(cmValue);
    if (Number.isNaN(num)) return { value: cmValue, unit: heightUnit };
    return heightUnit === 'IN'
      ? { value: round1(num * CM_TO_IN), unit: 'IN' }
      : { value: round1(num), unit: 'CM' };
  }, [heightUnit]);

  const displayToCm = useCallback((displayValue) => {
    if (displayValue === null || displayValue === undefined || displayValue === '') return displayValue;
    const num = Number(displayValue);
    if (Number.isNaN(num)) return displayValue;
    return heightUnit === 'IN' ? round1(num / CM_TO_IN) : num;
  }, [heightUnit]);

  const isAnimalTypeAllowed = useCallback((type) => {
    const key = String(type || '').toLowerCase();
    if (key === 'goat') return settings.animalTypes?.goat?.allowed !== false;
    if (key === 'sheep') return settings.animalTypes?.sheep?.allowed !== false;
    return true;
  }, [settings]);

  return (
    <FarmSettingsContext.Provider value={{
      settings,
      loaded,
      weightUnit,
      heightUnit,
      kgToDisplay,
      displayToKg,
      cmToDisplay,
      displayToCm,
      isAnimalTypeAllowed,
      refreshFarmSettings,
    }}>
      {children}
    </FarmSettingsContext.Provider>
  );
};

export const useFarmSettings = () => useContext(FarmSettingsContext);
