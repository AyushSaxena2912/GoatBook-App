import { StyleSheet } from 'react-native';
import { SPACING } from '../theme';

export const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    flexGrow: 1,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    color: theme.colors.primary,
    marginBottom: SPACING.md,
  },
  formContainer: {
    marginTop: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  halfWidth: {
    flex: 1,
    marginHorizontal: 4,
  },
  footer: {
    marginTop: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfBtn: {
    width: '48%',
  },
  maleLabel: {
    fontSize: 14,
    color: theme.colors.text,
    fontFamily: 'Montserrat_600SemiBold',
    marginRight: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 6,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
    color: theme.colors.text,
  },
  weightSection: {
    marginTop: SPACING.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  weightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  weightContent: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  addNewBtn: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: 'flex-end',
    marginBottom: SPACING.md,
  },
  addNewText: {
    color: '#FFF',
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
    marginLeft: 6,
  },
  noRecordsText: {
    color: theme.colors.textMuted,
    fontFamily: 'Montserrat_500Medium',
    fontSize: 13,
    marginTop: 20,
    marginBottom: 20,
  },
  weightList: {
    width: '100%',
  },
  weightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  weightIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: isDarkMode ? '#1A1A1A' : '#FEF2E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  weightInfoBlock: {
    flex: 1,
  },
  weightKg: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: theme.colors.text,
  },
  weightDate: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    color: theme.colors.textLight,
  },
  heightInfoBlock: {
    alignItems: 'flex-end',
  },
  weightLabel: {
    fontSize: 10,
    fontFamily: 'Montserrat_600SemiBold',
    color: theme.colors.textLight,
  },
  weightValue: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    color: theme.colors.text,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 16,
  },
  readyForSaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  readyLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: theme.colors.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: theme.colors.text,
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    textTransform: 'uppercase',
  },
  readyToSellCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    marginBottom: 12,
  },
  readyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  readyTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: 1,
  },
  readyOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});
