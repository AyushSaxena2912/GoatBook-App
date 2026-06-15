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

// Force Babel to transpile packages that use private class fields (#field syntax)
// so they work across all Hermes versions (avoids "private properties not supported" error).
config.transformIgnorePatterns = [
  'node_modules/(?!(react-native|react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|react-native-svg|react-native-vector-icons|react-native-web|react-native-worklets|@react-native|expo|@expo|@react-navigation|lucide-react-native)/)',
];

module.exports = config;
