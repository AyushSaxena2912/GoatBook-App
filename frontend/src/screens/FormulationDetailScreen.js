import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react-native';
import GHeader from '../components/GHeader';
import GAlert from '../components/GAlert';
import GConfirmModal from '../components/GConfirmModal';
import FormulationDetail from '../components/FormulationDetail';
import { getFormulation, deleteFormulation } from '../api/feedFormulationService';

const FormulationDetailScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { id } = route.params;

  const [formulation, setFormulation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info' });

  const showAlert = (title, message, type = 'info') => setAlertConfig({ visible: true, title, message, type });
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await getFormulation(id);
      setFormulation(res.data);
    } catch (err) {
      console.warn('Failed to fetch formulation detail:', err);
      showAlert('Error', 'Failed to load formulation details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteFormulation(id);
      setIsDeleteModalVisible(false);
      showAlert(
        t('common.success', 'Success'),
        t('feedFormulation.deleteSuccess', 'Formulation deleted successfully.'),
        'success'
      );
      setTimeout(() => {
        navigation.navigate('FormulationList');
      }, 1500);
    } catch (err) {
      console.warn('Failed to delete formulation:', err);
      showAlert('Error', 'Failed to delete formulation.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={hideAlert}
      />

      <GConfirmModal
        visible={isDeleteModalVisible}
        title={t('feedFormulation.confirmDeleteTitle', 'Delete Formulation?')}
        message={t('feedFormulation.confirmDeleteMsg', 'Are you sure you want to delete this formulation? This action cannot be undone.')}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteModalVisible(false)}
        confirmText={t('common.delete', 'Delete')}
        cancelText={t('common.cancel', 'Cancel')}
        variant="destructive"
        loading={deleting}
      />

      <GHeader
        title={t('feedFormulation.formulationDetail', 'Formulation Detail')}
        onBack={() => navigation.goBack()}
        rightIcon={
          formulation ? (
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => navigation.navigate('AddFormulation', { id: formulation.id })}
                style={styles.actionBtn}
              >
                <Edit color="#FFF" size={20} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsDeleteModalVisible(true)}
                style={styles.actionBtn}
              >
                <Trash2 color="#FFF" size={20} />
              </TouchableOpacity>
            </View>
          ) : null
        }
        leftAlign={true}
      />

      {formulation && <FormulationDetail formulation={formulation} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
});

export default FormulationDetailScreen;
