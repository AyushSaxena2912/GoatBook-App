import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import GHeader from '../components/GHeader';
import GAlert from '../components/GAlert';
import FormulationForm from '../components/FormulationForm';
import { getFormulation, createFormulation, updateFormulation } from '../api/feedFormulationService';

const AddFormulationScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const id = route.params?.id || route.params?.formulationId;
  const isEdit = !!id;

  const [formulation, setFormulation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info' });

  const showAlert = (title, message, type = 'info') => setAlertConfig({ visible: true, title, message, type });
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  useEffect(() => {
    if (isEdit) {
      fetchDetail();
    }
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await getFormulation(id);
      setFormulation(res.data);
    } catch (err) {
      console.warn('Failed to fetch formulation details:', err);
      showAlert('Error', 'Failed to load formulation data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      setSubmitting(true);
      if (isEdit) {
        await updateFormulation(id, data);
        showAlert(
          t('common.success', 'Success'),
          t('feedFormulation.updateSuccess', 'Formulation updated successfully.'),
          'success'
        );
        setTimeout(() => {
          navigation.navigate('FormulationDetail', { id });
        }, 1500);
      } else {
        await createFormulation(data);
        showAlert(
          t('common.success', 'Success'),
          t('feedFormulation.createSuccess', 'Formulation created successfully.'),
          'success'
        );
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Operation failed.';
      showAlert(t('feedFormulation.submitError', 'Validation Error'), errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={hideAlert}
      />

      <GHeader
        title={isEdit ? t('feedFormulation.editFormulation', 'Edit Formulation') : t('feedFormulation.addFormulation', 'Create Formulation')}
        onBack={() => navigation.goBack()}
        leftAlign={true}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FormulationForm
          initialData={formulation}
          onSubmit={handleFormSubmit}
          loading={submitting}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AddFormulationScreen;
