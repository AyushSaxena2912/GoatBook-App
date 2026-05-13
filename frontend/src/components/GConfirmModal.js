import React from 'react';
import { Modal, StyleSheet, View, Text, TouchableOpacity, Animated, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { AlertTriangle, X } from 'lucide-react-native';
import { SHADOW, SPACING } from '../theme';
import GButton from './GButton';

const GConfirmModal = ({ 
  visible, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  variant = "primary", // 'primary' or 'destructive'
  loading = false
}) => {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: theme.colors.background }]}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onCancel}>
            <X size={20} color={theme.colors.textLight} />
          </TouchableOpacity>

          {/* Header Icon */}
          <View style={[
            styles.iconCircle, 
            { backgroundColor: variant === 'destructive' ? theme.colors.error + '15' : theme.colors.primary + '15' }
          ]}>
            <AlertTriangle size={32} color={variant === 'destructive' ? theme.colors.error : theme.colors.primary} />
          </View>

          {/* Text Content */}
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
            <Text style={[styles.message, { color: theme.colors.textLight }]}>{message}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.cancelBtn, { borderColor: theme.colors.border }]} 
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={[styles.cancelBtnText, { color: theme.colors.text }]}>{cancelText}</Text>
            </TouchableOpacity>
            
            <View style={styles.confirmBtnWrapper}>
              <GButton 
                title={confirmText}
                onPress={onConfirm}
                loading={loading}
                variant="primary"
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: SPACING.xl,
    alignItems: 'center',
    position: 'relative',
    ...SHADOW.lg,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  buttonContainer: {
    flexDirection: 'column-reverse',
    width: '100%',
    gap: 12,
    paddingTop: 8,
  },
  cancelBtn: {
    width: '100%',
    minHeight: 56,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  confirmBtnWrapper: {
    width: '100%',
    minHeight: 56,
  },
});

export default GConfirmModal;
