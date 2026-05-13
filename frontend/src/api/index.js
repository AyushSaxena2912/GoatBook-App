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

// Backend URL configuration
// Using Render backend (Production) exclusively as requested.
const BASE_URL = 'https://goatbookapp.onrender.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 150000, // Increased to 150s for Render + Neon cold starts
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

// Response interceptor to handle auth failures (like after a DB wipe)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn('AUTH: Session expired or invalid. Clearing storage.');
      await storage.deleteItem('token');
      await storage.deleteItem('selectedFarmId');
      // Note: Ideally you would navigate to Login here, but clearing storage 
      // will trigger state changes in most AuthContext implementations.
    }
    return Promise.reject(error);
  }
);

export default api;
