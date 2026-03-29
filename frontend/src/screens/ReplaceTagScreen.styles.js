import { StyleSheet, Platform } from 'react-native';

export const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    minHeight: 200,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
  },
  inputWrapper: {
    flex: 1,
    marginRight: 12,
  },
  addBtn: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    height: 52, // Match GInput height
    borderRadius: 8,
    marginBottom: 0, // Align with input
  },
  btnDisabled: {
    opacity: 0.6,
  },
  plusCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  plusText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: -1,
  },
  addBtnText: {
    color: '#FFF',
    fontFamily: theme.typography.semiBold || 'Montserrat_600SemiBold',
    fontSize: 15,
  },
  animalPreview: {
    marginTop: 24,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: 20,
  },
  animalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#1A1A1A' : '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  animalIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  animalDetails: {
    flex: 1,
  },
  animalTag: {
    fontSize: 17,
    fontFamily: theme.typography.semiBold || 'Montserrat_600SemiBold',
    color: theme.colors.text,
  },
  animalSubInfo: {
    fontSize: 13,
    fontFamily: theme.typography.medium || 'Montserrat_500Medium',
    color: theme.colors.textMuted || '#94A3B8',
    marginTop: 2,
  },
  replacementSection: {
    marginTop: 8,
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  }
});
