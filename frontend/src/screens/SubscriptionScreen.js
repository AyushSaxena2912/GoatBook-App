import React, { useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import { CheckCircle2, Shield, Crown, Zap, User } from 'lucide-react-native';
import { SPACING, SHADOW } from '../theme';

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

  const handleSelectPlan = (planId) => {
    // Only basic is implemented, but we allow selection for the demo
    const msg = `You selected the ${planId} plan. Integration with Cashfree is required to complete the purchase.`;
    if (Platform.OS === 'web') {
        alert(msg);
    } else {
        Alert.alert('Plan Selected', msg);
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
        <View style={styles.header}>
          <Text style={styles.title}>Unlock Full Potential</Text>
          <Text style={styles.subtitle}>Choose the perfect plan for your farm's needs and scale without limits.</Text>
        </View>

        {PLANS.map((plan) => (
          <View 
            key={plan.id} 
            style={[
              styles.card, 
              plan.isPopular && styles.popularCard,
              { borderColor: plan.isPopular ? plan.color : theme.colors.border }
            ]}
          >
            {plan.isPopular && (
              <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
                <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
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
              style={[styles.selectBtn, { backgroundColor: plan.color }]}
              onPress={() => handleSelectPlan(plan.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.selectBtnText}>Select Plan</Text>
            </TouchableOpacity>
          </View>
        ))}
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
