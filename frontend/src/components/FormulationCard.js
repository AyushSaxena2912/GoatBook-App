import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Leaf, ChevronRight, Scale, Check } from 'lucide-react-native';

const FormulationCard = ({ formulation, onPress }) => {
  const { theme, isDarkMode } = useTheme();
  const { t } = useTranslation();

  const previewIngredients = formulation.ingredients?.slice(0, 3) || [];
  const totalIngredients = formulation.ingredients?.length || 0;
  const extraCount = totalIngredients - 3;

  // Format a clean bullet-separated preview string with percentages
  const ingredientsPreviewText = previewIngredients
    .map(ing => `${ing.name} (${ing.percentage}%)`)
    .join(' • ');

  const fullPreviewText = ingredientsPreviewText + (extraCount > 0 ? ` • +${extraCount} more` : '');

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { 
          backgroundColor: theme.colors.surface, 
          borderColor: theme.colors.border + '80' 
        }
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.cardInner}>
        <View style={styles.cardContent}>
          {/* Top row: icon and name */}
          <View style={styles.cardTop}>
            <View style={[styles.iconWrap, { backgroundColor: '#10B98115' }]}>
              <Leaf size={20} color="#10B981" strokeWidth={2.5} />
            </View>
            <View style={styles.nameBlock}>
              <Text style={[styles.vaccineName, { color: theme.colors.text }]} numberOfLines={1}>
                {formulation.name}
              </Text>
              <Text style={[styles.diseaseName, { color: theme.colors.textLight }]} numberOfLines={1}>
                {t('feedFormulation.title', 'Feed Formulation')}
              </Text>
            </View>
          </View>

          {/* Bottom info row (simplified chips) */}
          <View style={styles.infoRow}>
            {/* Cost Badge */}
            <View style={[styles.infoItem, { backgroundColor: '#10B98112' }]}>
              <Scale size={12} color="#10B981" />
              <Text style={[styles.infoText, { color: '#10B981' }]}>
                ₹{Number(formulation.totalRatePerKg).toFixed(2)}/Kg
              </Text>
            </View>

            {/* Ingredients Count Badge */}
            <View style={[styles.infoItem, { backgroundColor: theme.colors.border + '40' }]}>
              <Text style={[styles.infoText, { color: theme.colors.text }]}>
                {totalIngredients} Ingredients
              </Text>
            </View>

            {/* Balanced 100% Badge */}
            <View style={[styles.infoItem, { backgroundColor: theme.colors.border + '40' }]}>
              <Check size={12} color={theme.colors.text} />
              <Text style={[styles.infoText, { color: theme.colors.text }]}>
                100% Balanced
              </Text>
            </View>
          </View>

          {/* Ingredients Preview (similar to remark section) */}
          <Text style={[styles.remark, { color: theme.colors.textLight }]} numberOfLines={2}>
            {fullPreviewText}
          </Text>
        </View>

        {/* Centered Right Chevron */}
        <View style={styles.chevronContainer}>
          <ChevronRight size={24} color={theme.colors.textMuted || '#9CA3AF'} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  chevronContainer: {
    paddingRight: 16,
    paddingLeft: 4,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  vaccineName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.2,
  },
  diseaseName: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  remark: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 12,
    lineHeight: 18,
  },
});

export default FormulationCard;
