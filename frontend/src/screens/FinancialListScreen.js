import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Modal, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import { Search, Plus, Calendar, Filter, X, ChevronDown, Check, Trash2, Edit2 } from 'lucide-react-native';
import api from '../api';
import GAlert from '../components/GAlert';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

const FinancialListScreen = ({ navigation }) => {
  const { isDarkMode, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, netBalance: 0 });
  const [activeTab, setActiveTab] = useState('All'); // 'All', 'INCOME', 'EXPENSE'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filtering States
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [filterType, setFilterType] = useState('30'); // '30', '90', 'custom'
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());
  
  // Date Picker States
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Alert State
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info' });
  const showAlert = (title, message, type = 'info') => setAlertConfig({ visible: true, title, message, type });
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);

  const fetchFinancials = async () => {
    try {
      setLoading(true);
      let url = `/finances?`;
      
      // Calculate date filters
      let sDate = null;
      let eDate = null;
      
      if (filterType === '30') {
        sDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        eDate = new Date().toISOString();
      } else if (filterType === '90') {
        sDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        eDate = new Date().toISOString();
      } else if (filterType === 'custom') {
        sDate = startDate.toISOString();
        eDate = endDate.toISOString();
      }

      if (sDate) url += `startDate=${sDate}&`;
      if (eDate) url += `endDate=${eDate}&`;
      if (activeTab !== 'All') url += `type=${activeTab}&`;

      const response = await api.get(url);
      setTransactions(response.data.transactions || []);
      setSummary(response.data.summary || { totalIncome: 0, totalExpense: 0, netBalance: 0 });
    } catch (e) {
      console.error('Failed to fetch financial details', e);
      showAlert('Error', 'Failed to load financial records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFinancials();
    }, [activeTab, filterType, startDate, endDate])
  );

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/finances/${id}`);
      showAlert('Success', 'Record deleted successfully', 'success');
      fetchFinancials();
    } catch (e) {
      console.error('Failed to delete transaction', e);
      showAlert('Error', 'Failed to delete transaction record', 'error');
      setLoading(false);
    }
  };

  // Filter local results by search bar category
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const query = searchQuery.toLowerCase();
    return transactions.filter(t => 
      t.category.toLowerCase().includes(query) || 
      (t.description && t.description.toLowerCase().includes(query))
    );
  }, [transactions, searchQuery]);

  const handleDateSubmit = () => {
    setIsFilterModalVisible(false);
    fetchFinancials();
  };

  const getFilterLabel = () => {
    if (filterType === '30') return 'Last 30 Days';
    if (filterType === '90') return 'Last 90 Days';
    return 'Custom Range';
  };

  const renderTransactionItem = ({ item }) => {
    const isIncome = item.type === 'INCOME';
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.categoryText}>{item.category}</Text>
            <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString()}</Text>
            {item.description ? <Text style={styles.descText}>{item.description}</Text> : null}
          </View>
          <View style={styles.amountContainer}>
            <Text style={[styles.amountText, isIncome ? styles.incomeText : styles.expenseText]}>
              {isIncome ? '+' : '-'} ₹{parseFloat(item.amount).toFixed(2)}
            </Text>
          </View>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => navigation.navigate('AddFinancialRecord', { record: item })} style={styles.actionBtn}>
            <Edit2 size={16} color={theme.colors.textLight} />
            <Text style={styles.actionBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
            <Trash2 size={16} color="#EF4444" />
            <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader 
        title="Income & Expense" 
        onMenu={!navigation.canGoBack() ? () => navigation.openDrawer() : undefined} 
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} 
        leftAlign={true}
      />
      <GAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onClose={hideAlert} />

      {/* Filter and Search Section */}
      <View style={styles.filterSection}>
        <View style={[styles.searchInner, { backgroundColor: isDarkMode ? '#000' : '#F9FAFB' }]}>
          <Search size={20} color={theme.colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search by category..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color={theme.colors.textLight} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.dateFilterDropdown} onPress={() => setIsFilterModalVisible(true)}>
          <Text style={styles.dropdownLabel}>{getFilterLabel()}</Text>
          <ChevronDown size={18} color={theme.colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Income</Text>
          <Text style={[styles.summaryVal, styles.incomeText]}>₹{summary.totalIncome.toFixed(0)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Expenses</Text>
          <Text style={[styles.summaryVal, styles.expenseText]}>₹{summary.totalExpense.toFixed(0)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Net Balance</Text>
          <Text style={[styles.summaryVal, summary.netBalance >= 0 ? styles.incomeText : styles.expenseText]}>
            ₹{summary.netBalance.toFixed(0)}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {['All', 'INCOME', 'EXPENSE'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'All' ? 'All' : tab === 'INCOME' ? 'Income' : 'Expense'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={renderTransactionItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.noRecords}>No Records found</Text>
            </View>
          }
        />
      )}

      {/* Add FAB */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('AddFinancialRecord')}
      >
        <Plus color={theme.colors.white} size={28} />
      </TouchableOpacity>

      {/* Date Filter Dialog */}
      <Modal visible={isFilterModalVisible} transparent animationType="fade" onRequestClose={() => setIsFilterModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Dialog</Text>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                <X size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {/* Last 30 Days */}
            <TouchableOpacity style={styles.filterOption} onPress={() => setFilterType('30')}>
              <View style={[styles.radio, filterType === '30' && styles.radioActive]}>
                {filterType === '30' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.optionLabel}>Last 30 Days</Text>
            </TouchableOpacity>

            {/* Last 90 Days */}
            <TouchableOpacity style={styles.filterOption} onPress={() => setFilterType('90')}>
              <View style={[styles.radio, filterType === '90' && styles.radioActive]}>
                {filterType === '90' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.optionLabel}>Last 90 Days</Text>
            </TouchableOpacity>

            {/* Date Range Selection */}
            <TouchableOpacity style={styles.filterOption} onPress={() => setFilterType('custom')}>
              <View style={[styles.radio, filterType === 'custom' && styles.radioActive]}>
                {filterType === 'custom' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.optionLabel}>Date Range</Text>
            </TouchableOpacity>

            {filterType === 'custom' && (
              <View style={styles.customDateContainer}>
                <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowStartPicker(true)}>
                  <Calendar size={16} color={theme.colors.textLight} />
                  <Text style={styles.datePickerBtnText}>Start Date: {startDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowEndPicker(true)}>
                  <Calendar size={16} color={theme.colors.textLight} />
                  <Text style={styles.datePickerBtnText}>End Date: {endDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
              </View>
            )}

            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowStartPicker(false);
                  if (selectedDate) setStartDate(selectedDate);
                }}
              />
            )}

            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowEndPicker(false);
                  if (selectedDate) setEndDate(selectedDate);
                }}
              />
            )}

            <TouchableOpacity style={styles.submitBtn} onPress={handleDateSubmit}>
              <Text style={styles.submitBtnText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: { flex: 1 },
  filterSection: { padding: 16, flexDirection: 'row', gap: 10, alignItems: 'center' },
  searchInner: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 10, height: 42 },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
  dateFilterDropdown: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, paddingHorizontal: 12, height: 42, gap: 6, backgroundColor: theme.colors.surface },
  dropdownLabel: { fontSize: 13, color: theme.colors.text, fontFamily: 'Inter_500Medium' },
  summaryBar: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  summaryCard: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: theme.colors.textMuted, fontFamily: 'Inter_500Medium', marginBottom: 4 },
  summaryVal: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  incomeText: { color: '#10B981' },
  expenseText: { color: '#EF4444' },
  tabsContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.colors.border, marginBottom: 10 },
  tab: { flex: 1, py: 12, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: theme.colors.primary },
  tabText: { fontSize: 14, color: theme.colors.textMuted, fontFamily: 'Inter_600SemiBold' },
  activeTabText: { color: theme.colors.primary },
  listContent: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  categoryText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: theme.colors.text },
  dateText: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
  descText: { fontSize: 13, color: theme.colors.textLight, marginTop: 4, fontStyle: 'italic' },
  amountContainer: { alignItems: 'flex-end' },
  amountText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, borderTopWidth: 1, borderTopColor: theme.colors.border, marginTop: 12, paddingTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBtnText: { fontSize: 13, color: theme.colors.textLight, fontFamily: 'Inter_500Medium' },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  noRecords: { fontSize: 16, color: theme.colors.textMuted, fontFamily: 'Inter_500Medium' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: theme.colors.surface, width: '85%', borderRadius: 14, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: theme.colors.text },
  filterOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.colors.border, justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: theme.colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary },
  optionLabel: { fontSize: 15, color: theme.colors.text, fontFamily: 'Inter_500Medium' },
  customDateContainer: { marginTop: 10, gap: 10 },
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8 },
  datePickerBtnText: { fontSize: 14, color: theme.colors.textLight, fontFamily: 'Inter_500Medium' },
  submitBtn: { backgroundColor: theme.colors.primary, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 24 },
  submitBtnText: { color: 'white', fontSize: 16, fontFamily: 'Inter_600SemiBold' }
});

export default FinancialListScreen;
