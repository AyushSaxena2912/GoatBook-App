import React, { useMemo, useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import { CheckCircle2, Shield, Crown, Zap, User } from 'lucide-react-native';
import { SPACING } from '../theme';
import api from '../api';
import { load } from '@cashfreepayments/cashfree-js';

const PLANS = [
  {
    id: 'BASIC',
    name: 'Basic Version',
    price: '₹5,000/yr',
    Icon: User,
    features: [
      'Data entry for 1–50 Goats',
      'Single user access',
      'Limited features'
    ],
    isPopular: false
  },
  {
    id: 'STANDARD',
    name: 'Standard Version',
    price: '₹7,500/yr',
    Icon: Shield,
    features: [
      'Data entry for 1–110 Goats',
      'Single user access',
      'Manual update system',
      'Limited features'
    ],
    isPopular: false
  },
  {
    id: 'ADVANCED',
    name: 'Advanced Version',
    price: '₹10,000/yr',
    Icon: Zap,
    features: [
      'Supports 110–500 Goats',
      'Up to 3 users',
      'Internet/web-based data entry and updates',
      'Supplier integration support'
    ],
    isPopular: true
  },
  {
    id: 'ULTIMATE',
    name: 'Ultimate / Elite',
    price: '₹15,000/yr',
    Icon: Crown,
    features: [
      'Unlimited Goats and users (employees)',
      'Full cloud-based system',
      'Live sync and auto updates',
      'Advanced reporting',
      'Multi-branch & admin controls'
    ],
    isPopular: false
  }
];

const SubscriptionScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);

  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentPlan();
  }, []);

  const fetchCurrentPlan = async () => {
    try {
      setLoading(true);
      const res = await api.get('/subscriptions/current');
      setCurrentPlan(res.data);
    } catch (err) {
      console.log('Error fetching subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId) => {
    if (currentPlan && currentPlan.plan_name === planId) {
      if (Platform.OS === 'web') alert('You are already subscribed to this plan.');
      else Alert.alert('Already Subscribed', 'You are already subscribed to this plan.');
      return;
    }

    try {
      if (Platform.OS === 'web') {
        const cashfree = await load({ mode: 'sandbox' });
        
        // 1. Create order on our backend
        const response = await api.post('/subscriptions/create-order', { planName: planId });
        const { payment_session_id, order_id } = response.data;
        
        if (!payment_session_id) {
            throw new Error('Failed to get payment session');
        }

        // 2. Launch Cashfree Checkout
        const checkoutOptions = {
          paymentSessionId: payment_session_id,
          redirectTarget: '_modal' // Opens in an overlay rather than redirecting the whole page
        };
        
        cashfree.checkout(checkoutOptions).then((result) => {
            if (result.error) {
                console.log("Payment Error:", result.error);
                alert(`Payment failed or cancelled: ${result.error.message}`);
            } else if (result.redirect) {
                console.log("Payment Redirect");
            } else if (result.paymentDetails) {
                // Payment was successful in modal
                verifyPayment(order_id);
            }
        });
      } else {
        Alert.alert('Payment', 'In-app payments for mobile are coming soon. Please use the web version to upgrade.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      const msg = (err.response && err.response.data && err.response.data.message) || err.message || 'Failed to initiate payment';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Error', msg);
    }
  };

  const verifyPayment = async (orderId) => {
      try {
          const res = await api.post('/subscriptions/verify-order', { order_id: orderId });
          if (res.data.status === 'PAID') {
              if (Platform.OS === 'web') {
                  alert('Payment Successful! Your plan has been upgraded.');
              } else {
                  Alert.alert('Success', 'Payment Successful! Your plan has been upgraded.');
              }
              navigation.goBack();
          } else {
              if (Platform.OS === 'web') {
                  alert('Payment is pending or failed.');
              } else {
                  Alert.alert('Status', 'Payment is pending or failed.');
              }
          }
      } catch (e) {
          console.error("Verification error:", e);
      }
  };

  return (
    <View style={styles.container}>
      <GHeader 
        title="Upgrade Your Plan" 
        onBack={() => navigation.goBack()} 
        leftAlign
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {currentPlan && (
              <View style={styles.currentPlanCard}>
                <View style={styles.currentPlanHeader}>
                  <View style={styles.currentPlanIconBox}>
                    <Crown size={16} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.currentPlanLabel}>CURRENT ACTIVE PLAN</Text>
                </View>

                <Text style={styles.currentPlanName}>{currentPlan.plan_name} Version</Text>

                <View style={styles.currentPlanMetaRow}>
                  <View style={styles.currentPlanMetaItem}>
                    <Text style={styles.currentPlanMetaLabel}>Valid until</Text>
                    <Text style={styles.currentPlanMetaValue}>
                      {currentPlan.end_date ? new Date(currentPlan.end_date).toLocaleDateString() : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.currentPlanMetaItem}>
                    <Text style={styles.currentPlanMetaLabel}>Status</Text>
                    <View style={styles.statusPill}>
                      <View style={[
                        styles.statusDot,
                        { backgroundColor: currentPlan.status === 'ACTIVE' ? theme.colors.success : theme.colors.error }
                      ]} />
                      <Text style={[
                        styles.statusPillText,
                        { color: currentPlan.status === 'ACTIVE' ? theme.colors.success : theme.colors.error }
                      ]}>
                        {currentPlan.status}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.header}>
              <Text style={styles.title}>{currentPlan ? 'Upgrade Your Plan' : 'Unlock Full Potential'}</Text>
              <Text style={styles.subtitle}>Choose the perfect plan for your farm's needs and scale without limits.</Text>
            </View>

            {PLANS.map((plan) => {
              const isCurrent = currentPlan && currentPlan.plan_name === plan.id;
              const Icon = plan.Icon;
              return (
                <View
                  key={plan.id}
                  style={[
                    styles.card,
                    { borderColor: (plan.isPopular || isCurrent) ? theme.colors.primary : theme.colors.border },
                    isCurrent && { opacity: 0.6 },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.iconBox}>
                      <Icon size={22} color={theme.colors.primary} />
                    </View>
                    <View style={styles.cardTitleContainer}>
                      <View style={styles.cardTitleRow}>
                        <Text style={styles.planName}>{plan.name}</Text>
                        {plan.isPopular && !isCurrent && (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>POPULAR</Text>
                          </View>
                        )}
                        {isCurrent && (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>CURRENT</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.planPrice}>{plan.price}</Text>
                    </View>
                  </View>

                  <View style={styles.featuresList}>
                    {plan.features.map((feat, index) => (
                      <View key={index} style={styles.featureItem}>
                        <CheckCircle2 size={18} color={theme.colors.primary} style={styles.featureIcon} />
                        <Text style={styles.featureText}>{feat}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.selectBtn, isCurrent && styles.selectBtnDisabled]}
                    onPress={() => handleSelectPlan(plan.id)}
                    activeOpacity={isCurrent ? 1 : 0.8}
                    disabled={isCurrent}
                  >
                    <Text style={[styles.selectBtnText, isCurrent && styles.selectBtnTextDisabled]}>
                      {isCurrent ? 'Current Plan' : 'Select Plan'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  currentPlanCard: {
    backgroundColor: theme.colors.primary + '0A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  currentPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  currentPlanIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  currentPlanLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: theme.colors.primary,
    letterSpacing: 0.4,
  },
  currentPlanName: {
    fontSize: 19,
    fontFamily: 'Inter_700Bold',
    color: theme.colors.text,
    marginBottom: 14,
  },
  currentPlanMetaRow: {
    flexDirection: 'row',
  },
  currentPlanMetaItem: {
    flex: 1,
  },
  currentPlanMetaLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: theme.colors.textLight,
    marginBottom: 3,
  },
  currentPlanMetaValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: theme.colors.text,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusPillText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: theme.colors.text,
  },
  badge: {
    backgroundColor: theme.colors.primary + '15',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: theme.colors.primary,
    letterSpacing: 0.4,
  },
  planPrice: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: theme.colors.text,
    marginTop: 2,
  },
  featuresList: {
    marginBottom: SPACING.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  featureIcon: {
    marginRight: 10,
    marginTop: 1,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: theme.colors.text,
    flex: 1,
    lineHeight: 20,
  },
  selectBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  selectBtnDisabled: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  selectBtnTextDisabled: {
    color: theme.colors.textLight,
  }
});

export default SubscriptionScreen;
