import React, { useMemo, useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import { CheckCircle2, Shield, Crown, Zap, User } from 'lucide-react-native';
import { SPACING, SHADOW } from '../theme';
import api from '../api';
import { load } from '@cashfreepayments/cashfree-js';

const PLANS = [
  {
    id: 'BASIC',
    name: 'Basic Version',
    price: '₹5,000/yr',
    icon: <User size={24} color="#64748b" />,
    color: '#64748b',
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
    icon: <Shield size={24} color="#0ea5e9" />,
    color: '#0ea5e9',
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
    icon: <Zap size={24} color="#8b5cf6" />,
    color: '#8b5cf6',
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
    icon: <Crown size={24} color="#f59e0b" />,
    color: '#f59e0b',
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
              <View style={[styles.card, { borderColor: theme.colors.primary, borderWidth: 2, backgroundColor: theme.colors.primary + '10' }]}>
                <Text style={{ fontSize: 14, fontFamily: 'Inter_700Bold', color: theme.colors.primary, marginBottom: 8 }}>CURRENT ACTIVE PLAN</Text>
                <Text style={styles.planName}>{currentPlan.plan_name} Version</Text>
                <Text style={[styles.featureText, { marginTop: 8 }]}>
                  Valid until: {currentPlan.end_date ? new Date(currentPlan.end_date).toLocaleDateString() : 'N/A'}
                </Text>
                <Text style={[styles.featureText, { marginTop: 4 }]}>
                  Status: <Text style={{ color: currentPlan.status === 'ACTIVE' ? theme.colors.success : theme.colors.error, fontFamily: 'Inter_700Bold' }}>{currentPlan.status}</Text>
                </Text>
              </View>
            )}

            <View style={styles.header}>
              <Text style={styles.title}>{currentPlan ? 'Upgrade Your Plan' : 'Unlock Full Potential'}</Text>
              <Text style={styles.subtitle}>Choose the perfect plan for your farm's needs and scale without limits.</Text>
            </View>

            {PLANS.map((plan) => {
              const isCurrent = currentPlan && currentPlan.plan_name === plan.id;
              return (
                <View 
                  key={plan.id} 
                  style={[
                    styles.card, 
                    plan.isPopular && styles.popularCard,
                    isCurrent && { opacity: 0.6 },
                    { borderColor: plan.isPopular ? plan.color : theme.colors.border }
                  ]}
                >
                  {plan.isPopular && (
                    <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
                      <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                    </View>
                  )}
                  {isCurrent && (
                    <View style={[styles.popularBadge, { backgroundColor: theme.colors.success, top: -12 }]}>
                      <Text style={styles.popularBadgeText}>CURRENT PLAN</Text>
                    </View>
                  )}

                  <View style={styles.cardHeader}>
                    <View style={[styles.iconBox, { backgroundColor: `${plan.color}15` }]}>
                      {plan.icon}
                    </View>
                    <View style={styles.cardTitleContainer}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      <Text style={styles.planPrice}>{plan.price}</Text>
                    </View>
                  </View>

                  <View style={styles.featuresList}>
                    {plan.features.map((feat, index) => (
                      <View key={index} style={styles.featureItem}>
                        <CheckCircle2 size={18} color={plan.color} style={styles.featureIcon} />
                        <Text style={styles.featureText}>{feat}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity 
                    style={[
                      styles.selectBtn, 
                      { backgroundColor: isCurrent ? theme.colors.textLight : plan.color }
                    ]}
                    onPress={() => handleSelectPlan(plan.id)}
                    activeOpacity={isCurrent ? 1 : 0.8}
                    disabled={isCurrent}
                  >
                    <Text style={styles.selectBtnText}>{isCurrent ? 'Current Plan' : 'Select Plan'}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}
        <View style={{ height: 40 }} />
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
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOW.md,
    position: 'relative',
  },
  popularCard: {
    borderWidth: 2,
    marginTop: 12,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTitleContainer: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: theme.colors.text,
  },
  planPrice: {
    fontSize: 22,
    fontFamily: 'Inter_800ExtraBold',
    color: theme.colors.text,
    marginTop: 2,
  },
  featuresList: {
    marginBottom: SPACING.lg,
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
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  selectBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  }
});

export default SubscriptionScreen;
