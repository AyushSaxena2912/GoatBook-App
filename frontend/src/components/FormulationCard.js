import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { ChevronRight, Leaf } from 'lucide-react-native';

const FormulationCard = ({ formulation, onPress }) => {
  const { theme, isDarkMode } = useTheme();

  const previewIngredients = formulation.ingredients?.slice(0, 3) || [];
  const totalIngredients = formulation.ingredients?.length || 0;
  const extraCount = totalIngredients - 3;

  // Format a clean bullet-separated preview string
  const ingredientsPreviewText = previewIngredients
    .map(ing => ing.name)
    .join(' • ');

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: isDarkMode ? '#2D2D2D' : '#E5E7EB',
          ...theme.shadow.sm,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.container}>
        {/* Main Content Area */}
        <View style={styles.mainInfo}>
          {/* Header Area */}
          <View style={styles.headerArea}>
            <View style={[styles.iconWrapper, { backgroundColor: isDarkMode ? '#1E2D24' : '#E6F4EA' }]}>
              <Leaf size={16} color="#10B981" />
            </View>
            <View style={styles.titleWrapper}>
              <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
                {formulation.name}
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
                {totalIngredients} Ingredients • 100% Total
              </Text>
            </View>
          </View>

          {/* Description / Ingredients Preview */}
          <Text 
            style={[styles.ingredientsPreview, { color: theme.colors.textLight }]} 
            numberOfLines={1} 
            ellipsizeMode="tail"
          >
            {ingredientsPreviewText}
            {extraCount > 0 ? ` +${extraCount} more` : ''}
          </Text>
        </View>

        {/* Right Action & Cost Area */}
        <View style={styles.actionArea}>
          <View style={[
            styles.costPill, 
            { 
              backgroundColor: isDarkMode ? '#112219' : '#E6F4EA',
              borderColor: isDarkMode ? '#1D3D2C' : '#CEEAD6'
            }
          ]}>
            <Text style={[styles.costLabel, { color: isDarkMode ? '#81C784' : '#137333' }]}>
              Cost/Kg
            </Text>
            <Text style={[styles.costValue, { color: isDarkMode ? '#A5D6A7' : '#137333' }]}>
              ₹{Number(formulation.totalRatePerKg).toFixed(2)}
            </Text>
          </View>
          <ChevronRight size={18} color={theme.colors.textMuted} style={styles.chevron} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981', // Premium left green border accent
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainInfo: {
    flex: 1,
    marginRight: 12,
  },
  headerArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  titleWrapper: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    lineHeight: 20,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  ingredientsPreview: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginLeft: 42, // Indents the preview under the title text for clean alignment
  },
  actionArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  costPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  costLabel: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  costValue: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  chevron: {
    marginLeft: 2,
  },
});

export default FormulationCard;
