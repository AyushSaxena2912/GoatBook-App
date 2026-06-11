import { StyleSheet, Platform, StatusBar as RNStatusBar } from 'react-native';
import { SPACING, SHADOW } from '../theme';

export const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 20,
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
    fontFamily: 'Inter_600SemiBold',
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
    width: '31.5%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: theme.colors.border,
  },
  tileIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  tileTitle: {
    fontSize: 12.5,
    color: theme.colors.text,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary + '10', // 10% opacity
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: theme.colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  modalButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  
  // Analytics Dashboard Styles
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: theme.colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  kpiScroll: {
    paddingBottom: 8,
    paddingRight: 16,
  },
  kpiCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 16,
    width: 150,
    marginRight: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  kpiIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  kpiTitle: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: theme.colors.textLight,
    flex: 1,
  },
  kpiValue: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  
  // Composition Card
  compositionCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 20,
  },
  compHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  compTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: theme.colors.text,
    marginLeft: 8,
  },
  barContainer: {
    height: 12,
    flexDirection: 'row',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: theme.colors.border,
    marginBottom: 16,
  },
  compLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '30%',
    marginBottom: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: theme.colors.textLight,
  },
  legendValue: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: theme.colors.text,
    marginLeft: 4,
  },
});
