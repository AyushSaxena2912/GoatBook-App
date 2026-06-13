import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Bell, ArrowLeft, CheckCircle2, Circle } from 'lucide-react-native';
import api from '../api';

const NotificationsScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
      await api.put(`/notifications/${id}/read`);
    } catch (err) {
      console.error('Failed to mark as read', err);
      // Revert on failure
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      await api.put('/notifications/read-all');
    } catch (err) {
      console.error('Failed to mark all as read', err);
      fetchNotifications();
    }
  };

  const renderNotification = ({ item }) => {
    const isUnread = !item.is_read;
    return (
      <TouchableOpacity 
        style={[
          styles.notificationCard, 
          { 
            backgroundColor: isUnread ? theme.colors.primary + '10' : theme.colors.surface,
            borderColor: isUnread ? theme.colors.primary + '30' : theme.colors.border
          }
        ]}
        onPress={() => {
          if (isUnread) markAsRead(item.id);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.notificationHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
              <Bell color={theme.colors.primary} size={20} />
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
              {item.title}
            </Text>
          </View>
          {isUnread && <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />}
        </View>
        <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
          {item.message}
        </Text>
        <Text style={[styles.time, { color: theme.colors.textSecondary + '80' }]}>
          {new Date(item.remind_at || item.created_at).toLocaleString()}
        </Text>
      </TouchableOpacity>
    );
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
            <CheckCircle2 color={theme.colors.primary} size={20} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Test Button - Only for testing */}
      <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 5 }}>
        <TouchableOpacity 
          style={{ 
            backgroundColor: theme.colors.primary + '20', 
            padding: 10, 
            borderRadius: 8, 
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.colors.primary + '40'
          }}
          onPress={async () => {
            try {
              await api.post('/users/test-notification');
              fetchNotifications();
            } catch (err) {
              console.error('Test notification failed', err);
            }
          }}
        >
          <Text style={{ color: theme.colors.primary, fontFamily: 'Inter_600SemiBold' }}>
            🔔 Send Test Notification
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <Bell color={theme.colors.textSecondary} size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No notifications yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={renderNotification}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
  },
  markAllBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  notificationCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
    paddingRight: 8,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    marginBottom: 12,
    paddingLeft: 48, // Align with text
  },
  time: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    paddingLeft: 48,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  }
});

export default NotificationsScreen;
