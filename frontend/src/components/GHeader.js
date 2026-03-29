import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../theme/ThemeContext';
import { ArrowLeft, Menu, Sun, Moon } from 'lucide-react-native';

/**
 * Global Header Component
 * Props:
 * - title: Screen heading
 * - onBack: Function to run when back button is pressed (shows ArrowLeft)
 * - onMenu: Function to open Drawer (shows Menu icon, only if onBack is not provided)
 * - rightIcon: Component to show on the right side
 * - onRightPress: Action for the right icon
 * - subTitle: Small text below the title
 */
const GHeader = ({ title, onBack, onMenu, rightIcon, onRightPress, subTitle }) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();

  return (
    <View style={[styles.outerContainer, { backgroundColor: theme.colors.primary, ...theme.shadow.md }]}>
      <StatusBar style="light" backgroundColor={theme.colors.primary} translucent={true} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Logic: Prioritize Back button over Menu button to prevent overlap */}
            {onBack ? (
              <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
                <ArrowLeft color={theme.colors.white} size={28} />
              </TouchableOpacity>
            ) : onMenu ? (
              <TouchableOpacity onPress={onMenu} style={styles.backButton} activeOpacity={0.7}>
                <Menu color={theme.colors.white} size={28} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 10 }} />
            )}
          </View>
          
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.colors.white }]} numberOfLines={1}>{title}</Text>
            {subTitle && <Text style={[styles.subTitle, { color: 'rgba(255,255,255,0.8)' }]}>{subTitle}</Text>}
          </View>
          
          {/* Right Action Button (Optional) */}
          {rightIcon ? (
            <TouchableOpacity onPress={onRightPress} style={styles.rightButton}>
              {rightIcon}
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    zIndex: 10,
  },
  safeArea: {
    backgroundColor: 'transparent',
  },
  headerContent: {
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 11,
    fontFamily: 'Montserrat_500Medium',
    marginTop: -2,
    opacity: 0.9,
    textTransform: 'uppercase',
  },
  rightButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  themeToggle: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  curve: {
    height: 10,
    backgroundColor: 'transparent',
  }
});

export default GHeader;
