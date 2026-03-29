import { StyleSheet, Platform, StatusBar as RNStatusBar } from 'react-native';
import { SPACING } from '../theme';

export const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 48,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
  },
  menuButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    color: '#FFF',
    fontFamily: 'Montserrat_600SemiBold',
    flex: 1,
  },
  themeToggle: {
    padding: 8,
    marginLeft: 10,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    flex: 1,
  },
  list: {
    paddingBottom: 40,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tile: {
    backgroundColor: theme.colors.surface,
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDarkMode ? 0.3 : 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tileIcon: {
    marginBottom: 12,
  },
  tileTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontFamily: 'Montserrat_500Medium',
    textAlign: 'center',
  },
});
