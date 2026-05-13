import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, Image, FlatList, TouchableOpacity, ActivityIndicator, Animated, TextInput } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import { Plus, ChevronRight, User, Briefcase, Mail, Phone, Search, X, SearchX } from 'lucide-react-native';
import api from '../api';
import { useFocusEffect } from '@react-navigation/native';

const EmployeeListScreen = ({ navigation }) => {
  const { isDarkMode, theme } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchBarTranslateY = React.useRef(new Animated.Value(-100)).current;

  useFocusEffect(
    useCallback(() => {
      fetchEmployees();
    }, [])
  );

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/employees');
      setEmployees(response.data);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    if (!searchQuery) return employees;
    const q = searchQuery.toLowerCase();
    return employees.filter(e => 
      e.name.toLowerCase().includes(q) || 
      e.email.toLowerCase().includes(q) ||
      (e.role && e.role.toLowerCase().includes(q))
    );
  }, [employees, searchQuery]);

  const toggleSearch = () => {
    if (isSearching) {
      setSearchQuery('');
      Animated.timing(searchBarTranslateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsSearching(false));
    } else {
      setIsSearching(true);
      Animated.timing(searchBarTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.item}
      onPress={() => navigation.navigate('EditEmployee', { employee: item })}
    >
      <View style={styles.avatarThumb}>
        {item.profilePhotoUrl ? (
          <Image source={{ uri: item.profilePhotoUrl }} style={styles.avatarThumbImage} />
        ) : (
          <Text style={[styles.avatarInitial, { color: theme.colors.primary }]}>
            {(item.name || '?')[0].toUpperCase()}
          </Text>
        )}
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>{item.name}</Text>
          {item.role !== 'OWNER' && (
            <View style={[
              styles.stateBadge, 
              { backgroundColor: (item.state === 'Terminated') ? theme.colors.error + '15' : theme.colors.success + '15' }
            ]}>
              <View style={[styles.stateDot, { backgroundColor: (item.state === 'Terminated') ? theme.colors.error : theme.colors.success }]} />
              <Text style={[
                styles.stateText, 
                { color: (item.state === 'Terminated') ? theme.colors.error : theme.colors.success }
              ]}>
                {((item.state || 'Active').charAt(0).toUpperCase() + (item.state || 'Active').slice(1).toLowerCase())}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Briefcase size={14} color={theme.colors.textMuted} />
            <Text style={[styles.subInfo, { color: theme.colors.textLight }]} numberOfLines={1}>
              {item.role ? (item.role.charAt(0).toUpperCase() + item.role.slice(1).toLowerCase()) : 'Employee'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Mail size={14} color={theme.colors.textMuted} />
            <Text style={[styles.subInfo, { color: theme.colors.textLight }]} numberOfLines={1}>
              {item.email}
            </Text>
          </View>

          {item.phone && item.phone !== 'N/A' && (
            <View style={styles.detailRow}>
              <Phone size={14} color={theme.colors.textMuted} />
              <Text style={[styles.subInfo, { color: theme.colors.textLight }]}>
                {item.phone}
              </Text>
            </View>
          )}
        </View>
      </View>
      <ChevronRight size={20} color={theme.colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GHeader 
        title="Employee List" 
        onBack={() => navigation.goBack()} 
        leftAlign
        rightIcon={isSearching ? <X color="#FFFFFF" size={26} /> : <Search color="#FFFFFF" size={26} />}
        onRightPress={toggleSearch}
      />

      {isSearching && (
        <Animated.View style={[
          styles.animatedSearchContainer, 
          { 
            backgroundColor: theme.colors.surface,
            transform: [{ translateY: searchBarTranslateY }] 
          }
        ]}>
          <View style={[styles.searchInner, { backgroundColor: isDarkMode ? '#000' : '#F9FAFB' }]}>
            <Search size={20} color={theme.colors.textLight} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Search by name, email or role..."
              placeholderTextColor={theme.colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={18} color={theme.colors.textLight} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredEmployees}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: theme.colors.textLight }]}>No employees added yet.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: theme.colors.primary, ...theme.shadow.lg }]}
        onPress={() => navigation.navigate('AddEmployee')}
        activeOpacity={0.8}
      >
        <Plus color={theme.colors.white} size={30} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    zIndex: 90,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  avatarThumb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarThumbImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarInitial: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    maxWidth: '65%',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  stateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  stateText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.2,
  },
  subInfo: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    lineHeight: 18,
    marginLeft: 10,
  },
  detailsContainer: {
    marginTop: 4,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  animatedSearchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    zIndex: 5,
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  }
});

export default EmployeeListScreen;
