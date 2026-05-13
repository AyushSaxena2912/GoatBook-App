const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Override getPolyfills to handle the removal of rn-get-polyfills in RN 0.81+
if (config.serializer && typeof config.serializer.getPolyfills === 'function') {
  const originalGetPolyfills = config.serializer.getPolyfills;
  config.serializer.getPolyfills = (options) => {
    try {
      return originalGetPolyfills(options);
    } catch (e) {
      if (e.message && e.message.includes('react-native/rn-get-polyfills')) {
        // Return an empty array or a minimal set of polyfills if the module is missing.
        // Modern React Native versions handle many polyfills internally or through separate packages.
        console.warn('⚠️  react-native/rn-get-polyfills not found. Using fallback empty polyfills.');
        return [];
      }
      throw e;
    }
  };
}

module.exports = config;
