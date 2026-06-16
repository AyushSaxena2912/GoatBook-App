import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Leaf, Scale, Check } from 'lucide-react-native';

const FormulationDetail = ({ formulation }) => {
  const { theme, isDarkMode } = useTheme();
  const { t } = useTranslation();

  const totalPercentage = formulation.ingredients?.reduce((sum, i) => sum + Number(i.percentage), 0) || 0;
  const totalIngredients = formulation.ingredients?.length || 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Formulation Info */}
      <View style={[styles.headerCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border + '80' }]}>
        <View style={styles.cardTop}>
          <View style={[styles.iconWrap, { backgroundColor: '#10B98115' }]}>
            <Leaf size={20} color="#10B981" strokeWidth={2.5} />
          </View>
          <View style={styles.nameBlock}>
            <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
              {formulation.name}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textLight }]} numberOfLines={1}>
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
              {totalPercentage}% Balanced
            </Text>
          </View>
        </View>
      </View>

      {/* Ingredients Table */}
      <View style={[styles.tableContainer, { borderColor: theme.colors.border }]}>
        {/* Table Headers */}
        <View style={[styles.tableHeader, { backgroundColor: isDarkMode ? '#222' : '#F3F4F6', borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.headerCell, styles.flexName, { color: theme.colors.text }]}>
            {t('feedFormulation.ingredientName', 'Ingredient')}
          </Text>
          <Text style={[styles.headerCell, styles.flexCenter, { color: theme.colors.text }]}>
            {t('feedFormulation.percentage', '%')}
          </Text>
          <Text style={[styles.headerCell, styles.flexRight, { color: theme.colors.text }]}>
            {t('feedFormulation.rate', 'Rate/Kg')}
          </Text>
          <Text style={[styles.headerCell, styles.flexRight, { color: theme.colors.text }]}>
            {t('feedFormulation.rateTmrCol', 'TMR')}
          </Text>
        </View>

        {/* Table Rows */}
        {formulation.ingredients?.map((item, index) => (
          <View 
            key={item.id || index} 
            style={[
              styles.tableRow, 
              { 
                borderBottomColor: theme.colors.border,
                backgroundColor: index % 2 === 0 ? theme.colors.surface : (isDarkMode ? '#171717' : '#FCFCFC')
              }
            ]}
          >
            <Text style={[styles.rowCell, styles.flexName, { color: theme.colors.text }]} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={[styles.rowCell, styles.flexCenter, { color: theme.colors.textLight }]}>
              {item.percentage}%
            </Text>
            <Text style={[styles.rowCell, styles.flexRight, { color: theme.colors.textLight }]}>
              ₹{Number(item.ratePerKg).toFixed(2)}
            </Text>
            <Text style={[styles.rowCell, styles.flexRight, { color: theme.colors.text }]}>
              ₹{Number((item.percentage * item.ratePerKg) / 100).toFixed(2)}
            </Text>
          </View>
        ))}

        {/* Total Row */}
        <View style={[styles.totalRow, { backgroundColor: isDarkMode ? '#1E1E1E' : '#F9FAFB', borderTopWidth: 2, borderTopColor: theme.colors.border }]}>
          <Text style={[styles.totalLabel, styles.flexName, { color: theme.colors.text }]}>
            {t('feedFormulation.total', 'Total')}
          </Text>
          <Text style={[styles.totalValue, styles.flexCenter, { color: theme.colors.text }]}>
            {totalPercentage}%
          </Text>
          <Text style={[styles.totalValue, styles.flexRight, { color: theme.colors.textMuted }]}>
            -
          </Text>
          <Text style={[styles.totalPrice, styles.flexRight, { color: '#059669' }]}>
            ₹{Number(formulation.totalRatePerKg).toFixed(2)}
          </Text>
        </View>
      </View>
      
      {/* Spacing bottom */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981', // Premium left green border accent matching list card
    padding: 16,
    marginBottom: 20,
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
  title: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  subtitle: {
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
  tableContainer: {
    borderWidth: 1.5,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  headerCell: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  rowCell: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  totalValue: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  totalPrice: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  flexName: {
    flex: 2,
  },
  flexCenter: {
    flex: 1,
    textAlign: 'center',
  },
  flexRight: {
    flex: 1.2,
    textAlign: 'right',
  },
});

export default FormulationDetail;
