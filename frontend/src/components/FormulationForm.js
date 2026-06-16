import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import GButton from './GButton';

const FormulationForm = ({ initialData, onSubmit, loading }) => {
  const { theme, isDarkMode } = useTheme();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState([
    { name: '', percentage: '', ratePerKg: '' }
  ]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      if (initialData.ingredients && initialData.ingredients.length > 0) {
        setIngredients(
          initialData.ingredients.map(i => ({
            name: i.name || '',
            percentage: String(i.percentage || ''),
            ratePerKg: String(i.ratePerKg || '')
          }))
        );
      }
    }
  }, [initialData]);

  // Live Calculations
  const totalPercentage = ingredients.reduce((sum, i) => {
    const val = parseFloat(i.percentage) || 0;
    return sum + val;
  }, 0);

  const totalRatePerKg = ingredients.reduce((sum, i) => {
    const pct = parseFloat(i.percentage) || 0;
    const rate = parseFloat(i.ratePerKg) || 0;
    return sum + (pct * rate) / 100;
  }, 0);

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: '', percentage: '', ratePerKg: '' }]);
  };

  const handleRemoveIngredient = (index) => {
    if (ingredients.length === 1) {
      Alert.alert(t('feedFormulation.submitError', 'Validation Error'), t('feedFormulation.emptyIngredients', 'Please add at least one ingredient.'));
      return;
    }
    const next = ingredients.filter((_, idx) => idx !== index);
    setIngredients(next);
  };

  const handleInputChange = (index, field, value) => {
    const next = [...ingredients];
    next[index][field] = value;
    setIngredients(next);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert(t('feedFormulation.submitError', 'Validation Error'), t('feedFormulation.invalidFields', 'Please fill all fields with valid numbers.'));
      return;
    }

    if (ingredients.length === 0) {
      Alert.alert(t('feedFormulation.submitError', 'Validation Error'), t('feedFormulation.emptyIngredients', 'Please add at least one ingredient.'));
      return;
    }

    // Validation of inputs
    const parsedIngredients = [];
    for (let i = 0; i < ingredients.length; i++) {
      const ing = ingredients[i];
      if (!ing.name.trim() || !ing.percentage || !ing.ratePerKg) {
        Alert.alert(t('feedFormulation.submitError', 'Validation Error'), t('feedFormulation.invalidFields', 'Please fill all fields with valid numbers.'));
        return;
      }

      const pct = parseFloat(ing.percentage);
      const rate = parseFloat(ing.ratePerKg);

      if (isNaN(pct) || pct <= 0 || isNaN(rate) || rate < 0) {
        Alert.alert(t('feedFormulation.submitError', 'Validation Error'), t('feedFormulation.invalidFields', 'Please fill all fields with valid numbers.'));
        return;
      }

      parsedIngredients.push({
        name: ing.name.trim(),
        percentage: pct,
        ratePerKg: rate
      });
    }

    const roundedPercentage = Math.round(totalPercentage * 100) / 100;
    if (roundedPercentage !== 100) {
      Alert.alert(
        t('feedFormulation.submitError', 'Validation Error'),
        t('feedFormulation.warnPercentage', 'Total percentage must be exactly 100%. Currently: {{total}}%.', { total: roundedPercentage })
      );
      return;
    }

    onSubmit({
      name: name.trim(),
      ingredients: parsedIngredients
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Formulation Name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            {t('feedFormulation.formulationName', 'Formulation Name*')}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                color: theme.colors.text,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface
              }
            ]}
            placeholder={t('feedFormulation.formulationNamePlaceholder', 'e.g., High-Protein Kid Mix')}
            placeholderTextColor={theme.colors.textMuted}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Ingredients Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('feedFormulation.ingredients', 'Ingredients')}
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { borderColor: theme.colors.primary }]}
            onPress={handleAddIngredient}
          >
            <Plus size={16} color={theme.colors.primary} style={styles.addIcon} />
            <Text style={[styles.addButtonText, { color: theme.colors.primary }]}>
              {t('feedFormulation.addIngredient', 'Add')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Ingredient Rows */}
        {ingredients.map((ing, idx) => (
          <View
            key={idx}
            style={[
              styles.ingredientCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border
              }
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.ingredientIdx, { color: theme.colors.textMuted }]}>
                #{idx + 1}
              </Text>
              <TouchableOpacity onPress={() => handleRemoveIngredient(idx)}>
                <Trash2 size={16} color={theme.colors.error} />
              </TouchableOpacity>
            </View>

            <View style={styles.cardBody}>
              {/* Ingredient Name */}
              <View style={[styles.fieldRow, { marginBottom: 12 }]}>
                <Text style={[styles.fieldLabel, { color: theme.colors.textLight }]}>
                  {t('feedFormulation.ingredientName', 'Name')}
                </Text>
                <TextInput
                  style={[
                    styles.fieldInput,
                    {
                      color: theme.colors.text,
                      borderColor: theme.colors.border,
                      backgroundColor: isDarkMode ? '#000' : '#F9FAFB'
                    }
                  ]}
                  placeholder="e.g. Barley"
                  placeholderTextColor={theme.colors.textMuted}
                  value={ing.name}
                  onChangeText={(val) => handleInputChange(idx, 'name', val)}
                />
              </View>

              <View style={styles.fieldGrid}>
                {/* Percentage */}
                <View style={[styles.fieldCol, { marginRight: 8 }]}>
                  <Text style={[styles.fieldLabel, { color: theme.colors.textLight }]}>
                    {t('feedFormulation.percentage', 'Pct (%)')}
                  </Text>
                  <TextInput
                    style={[
                      styles.fieldInput,
                      {
                        color: theme.colors.text,
                        borderColor: theme.colors.border,
                        backgroundColor: isDarkMode ? '#000' : '#F9FAFB'
                      }
                    ]}
                    placeholder="0"
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType="numeric"
                    value={ing.percentage}
                    onChangeText={(val) => handleInputChange(idx, 'percentage', val)}
                  />
                </View>

                {/* Rate Per Kg */}
                <View style={[styles.fieldCol, { marginLeft: 8 }]}>
                  <Text style={[styles.fieldLabel, { color: theme.colors.textLight }]}>
                    {t('feedFormulation.rate', 'Rate/Kg (₹)')}
                  </Text>
                  <TextInput
                    style={[
                      styles.fieldInput,
                      {
                        color: theme.colors.text,
                        borderColor: theme.colors.border,
                        backgroundColor: isDarkMode ? '#000' : '#F9FAFB'
                      }
                    ]}
                    placeholder="0.00"
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType="numeric"
                    value={ing.ratePerKg}
                    onChangeText={(val) => handleInputChange(idx, 'ratePerKg', val)}
                  />
                </View>
              </View>
            </View>
          </View>
        ))}

        {/* Live Running Status Banner */}
        <View style={styles.bannerContainer}>
          {Math.round(totalPercentage * 100) / 100 === 100 ? (
            <View style={[styles.banner, styles.bannerSuccess, { borderColor: '#10B981' }]}>
              <CheckCircle2 size={18} color="#10B981" style={styles.bannerIcon} />
              <Text style={styles.bannerTextSuccess}>
                {t('feedFormulation.successPercentage', 'Perfect! Total percentage is exactly 100%.')}
              </Text>
            </View>
          ) : (
            <View style={[styles.banner, styles.bannerWarn, { borderColor: '#D97706' }]}>
              <AlertTriangle size={18} color="#D97706" style={styles.bannerIcon} />
              <Text style={styles.bannerTextWarn}>
                {t('feedFormulation.warnPercentage', 'Total percentage must be exactly 100%. Currently: {{total}}%.', { total: Math.round(totalPercentage * 100) / 100 })}
              </Text>
            </View>
          )}
        </View>

        {/* Cost Running Summary Card */}
        <View
          style={[
            styles.costSummaryCard,
            {
              backgroundColor: isDarkMode ? '#1E1E1E' : '#F9FAFB',
              borderColor: theme.colors.border
            }
          ]}
        >
          <View style={styles.costSummaryRow}>
            <Text style={[styles.costSummaryLabel, { color: theme.colors.textLight }]}>
              {t('feedFormulation.totalRate', 'Total Cost / Kg')}
            </Text>
            <Text style={styles.costSummaryValue}>
              ₹{Number(totalRatePerKg).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <GButton
            title={t('common.save', 'Save')}
            onPress={handleSubmit}
            loading={loading}
          />
        </View>

        {/* Spacing bottom */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addIcon: {
    marginRight: 4,
  },
  addButtonText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  ingredientCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 8,
  },
  ingredientIdx: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  cardBody: {
    flex: 1,
  },
  fieldRow: {
    flexDirection: 'column',
  },
  fieldGrid: {
    flexDirection: 'row',
  },
  fieldCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginBottom: 6,
  },
  fieldInput: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  bannerContainer: {
    marginBottom: 16,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  bannerSuccess: {
    backgroundColor: '#10B98110',
  },
  bannerWarn: {
    backgroundColor: '#D9770610',
  },
  bannerIcon: {
    marginRight: 10,
  },
  bannerTextSuccess: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#059669',
    flex: 1,
  },
  bannerTextWarn: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#B45309',
    flex: 1,
  },
  costSummaryCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  costSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  costSummaryLabel: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  costSummaryValue: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#059669',
  },
  submitContainer: {
    marginBottom: 40,
  },
});

export default FormulationForm;
