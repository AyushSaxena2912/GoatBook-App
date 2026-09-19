import React, { useState, useEffect, useRef } from 'react';
import { Modal, StyleSheet, View, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { LockKeyhole } from 'lucide-react-native';
import { SHADOW, SPACING } from '../theme';
import GButton from './GButton';
import { onSubscriptionExpired } from '../utils/subscriptionExpiredBus';
import { setAuthToken, setSelectedFarm } from '../api';
import { navigationRef } from '../navigation/navigationRef';

const SubscriptionExpiredModal = () => {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [plan, setPlan] = useState(null);
  const shownOnceRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onSubscriptionExpired((payload) => {
      setPlan(payload?.plan || null);
      setVisible(true);
      shownOnceRef.current = true;
    });
    return unsubscribe;
  }, []);

  const goToSubscription = () => {
    setVisible(false);
    if (navigationRef.isReady()) {
      navigationRef.navigate('SubscriptionScreen');
    }
  };

  const handleLogout = async () => {
    setVisible(false);
    await setAuthToken(null);
    await setSelectedFarm(null);
    if (navigationRef.isReady()) {
      navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={goToSubscription}>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '15' }]}>
            <LockKeyhole size={32} color={theme.colors.primary} />
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Trial Expired</Text>
            <Text style={[styles.message, { color: theme.colors.textLight }]}>
              Your free trial has ended{plan ? ` on the ${plan.charAt(0) + plan.slice(1).toLowerCase()} plan` : ''}. Subscribe now to keep using GoatBook.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <GButton title="View Plans" onPress={goToSubscription} variant="primary" />
          </View>

          <Text style={[styles.logoutText, { color: theme.colors.textMuted }]} onPress={handleLogout}>
            Log Out
          </Text>
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
    ...SHADOW.lg,
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
    width: '100%',
  },
  logoutText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 18,
    textDecorationLine: 'underline',
  },
});

export default SubscriptionExpiredModal;
