import { StyleSheet, Platform, StatusBar as RNStatusBar } from 'react-native';
import { SPACING } from '../theme';

export const getStyles = (theme, isDarkMode, insets) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: Platform.OS === 'ios' ? insets.top : (RNStatusBar.currentHeight || insets.top || 24),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    minHeight: 50,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#FFF',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
    paddingBottom: 140,
  },

  // ─── Section Card ─────────────────────────────────────────
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sectionHeaderBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: isDarkMode ? 'rgba(255,140,0,0.15)' : '#FEF2E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: theme.colors.primary,
    letterSpacing: 0.3,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },

  // ─── Form Layout ──────────────────────────────────────────
  formContainer: {
    marginTop: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  halfWidth: {
    flex: 1,
    marginHorizontal: 4,
  },
  fullWidthField: {
    marginBottom: 14,
    marginHorizontal: 4,
  },

  // ─── Footer ───────────────────────────────────────────────
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...theme.shadow.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfBtn: {
    width: '48%',
  },

  // ─── Male options ─────────────────────────────────────────
  maleLabel: {
    fontSize: 14,
    color: theme.colors.text,
    fontFamily: 'Inter_600SemiBold',
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
    fontFamily: 'Inter_500Medium',
    color: theme.colors.text,
  },

  // ─── Header status pill ───────────────────────────────────
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  statusChevron: {
    marginLeft: 4,
  },

  // ─── Record sections (weight, vaccination etc.) ───────────
  weightSection: {
    // uses sectionCard now
  },
  weightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  weightContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'stretch',
  },
  addNewBtn: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  addNewText: {
    color: '#FFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    marginLeft: 6,
  },
  noRecordsText: {
    color: theme.colors.textMuted,
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
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
    width: 36,
    height: 36,
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
    fontFamily: 'Inter_600SemiBold',
    color: theme.colors.text,
  },
  weightDate: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: theme.colors.textLight,
    marginTop: 2,
  },
  heightInfoBlock: {
    alignItems: 'flex-end',
  },
  weightLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: theme.colors.textLight,
  },
  weightValue: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: theme.colors.text,
  },

  // ─── Misc/Divider ─────────────────────────────────────────
  sectionDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 16,
  },

  // ─── Ready to sell / Dead / Sold ──────────────────────────
  readyToSellCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginBottom: 12,
  },
  readyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  readyTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.3,
  },
  readyOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  // ─── Photo card ───────────────────────────────────────────
  photoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  photoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  photoTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.3,
  },
  photoContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: isDarkMode ? '#1A1A1A' : '#F9FAFB',
  },
  photoPlaceholder: {
    flex: 1,
    height: 80,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#1A1A1A' : '#F9FAFB',
  },
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageActions: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  imageActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  // ─── Modals ───────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  modalOptionText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: theme.colors.text,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  readyForSaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  readyLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: theme.colors.primary,
  },
});
