import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileCheck,
  RotateCcw,
  ArrowRight,
  Eye,
  Check,
  ChevronRight
} from 'lucide-react-native';
import api from '../api';
import { useTranslation } from 'react-i18next';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Buffer } from 'buffer';

const BulkDataScreen = ({ navigation }) => {
  const { isDarkMode, theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);

  const [activeTab, setActiveTab] = useState('import'); // 'import' | 'export'

  // Import State
  const [selectedFile, setSelectedFile] = useState(null); // { name, size, base64, rawFile }
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null); // { success, totalRows, validCount, errorCount, errors, message }

  // Export State
  const [exportFilter, setExportFilter] = useState('ALL'); // 'ALL' | 'LIVE' | 'SOLD' | 'DEAD'
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState('');

  // 1. DOWNLOAD TEMPLATE
  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);

      const response = await api.get('/bulk/animals/template?format=base64');
      const { filename, base64, mimeType } = response.data;

      if (Platform.OS === 'web') {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'goatbook_animals_template.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const fileUri = `${FileSystem.cacheDirectory}${filename || 'goatbook_animals_template.xlsx'}`;
        await FileSystem.writeAsStringAsync(fileUri, base64, {
          encoding: FileSystem.EncodingType?.Base64 || 'base64',
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'Download Excel Template',
          });
        } else {
          Alert.alert('Downloaded', `Template saved to ${fileUri}`);
        }
      }
    } catch (err) {
      console.error('Download template error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to download template';
      Alert.alert('Error', errMsg);
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  // 2. PICK EXCEL FILE
  const handlePickFile = async () => {
    try {
      setImportResult(null);

      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx, .xls, .csv';
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target.result.split(',')[1];
            setSelectedFile({
              name: file.name,
              size: file.size,
              base64,
              rawFile: file
            });
          };
          reader.readAsDataURL(file);
        };
        input.click();
      } else {
        let DocumentPicker;
        try {
          DocumentPicker = require('expo-document-picker');
        } catch (e) {
          console.warn('DocumentPicker module not loaded:', e);
        }

        if (DocumentPicker) {
          const result = await DocumentPicker.getDocumentAsync({
            type: [
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'application/vnd.ms-excel',
              'text/csv',
              '*/*'
            ],
            copyToCacheDirectory: true,
          });

          if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            const base64 = await FileSystem.readAsStringAsync(asset.uri, {
              encoding: FileSystem.EncodingType?.Base64 || 'base64',
            });

            setSelectedFile({
              name: asset.name,
              size: asset.size,
              uri: asset.uri,
              base64,
            });
          }
        }
      }
    } catch (err) {
      console.error('File pick error:', err);
      Alert.alert('Error', 'Failed to select file.');
    }
  };

  // 3. VALIDATE FILE (DRY-RUN PREVIEW)
  const handleValidateFile = async () => {
    if (!selectedFile || !selectedFile.base64) {
      Alert.alert('Warning', 'Please select an Excel file first.');
      return;
    }

    try {
      setIsValidating(true);
      setImportResult(null);

      const response = await api.post('/bulk/animals/validate', {
        fileBase64: selectedFile.base64
      });

      setImportResult({
        ...response.data,
        isValidationOnly: true
      });
    } catch (err) {
      console.error('Validation error:', err);
      if (err.response?.data) {
        setImportResult({
          ...err.response.data,
          isValidationOnly: true
        });
      } else {
        Alert.alert('Error', err.message || 'Validation request failed');
      }
    } finally {
      setIsValidating(false);
    }
  };

  // 4. IMPORT ANIMALS TO DATABASE
  const handleImportAnimals = async () => {
    if (!selectedFile || !selectedFile.base64) {
      Alert.alert('Warning', 'Please select an Excel file first.');
      return;
    }

    try {
      setIsImporting(true);
      setImportResult(null);

      const response = await api.post('/bulk/animals/import', {
        fileBase64: selectedFile.base64
      });

      setImportResult({
        ...response.data,
        isValidationOnly: false
      });
    } catch (err) {
      console.error('Import commit error:', err);
      if (err.response?.data) {
        setImportResult({
          ...err.response.data,
          isValidationOnly: false
        });
      } else {
        Alert.alert('Error', err.message || 'Failed to import animals');
      }
    } finally {
      setIsImporting(false);
    }
  };

  // 5. EXPORT ANIMALS
  const handleExportAnimals = async () => {
    try {
      setIsExporting(true);
      setExportSuccessMsg('');

      let url = '/bulk/animals/export?format=base64';
      if (exportFilter !== 'ALL') {
        url += `&status=${exportFilter}`;
      }

      const response = await api.get(url);
      const { filename, base64, mimeType, totalExported } = response.data;

      if (totalExported === 0) {
        Alert.alert('Notice', 'No animals found matching the selected filter.');
        setIsExporting(false);
        return;
      }

      if (Platform.OS === 'web') {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename || 'goatbook_animals.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        const fileUri = `${FileSystem.cacheDirectory}${filename || 'goatbook_animals.xlsx'}`;
        await FileSystem.writeAsStringAsync(fileUri, base64, {
          encoding: FileSystem.EncodingType?.Base64 || 'base64',
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'Export Animals Data',
          });
        }
      }

      setExportSuccessMsg(`Successfully exported ${totalExported} animals to Excel.`);
    } catch (err) {
      console.error('Export animals error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to export animals';
      Alert.alert('Error', errMsg);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader
        title={t('bulk.title', 'Bulk Data Import & Export')}
        onBack={() => navigation.goBack()}
      />

      {/* Segmented Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'import' && { backgroundColor: theme.colors.primary }
          ]}
          onPress={() => {
            setActiveTab('import');
            setImportResult(null);
          }}
          activeOpacity={0.7}
        >
          <UploadCloud
            size={18}
            color={activeTab === 'import' ? '#FFFFFF' : theme.colors.textMuted}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'import' ? '#FFFFFF' : theme.colors.textMuted }
            ]}
          >
            {t('bulk.importTab', 'Bulk Import')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'export' && { backgroundColor: theme.colors.primary }
          ]}
          onPress={() => {
            setActiveTab('export');
            setExportSuccessMsg('');
          }}
          activeOpacity={0.7}
        >
          <Download
            size={18}
            color={activeTab === 'export' ? '#FFFFFF' : theme.colors.textMuted}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'export' ? '#FFFFFF' : theme.colors.textMuted }
            ]}
          >
            {t('bulk.exportTab', 'Export Data')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'import' ? (
          /* ================= IMPORT TAB CONTENT ================= */
          <View>
            {/* Step 1: Download Template */}
            <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.stepBadge, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Text style={[styles.stepBadgeText, { color: theme.colors.primary }]}>Step 1</Text>
                </View>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                  {t('bulk.step1Title', 'Download Excel Template')}
                </Text>
              </View>

              <Text style={[styles.cardDesc, { color: theme.colors.textMuted }]}>
                {t(
                  'bulk.step1Desc',
                  'Download our ready-made Excel sheet pre-configured with your farm breeds, locations, and sample data format.'
                )}
              </Text>

              <TouchableOpacity
                style={[styles.outlineButton, { borderColor: theme.colors.primary }]}
                onPress={handleDownloadTemplate}
                disabled={isDownloadingTemplate}
                activeOpacity={0.7}
              >
                {isDownloadingTemplate ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <>
                    <FileSpreadsheet size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
                    <Text style={[styles.outlineButtonText, { color: theme.colors.primary }]}>
                      {t('bulk.downloadTemplateBtn', 'Download Template (.xlsx)')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Step 2: Upload File */}
            <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.stepBadge, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Text style={[styles.stepBadgeText, { color: theme.colors.primary }]}>Step 2</Text>
                </View>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                  {t('bulk.step2Title', 'Upload Filled Excel Sheet')}
                </Text>
              </View>

              <Text style={[styles.cardDesc, { color: theme.colors.textMuted }]}>
                {t('bulk.step2Desc', 'Fill the animal details into the downloaded Excel file and select it below.')}
              </Text>

              {/* File Dropzone / Picker */}
              <TouchableOpacity
                style={[
                  styles.dropzone,
                  {
                    borderColor: selectedFile ? theme.colors.primary : theme.colors.border,
                    backgroundColor: selectedFile ? theme.colors.primary + '08' : theme.colors.background
                  }
                ]}
                onPress={handlePickFile}
                activeOpacity={0.7}
              >
                {selectedFile ? (
                  <View style={styles.selectedFileContainer}>
                    <FileCheck size={36} color={theme.colors.primary} />
                    <Text style={[styles.fileName, { color: theme.colors.text }]} numberOfLines={1}>
                      {selectedFile.name}
                    </Text>
                    {selectedFile.size ? (
                      <Text style={[styles.fileSize, { color: theme.colors.textMuted }]}>
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </Text>
                    ) : null}
                    <Text style={[styles.changeFileText, { color: theme.colors.primary }]}>
                      {t('bulk.changeFile', 'Tap to choose a different file')}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.dropzoneEmpty}>
                    <UploadCloud size={40} color={theme.colors.textMuted} />
                    <Text style={[styles.dropzoneTitle, { color: theme.colors.text }]}>
                      {t('bulk.chooseFile', 'Choose Excel File (.xlsx / .csv)')}
                    </Text>
                    <Text style={[styles.dropzoneSub, { color: theme.colors.textMuted }]}>
                      {t('bulk.tapToBrowse', 'Tap here to browse your files')}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Action Buttons */}
              {selectedFile && (
                <View style={styles.actionButtonsRow}>
                  {/* Validate Preview Button */}
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.validateBtn, { borderColor: theme.colors.primary }]}
                    onPress={handleValidateFile}
                    disabled={isValidating || isImporting}
                    activeOpacity={0.7}
                  >
                    {isValidating ? (
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : (
                      <>
                        <Eye size={18} color={theme.colors.primary} style={{ marginRight: 6 }} />
                        <Text style={[styles.validateBtnText, { color: theme.colors.primary }]}>
                          {t('bulk.verifyBtn', 'Verify / Preview')}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Commit Import Button */}
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.importBtn, { backgroundColor: theme.colors.primary }]}
                    onPress={handleImportAnimals}
                    disabled={isValidating || isImporting}
                    activeOpacity={0.7}
                  >
                    {isImporting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Check size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.importBtnText}>
                          {t('bulk.importBtn', 'Import Animals')}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Results / Error Reporting Section */}
            {importResult && (
              <View style={styles.resultContainer}>
                {importResult.success ? (
                  /* Success Card */
                  <View style={[styles.resultCard, styles.successCard]}>
                    <View style={styles.resultHeader}>
                      <CheckCircle2 size={28} color="#10B981" />
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={styles.successTitle}>
                          {importResult.isValidationOnly
                            ? t('bulk.validTitle', 'File Verification Passed!')
                            : t('bulk.successTitle', 'Import Completed Successfully!')}
                        </Text>
                        <Text style={styles.successDesc}>
                          {importResult.isValidationOnly
                            ? `${importResult.validCount} valid animal row(s) ready to import.`
                            : importResult.message || `Successfully added ${importResult.importedCount} animal(s).`}
                        </Text>
                      </View>
                    </View>

                    {!importResult.isValidationOnly && (
                      <TouchableOpacity
                        style={styles.viewListBtn}
                        onPress={() => navigation.navigate('AnimalList')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.viewListBtnText}>
                          {t('bulk.goToAnimals', 'View Animals in Inventory')}
                        </Text>
                        <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  /* Error Card */
                  <View style={[styles.resultCard, styles.errorCard]}>
                    <View style={styles.resultHeader}>
                      <XCircle size={28} color="#EF4444" />
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={styles.errorTitle}>
                          {t('bulk.errorsFoundTitle', 'Validation Failed: Issues Found in Excel')}
                        </Text>
                        <Text style={styles.errorDesc}>
                          {importResult.errorCount || (importResult.errors ? importResult.errors.length : 0)}{' '}
                          {t('bulk.errorsSub', 'error(s) need your attention. Please fix and re-upload:')}
                        </Text>
                      </View>
                    </View>

                    {/* Detailed Row-by-Row Error List */}
                    {importResult.errors && importResult.errors.length > 0 && (
                      <View style={styles.errorList}>
                        {importResult.errors.map((err, idx) => (
                          <View key={idx} style={styles.errorItem}>
                            <View style={styles.errorItemTop}>
                              <View style={styles.rowBadge}>
                                <Text style={styles.rowBadgeText}>Row {err.row}</Text>
                              </View>
                              {err.tagNumber && err.tagNumber !== '-' && (
                                <View style={styles.tagBadge}>
                                  <Text style={styles.tagBadgeText}>Tag: {err.tagNumber}</Text>
                                </View>
                              )}
                              {err.field && (
                                <Text style={styles.errorFieldText}>[{err.field}]</Text>
                              )}
                            </View>
                            <Text style={styles.errorMsgText}>{err.error}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={styles.helpBox}>
                      <AlertCircle size={16} color="#B45309" />
                      <Text style={styles.helpText}>
                        {t(
                          'bulk.helpTip',
                          'Tip: Check the "Reference & Guidelines" tab in the downloaded template for allowed values.'
                        )}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        ) : (
          /* ================= EXPORT TAB CONTENT ================= */
          <View>
            <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.cardHeader}>
                <FileSpreadsheet size={24} color={theme.colors.primary} />
                <Text style={[styles.cardTitle, { color: theme.colors.text, marginLeft: 10 }]}>
                  {t('bulk.exportAnimalsTitle', 'Export Farm Animals to Excel')}
                </Text>
              </View>

              <Text style={[styles.cardDesc, { color: theme.colors.textMuted }]}>
                {t(
                  'bulk.exportDesc',
                  'Download a comprehensive spreadsheet containing all animal details, pedigree tags, weights, and statuses.'
                )}
              </Text>

              {/* Filter Selector */}
              <Text style={[styles.filterLabel, { color: theme.colors.text }]}>
                {t('bulk.selectFilter', 'Select Status Filter:')}
              </Text>

              <View style={styles.filterChipsRow}>
                {[
                  { id: 'ALL', label: 'All Animals' },
                  { id: 'LIVE', label: 'Live Only' },
                  { id: 'SOLD', label: 'Sold Only' },
                  { id: 'DEAD', label: 'Dead Only' }
                ].map((chip) => {
                  const isSelected = exportFilter === chip.id;
                  return (
                    <TouchableOpacity
                      key={chip.id}
                      style={[
                        styles.chip,
                        isSelected
                          ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                          : { backgroundColor: theme.colors.background, borderColor: theme.colors.border }
                      ]}
                      onPress={() => setExportFilter(chip.id)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: isSelected ? '#FFFFFF' : theme.colors.text }
                        ]}
                      >
                        {chip.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Export Button */}
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleExportAnimals}
                disabled={isExporting}
                activeOpacity={0.7}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Download size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryButtonText}>
                      {t('bulk.startExportBtn', 'Download Animals Spreadsheet (.xlsx)')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {exportSuccessMsg ? (
                <View style={styles.exportSuccessBanner}>
                  <CheckCircle2 size={20} color="#10B981" />
                  <Text style={styles.exportSuccessText}>{exportSuccessMsg}</Text>
                </View>
              ) : null}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const getStyles = (theme, isDarkMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    tabContainer: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 8,
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      padding: 4,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    tabButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 10,
      gap: 8,
    },
    tabText: {
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    card: {
      borderRadius: 16,
      padding: 18,
      marginBottom: 16,
      borderWidth: 1,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    stepBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginRight: 10,
    },
    stepBadgeText: {
      fontSize: 12,
      fontFamily: 'Inter_700Bold',
      textTransform: 'uppercase',
    },
    cardTitle: {
      fontSize: 16,
      fontFamily: 'Inter_700Bold',
      flex: 1,
    },
    cardDesc: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      lineHeight: 19,
      marginBottom: 16,
    },
    outlineButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    outlineButtonText: {
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginTop: 10,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontFamily: 'Inter_600SemiBold',
    },
    dropzone: {
      borderWidth: 2,
      borderStyle: 'dashed',
      borderRadius: 14,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    dropzoneEmpty: {
      alignItems: 'center',
    },
    dropzoneTitle: {
      fontSize: 15,
      fontFamily: 'Inter_600SemiBold',
      marginTop: 10,
    },
    dropzoneSub: {
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      marginTop: 4,
    },
    selectedFileContainer: {
      alignItems: 'center',
    },
    fileName: {
      fontSize: 15,
      fontFamily: 'Inter_600SemiBold',
      marginTop: 8,
      textAlign: 'center',
    },
    fileSize: {
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      marginTop: 2,
    },
    changeFileText: {
      fontSize: 12,
      fontFamily: 'Inter_600SemiBold',
      marginTop: 10,
    },
    actionButtonsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 12,
    },
    validateBtn: {
      borderWidth: 1.5,
      backgroundColor: 'transparent',
    },
    validateBtnText: {
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
    },
    importBtn: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    importBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
    },
    resultContainer: {
      marginTop: 4,
    },
    resultCard: {
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
    },
    successCard: {
      backgroundColor: '#ECFDF5',
      borderColor: '#A7F3D0',
    },
    errorCard: {
      backgroundColor: '#FEF2F2',
      borderColor: '#FECACA',
    },
    resultHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    successTitle: {
      fontSize: 16,
      fontFamily: 'Inter_700Bold',
      color: '#065F46',
    },
    successDesc: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      color: '#047857',
      marginTop: 2,
      lineHeight: 18,
    },
    errorTitle: {
      fontSize: 15,
      fontFamily: 'Inter_700Bold',
      color: '#991B1B',
    },
    errorDesc: {
      fontSize: 13,
      fontFamily: 'Inter_500Medium',
      color: '#B91C1C',
      marginTop: 2,
    },
    errorList: {
      marginTop: 14,
      gap: 8,
    },
    errorItem: {
      backgroundColor: '#FFFFFF',
      padding: 12,
      borderRadius: 10,
      borderLeftWidth: 4,
      borderLeftColor: '#EF4444',
      borderWidth: 1,
      borderColor: '#FEE2E2',
    },
    errorItemTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
      gap: 6,
    },
    rowBadge: {
      backgroundColor: '#EF4444',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    rowBadgeText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontFamily: 'Inter_700Bold',
    },
    tagBadge: {
      backgroundColor: '#F3F4F6',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    tagBadgeText: {
      color: '#374151',
      fontSize: 11,
      fontFamily: 'Inter_600SemiBold',
    },
    errorFieldText: {
      color: '#6B7280',
      fontSize: 11,
      fontFamily: 'Inter_600SemiBold',
    },
    errorMsgText: {
      color: '#1F2937',
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      lineHeight: 18,
    },
    helpBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FEF3C7',
      padding: 10,
      borderRadius: 8,
      marginTop: 14,
      gap: 8,
    },
    helpText: {
      color: '#92400E',
      fontSize: 12,
      fontFamily: 'Inter_500Medium',
      flex: 1,
    },
    viewListBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#10B981',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      marginTop: 14,
    },
    viewListBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
    },
    filterLabel: {
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
      marginBottom: 10,
    },
    filterChipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
    },
    chipText: {
      fontSize: 13,
      fontFamily: 'Inter_500Medium',
    },
    exportSuccessBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ECFDF5',
      padding: 12,
      borderRadius: 10,
      marginTop: 14,
      gap: 8,
    },
    exportSuccessText: {
      color: '#065F46',
      fontSize: 13,
      fontFamily: 'Inter_500Medium',
    },
  });

export default BulkDataScreen;
