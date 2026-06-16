import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { ChevronRight, Leaf } from 'lucide-react-native';

const FormulationCard = ({ formulation, onPress }) => {
  const { theme, isDarkMode } = useTheme();

  // Show a preview of first 3 ingredients
  const previewIngredients = formulation.ingredients?.slice(0, 3) || [];
  const totalIngredients = formulation.ingredients?.length || 0;
  const extraCount = totalIngredients - 3;

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
      activeOpacity={0.75}
    >
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <View style={[styles.iconContainer, { backgroundColor: '#10B98115' }]}>
            <Leaf size={16} color="#10B981" />
          </View>
          <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
            {formulation.name}
          </Text>
        </View>

        <View style={styles.costContainer}>
          <Text style={[styles.costLabel, { color: theme.colors.textMuted }]}>Cost / Kg</Text>
          <Text style={styles.costValue}>
            ₹{Number(formulation.totalRatePerKg).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Subtle Divider Line */}
      <View style={[styles.divider, { backgroundColor: isDarkMode ? '#2D2D2D' : '#F3F4F6' }]} />

      {/* Bottom Footer Row */}
      <View style={styles.footerRow}>
        <View style={styles.ingredientsPreview}>
          {previewIngredients.map((ing, idx) => (
            <View
              key={ing.id || idx}
              style={[
                styles.chip,
                { backgroundColor: isDarkMode ? '#262626' : '#F9FAFB', borderColor: isDarkMode ? '#333' : '#E5E7EB' },
              ]}
            >
              <Text 
                style={[styles.chipText, { color: theme.colors.textLight }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {ing.name} ({ing.percentage}%)
              </Text>
            </View>
          ))}
          {extraCount > 0 && (
            <View
              style={[
                styles.chip,
                styles.extraChip,
                { backgroundColor: '#10B98110', borderColor: '#10B98125' },
              ]}
            >
              <Text style={styles.extraChipText}>
                +{extraCount} more
              </Text>
            </View>
          )}
        </View>

        <ChevronRight size={18} color={theme.colors.textMuted} style={styles.chevron} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderLeftWidth: 5,
    borderLeftColor: '#10B981', // Emerald green left accent
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    flex: 1,
  },
  costContainer: {
    alignItems: 'flex-end',
  },
  costLabel: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  costValue: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#10B981',
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ingredientsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 120, // Prevent chips from getting too wide
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  extraChip: {
    maxWidth: 80,
  },
  extraChipText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#10B981',
  },
  chevron: {
    marginLeft: 4,
  },
});

export default FormulationCard;
