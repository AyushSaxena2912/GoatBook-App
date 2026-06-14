import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './translations/en.json';
import hi from './translations/hi.json';
import mr from './translations/mr.json';
import gu from './translations/gu.json';
import bn from './translations/bn.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  mr: { translation: mr },
  gu: { translation: gu },
  bn: { translation: bn },
};

// We initialize i18n synchronously with a fallback language.
// The actual language preference from the backend will be applied dynamically
// in App.js during the checkSession phase.
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources,
    lng: 'en', // Default language before fetching from backend
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
