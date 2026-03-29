export const lightTheme = {
  colors: {
    primary: '#F95004',
    primaryDark: '#D64403',
    secondary: '#4F46E5',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    text: '#111827',
    textLight: '#4B5563',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    error: '#DC2626',
    success: '#059669',
    warning: '#D97706',
    info: '#2563EB',
    white: '#FFFFFF',
    black: '#000000',
  },
  typography: {
    regular: 'Montserrat_400Regular',
    medium: 'Montserrat_500Medium',
    semiBold: 'Montserrat_600SemiBold',
    bold: 'Montserrat_600SemiBold',
    extraBold: 'Montserrat_700Bold',
  },
  spacing: {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 40,
  },
  shadow: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 8 },
  }
};

export const darkTheme = {
  colors: {
    primary: '#F95004',
    primaryDark: '#D64403',
    secondary: '#818CF8',
    background: '#000000', // Pure black
    surface: '#121212',    // Very dark gray
    text: '#FFFFFF',       // White
    textLight: '#A0A0A0',  // Light gray
    textMuted: '#666666',  // Muted gray
    border: '#222222',     // Dark border
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
    white: '#FFFFFF',
    black: '#000000',
  },
  typography: lightTheme.typography,
  spacing: lightTheme.spacing,
  shadow: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 3 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 6 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.6, shadowRadius: 16, elevation: 12 },
  }
};

// Legacy exports for compatibility during migration
export const COLORS = lightTheme.colors;
export const SPACING = lightTheme.spacing;
export const SHADOW = lightTheme.shadow;

