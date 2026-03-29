import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, SHADOW } from '../theme';
import { MapPin, ChevronRight, LogOut } from 'lucide-react-native';
import api, { setSelectedFarm, setAuthToken } from '../api';

const FarmSelectionScreen = ({ navigation, route }) => {
  const { farms } = route.params;
  const [loading, setLoading] = useState(false);

  const handleSelectFarm = async (farm) => {
    setLoading(true);
    try {
      await setSelectedFarm(farm.id);
      setLoading(false);
      navigation.replace('MainDrawer');
    } catch (error) {
      setLoading(false);
      alert('Failed to select farm');
    }
  };

  const handleLogout = async () => {
    await setAuthToken(null);
    navigation.replace('Login');
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.farmCard}
      onPress={() => handleSelectFarm(item)}
      disabled={loading}
    >
      <View style={styles.iconContainer}>
        <MapPin size={24} color={COLORS.primary} />
      </View>
      <View style={styles.farmDetails}>
        <Text style={styles.farmName}>{item.name}</Text>
        <Text style={styles.farmLocation}>{item.location || 'Location not set'}</Text>
      </View>
      <ChevronRight size={20} color="#D1D5DB" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>Please select a farm to continue</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading Farm Data...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={farms}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
          />

          <View style={styles.footer}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <LogOut size={20} color="#EF4444" />
              <Text style={styles.logoutText}>Sign out of account</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: SPACING.xl,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 8,
  },
  list: {
    padding: SPACING.lg,
  },
  farmCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    ...SHADOW.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFF1EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  farmDetails: {
    flex: 1,
  },
  farmName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  farmLocation: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 2,
  },
  footer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: '600',
    marginLeft: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.textLight,
    fontWeight: '500',
  }
});

export default FarmSelectionScreen;
