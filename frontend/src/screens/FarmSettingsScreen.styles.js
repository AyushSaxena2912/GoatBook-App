import { StyleSheet } from 'react-native';
import { COLORS, SPACING, SHADOW, lightTheme } from '../theme';

export default StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
  },
  formCard: {
    borderRadius: 24,
    padding: SPACING.lg,
    ...lightTheme.shadow.md,
    marginBottom: SPACING.xl,
    borderWidth: 1.5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: SPACING.xl,
    letterSpacing: -0.5,
  },
  submitBtn: {
    marginTop: SPACING.md,
    height: 56,
  },
  infoBox: {
    padding: SPACING.md,
    borderRadius: 16,
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  infoText: {
    fontSize: 13,
    flex: 1,
    marginLeft: 10,
    fontWeight: '600',
    lineHeight: 18,
  }
});
