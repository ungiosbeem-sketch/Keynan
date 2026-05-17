// utils/colors.js
export const COLORS = {
  background: '#000000',
  card: '#111111',
  primary: '#007AFF',
  primaryDark: '#0055CC',
  white: '#FFFFFF',
  gray: '#8E8E93',
  dark: '#1C1C1E',
  success: '#34C759',
  warning: '#FFCC00',
  danger: '#FF3B30',
  purple: '#5856D6',
  orange: '#FF9500',
  gold: '#FFD60A',
  high: '#FF3B30',
  medium: '#FF9500',
  low: '#34C759',
  routine: '#AF52DE',
  school: '#FF9F0A',
  reading: '#64D2FF',
};

export const LIGHT_COLORS = {
  background: '#F5F5F5',
  card: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#666666',
  border: '#E0E0E0',
};

export const categories = [
  { id: 'study', title: 'Study', icon: 'book-open', color: COLORS.primary },
  { id: 'work', title: 'Work', icon: 'briefcase', color: COLORS.purple },
  { id: 'personal', title: 'Personal', icon: 'heart', color: COLORS.danger },
  { id: 'gym', title: 'Gym', icon: 'activity', color: COLORS.success },
  { id: 'shopping', title: 'Shopping', icon: 'shopping-bag', color: COLORS.orange },
  { id: 'school', title: 'School', icon: 'book', color: COLORS.school },
];
