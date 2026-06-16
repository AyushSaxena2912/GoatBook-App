import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { ChevronRight } from 'lucide-react-native';

const FormulationCard = ({ formulation, onPress }) => {
  const { theme, isDarkMode } = useTheme();

  // Show a preview of first 3 ingredients
  const previewIngredients = formulation.ingredients?.slice(0, 3) || [];
  const extraCount = (formulation.ingredients?.length || 0) - 3;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          ...theme.shadow.sm,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.leftContent}>
          <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
            {formulation.name}
          </Text>
          <View style={styles.ingredientsPreview}>
            {previewIngredients.map((ing, idx) => (
              <View
                key={ing.id || idx}
                style={[
                  styles.chip,
                  { backgroundColor: isDarkMode ? '#222' : '#F3F4F6' },
                ]}
              >
                <Text style={[styles.chipText, { color: theme.colors.textLight }]}>
                  {ing.name} ({ing.percentage}%)
                </Text>
              </View>
            ))}
            {extraCount > 0 && (
              <View
                style={[
                  styles.chip,
                  { backgroundColor: isDarkMode ? '#222' : '#F3F4F6' },
                ]}
              >
                <Text style={[styles.chipText, { color: theme.colors.textLight }]}>
                  +{extraCount} more
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.rightContent}>
          <View style={[styles.badge, { backgroundColor: '#10B98115' }]}>
            <Text style={styles.badgeLabel}>Cost/Kg</Text>
            <Text style={styles.badgeValue}>
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
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContent: {
    flex: 1,
    paddingRight: 12,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  ingredientsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    color: '#059669',
    textTransform: 'uppercase',
  },
  badgeValue: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#059669',
    marginTop: 2,
  },
  chevron: {
    marginLeft: 8,
  },
});

export default FormulationCard;
