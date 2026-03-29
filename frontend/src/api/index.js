import axios from 'axios';
import { Platform } from 'react-native';

// Cross-platform secure storage wrapper
// expo-secure-store doesn't work on web, so we use localStorage as fallback
const storage = {
  getItem: async (key) => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    const SecureStore = require('expo-secure-store');
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key, value) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    const SecureStore = require('expo-secure-store');
    await SecureStore.setItemAsync(key, value);
  },
  deleteItem: async (key) => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    const SecureStore = require('expo-secure-store');
    await SecureStore.deleteItemAsync(key);
  }
};

// For Production: Replace with your Render URL
// For Development: Use your PC's IP address
const BASE_URL = 'https://goatbookapp.onrender.com/api'; 

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const setAuthToken = async (token) => {
  if (token) {
    await storage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    await storage.deleteItem('token');
    delete api.defaults.headers.common['Authorization'];
  }
};

export const setSelectedFarm = async (farmId) => {
  if (farmId) {
    await storage.setItem('selectedFarmId', farmId);
    api.defaults.headers.common['X-Farm-ID'] = farmId;
  } else {
    await storage.deleteItem('selectedFarmId');
    delete api.defaults.headers.common['X-Farm-ID'];
  }
};

// Interceptor to load token and farmId on startup
api.interceptors.request.use(async (config) => {
  const token = await storage.getItem('token');
  const farmId = await storage.getItem('selectedFarmId');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (farmId) config.headers['X-Farm-ID'] = farmId;
  return config;
});

export default api;
