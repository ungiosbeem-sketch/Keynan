import React, { useState, useEffect, useContext, createContext, useRef } from 'react';
import { 
  View, Text, ActivityIndicator, StyleSheet, Alert, TextInput, TouchableOpacity, 
  ScrollView, FlatList, Switch, Modal, Image, Animated, StatusBar 
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import 'react-native-url-polyfill/auto';

const { width } = require('react-native').Dimensions.get('window');
const Tab = createBottomTabNavigator();

// ============ SUPABASE ============
const SUPABASE_URL = 'https://bwmvrsasculzivdcqyvi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_jC1Yhl9CMcnATcBtTRvwmQ_dM2QRr-j';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============ COLORS ============
const COLORS = {
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

const LIGHT_COLORS = {
  background: '#F5F5F5',
  card: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#666666',
  border: '#E0E0E0',
};

const categories = [
  { id: 'study', title: 'Study', icon: 'book-open', color: COLORS.primary },
  { id: 'work', title: 'Work', icon: 'briefcase', color: COLORS.purple },
  { id: 'personal', title: 'Personal', icon: 'heart', color: COLORS.danger },
  { id: 'gym', title: 'Gym', icon: 'activity', color: COLORS.success },
  { id: 'shopping', title: 'Shopping', icon: 'shopping-bag', color: COLORS.orange },
  { id: 'school', title: 'School', icon: 'book', color: COLORS.school },
];

const routineItems = [
  { id: 'wake', title: '🌅 Wake Up', time: '06:00', icon: 'sunrise', completed: false },
  { id: 'pray', title: '🕌 Morning Prayer', time: '06:30', icon: 'pray', completed: false },
  { id: 'study', title: '📚 Study Session', time: '08:00', icon: 'book', completed: false },
  { id: 'school', title: '🏫 Go to School', time: '09:00', icon: 'school', completed: false },
  { id: 'lunch', title: '🍽️ Lunch Break', time: '12:00', icon: 'food', completed: false },
  { id: 'homework', title: '✏️ Homework', time: '15:00', icon: 'edit', completed: false },
  { id: 'read', title: '📖 Reading', time: '18:00', icon: 'book-open', completed: false },
  { id: 'dinner', title: '🍲 Dinner', time: '19:30', icon: 'food', completed: false },
  { id: 'review', title: '📝 Review Day', time: '20:30', icon: 'clipboard', completed: false },
  { id: 'sleep', title: '🌙 Sleep', time: '22:00', icon: 'moon', completed: false },
];

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ============ CONTEXTS ============
const AuthContext = createContext();
const ThemeContext = createContext();
const RoutineContext = createContext();
const SchoolContext = createContext();
const ReadingContext = createContext();

// ============ AUTH PROVIDER ============
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkUser(); }, []);

  const checkUser = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('@current_user');
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch (error) {} finally { setLoading(false); }
  };

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('email', email).eq('password', password).single();
      if (error) throw error;
      if (data) {
        setUser(data);
        await AsyncStorage.setItem('@current_user', JSON.stringify(data));
        return true;
      }
      return false;
    } catch (error) { return false; }
  };

  const signup = async (name, email, password) => {
    try {
      const newUser = { id: Date.now().toString(), name, email, password, premium: true, join_date: new Date().toISOString() };
      const { error } = await supabase.from('users').insert([newUser]);
      if (error) throw error;
      setUser(newUser);
      await AsyncStorage.setItem('@current_user', JSON.stringify(newUser));
      return true;
    } catch (error) { return false; }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('@current_user');
  };

  const updateUserAvatar = async (avatarUrl) => {
    try {
      const { error } = await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', user.id);
      if (error) throw error;
      const updatedUser = { ...user, avatar_url: avatarUrl };
      setUser(updatedUser);
      await AsyncStorage.setItem('@current_user', JSON.stringify(updatedUser));
      return true;
    } catch (error) { return false; }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUserAvatar }}>
      {children}
    </AuthContext.Provider>
  );
}

// ============ THEME PROVIDER ============
function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(true);
  return ( <ThemeContext.Provider value={{ darkMode, setDarkMode }}>{children}</ThemeContext.Provider> );
}

// ============ ROUTINE PROVIDER ============
function RoutineProvider({ children }) {
  const [routine, setRoutine] = useState(routineItems);
  const [routineProgress, setRoutineProgress] = useState(0);

  useEffect(() => { loadRoutine(); }, []);
  useEffect(() => { 
    const completed = routine.filter(r => r.completed).length;
    setRoutineProgress(Math.round((completed / routine.length) * 100));
    saveRoutine();
  }, [routine]);

  const loadRoutine = async () => {
    try {
      const saved = await AsyncStorage.getItem('@daily_routine');
      if (saved) setRoutine(JSON.parse(saved));
    } catch (error) {}
  };

  const saveRoutine = async () => {
    await AsyncStorage.setItem('@daily_routine', JSON.stringify(routine));
  };

  const toggleRoutine = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRoutine(routine.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const resetRoutine = () => {
    Alert.alert('Reset Routine', 'Reset all daily tasks?', [
      { text: 'Cancel' },
      { text: 'Reset', onPress: () => setRoutine(routine.map(item => ({ ...item, completed: false }))) }
    ]);
  };

  return (
    <RoutineContext.Provider value={{ routine, routineProgress, toggleRoutine, resetRoutine }}>
      {children}
    </RoutineContext.Provider>
  );
}

// ============ SCHOOL PROVIDER ============
function SchoolProvider({ children }) {
  const [schedule, setSchedule] = useState([]);
  const [homework, setHomework] = useState([]);

  useEffect(() => { loadSchedule(); loadHomework(); }, []);

  const loadSchedule = async () => {
    try {
      const saved = await AsyncStorage.getItem('@school_schedule');
      if (saved) setSchedule(JSON.parse(saved));
      else {
        const defaultSchedule = [
          { id: '1', day: 'Monday', subject: 'Mathematics', time: '08:00-09:30', teacher: 'Mr. Ahmed', room: '101' },
          { id: '2', day: 'Monday', subject: 'Physics', time: '10:00-11:30', teacher: 'Ms. Fatima', room: '202' },
          { id: '3', day: 'Tuesday', subject: 'Chemistry', time: '08:00-09:30', teacher: 'Dr. Omar', room: '103' },
          { id: '4', day: 'Tuesday', subject: 'English', time: '10:00-11:30', teacher: 'Ms. Aisha', room: '204' },
          { id: '5', day: 'Wednesday', subject: 'Biology', time: '08:00-09:30', teacher: 'Dr. Hassan', room: '105' },
          { id: '6', day: 'Wednesday', subject: 'History', time: '10:00-11:30', teacher: 'Mr. Khalid', room: '206' },
        ];
        setSchedule(defaultSchedule);
        await AsyncStorage.setItem('@school_schedule', JSON.stringify(defaultSchedule));
      }
    } catch (error) {}
  };

  const loadHomework = async () => {
    try {
      const saved = await AsyncStorage.getItem('@homework');
      if (saved) setHomework(JSON.parse(saved));
    } catch (error) {}
  };

  const saveHomework = async (newHomework) => {
    await AsyncStorage.setItem('@homework', JSON.stringify(newHomework));
    setHomework(newHomework);
  };

  const addHomework = (subject, description, dueDate) => {
    const newHomework = { id: Date.now().toString(), subject, description, dueDate, completed: false };
    saveHomework([...homework, newHomework]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const toggleHomework = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    saveHomework(homework.map(h => h.id === id ? { ...h, completed: !h.completed } : h));
  };

  const deleteHomework = (id) => {
    saveHomework(homework.filter(h => h.id !== id));
  };

  return (
    <SchoolContext.Provider value={{ schedule, homework, addHomework, toggleHomework, deleteHomework, weekDays }}>
      {children}
    </SchoolContext.Provider>
  );
}

// ============ READING PROVIDER ============
function ReadingProvider({ children }) {
  const [readingList, setReadingList] = useState([]);
  const [pdfBooks, setPdfBooks] = useState([]);

  useEffect(() => { loadReadingList(); loadPdfBooks(); }, []);

  const loadReadingList = async () => {
    try {
      const saved = await AsyncStorage.getItem('@reading_list');
      if (saved) setReadingList(JSON.parse(saved));
    } catch (error) {}
  };

  const loadPdfBooks = async () => {
    try {
      const saved = await AsyncStorage.getItem('@pdf_books');
      if (saved) setPdfBooks(JSON.parse(saved));
    } catch (error) {}
  };

  const saveReadingList = async (newList) => {
    await AsyncStorage.setItem('@reading_list', JSON.stringify(newList));
    setReadingList(newList);
  };

  const addBook = (title, author, totalPages) => {
    const newBook = { id: Date.now().toString(), title, author, totalPages: parseInt(totalPages), currentPage: 0, completed: false, type: 'book' };
    saveReadingList([...readingList, newBook]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const addPdfBook = async (pdfUri, fileName) => {
    try {
      const newPdfBook = {
        id: Date.now().toString(),
        title: fileName.replace('.pdf', ''),
        type: 'pdf',
        uri: pdfUri,
        completed: false,
        addedDate: new Date().toISOString(),
      };
      const updatedList = [...pdfBooks, newPdfBook];
      setPdfBooks(updatedList);
      await AsyncStorage.setItem('@pdf_books', JSON.stringify(updatedList));
      Alert.alert('Success', 'PDF added!');
      return true;
    } catch (error) {
      Alert.alert('Error', 'Failed to add PDF');
      return false;
    }
  };

  const updateProgress = (id, pages) => {
    const updated = readingList.map(book => {
      if (book.id === id) {
        const newPage = Math.min(book.currentPage + pages, book.totalPages);
        const completed = newPage === book.totalPages;
        return { ...book, currentPage: newPage, completed };
      }
      return book;
    });
    saveReadingList(updated);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const deleteBook = (id) => {
    saveReadingList(readingList.filter(book => book.id !== id));
  };

  const deletePdfBook = async (id) => {
    const updatedList = pdfBooks.filter(book => book.id !== id);
    setPdfBooks(updatedList);
    await AsyncStorage.setItem('@pdf_books', JSON.stringify(updatedList));
  };

  const openPdf = async (pdfUri) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(pdfUri);
      if (!fileInfo.exists) {
        Alert.alert('Error', 'PDF file not found');
        return;
      }
      const { uri } = await FileSystem.getContentUriAsync(pdfUri);
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: uri,
        flags: 1,
        type: 'application/pdf',
      });
    } catch (error) {
      Alert.alert('Error', 'Cannot open PDF. Please install a PDF reader app.');
    }
  };

  return (
    <ReadingContext.Provider value={{ 
      readingList, pdfBooks, addBook, addPdfBook, updateProgress, 
      deleteBook, deletePdfBook, openPdf 
    }}>
      {children}
    </ReadingContext.Provider>
  );
}

// ============ LOGIN SCREEN ============
function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showSignup, setShowSignup] = useState(false);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup } = useContext(AuthContext);
  const { darkMode } = useContext(ThemeContext);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  const handleAuth = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please fill all fields'); return; }
    if (showSignup && !name) { Alert.alert('Error', 'Please enter your name'); return; }
    setIsLoading(true);
    let success;
    if (showSignup) success = await signup(name, email, password);
    else success = await login(email, password);
    setIsLoading(false);
    if (success) navigation.replace('MainApp');
    else Alert.alert('Error', showSignup ? 'Email already exists' : 'Invalid credentials');
  };

  return (
    <LinearGradient colors={darkMode ? ['#000000', '#1A1A2E'] : ['#F5F5F5', '#E8E8E8']} style={styles.loginContainer}>
      <Animated.View style={[styles.loginContent, { opacity: fadeAnim }]}>
        <View style={[styles.logoCircle, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
          <FontAwesome5 name="rocket" size={50} color={COLORS.primary} />
        </View>
        <Text style={[styles.loginTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>Keynan</Text>
        <Text style={[styles.loginSubtitle, { color: darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary }]}>Study • Routine • Read</Text>

        {showSignup && (
          <TextInput placeholder="Full Name" placeholderTextColor={COLORS.gray} style={[styles.loginInput, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card, color: darkMode ? COLORS.white : LIGHT_COLORS.text }]} value={name} onChangeText={setName} />
        )}
        <TextInput placeholder="Email" placeholderTextColor={COLORS.gray} style={[styles.loginInput, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card, color: darkMode ? COLORS.white : LIGHT_COLORS.text }]} value={email} onChangeText={setEmail} autoCapitalize="none" />
        <TextInput placeholder="Password" placeholderTextColor={COLORS.gray} style={[styles.loginInput, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card, color: darkMode ? COLORS.white : LIGHT_COLORS.text }]} value={password} onChangeText={setPassword} secureTextEntry />

        <TouchableOpacity style={[styles.loginButton, { backgroundColor: COLORS.primary }]} onPress={handleAuth} disabled={isLoading}>
          <Text style={styles.loginButtonText}>{isLoading ? 'Loading...' : (showSignup ? 'Sign Up' : 'Login')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowSignup(!showSignup)}>
          <Text style={[styles.loginSwitch, { color: COLORS.primary }]}>{showSignup ? 'Already have account? Login' : 'Create new account'}</Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

// ============ HOME SCREEN ============
function HomeScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { routine, routineProgress } = useContext(RoutineContext);
  const { homework } = useContext(SchoolContext);
  const { readingList, pdfBooks } = useContext(ReadingContext);
  const { user } = useContext(AuthContext);
  const { darkMode } = useContext(ThemeContext);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { if (user) loadTasks(); }, [user]);
  useEffect(() => { Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start(); }, []);

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      setTasks(data || []);
    } catch (error) {} finally { setLoading(false); }
  };

  const toggleComplete = async (id, currentStatus) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { error } = await supabase.from('tasks').update({ completed: !currentStatus }).eq('id', id);
      if (error) throw error;
      setTasks(tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
    } catch (error) { Alert.alert('Error', 'Failed to update task'); }
  };

  const deleteTask = async (id) => {
    Alert.alert('Delete', 'Remove this task?', [
      { text: 'Cancel' },
      { text: 'Delete', onPress: async () => {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (!error) setTasks(tasks.filter(task => task.id !== id));
      }}
    ]);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const completed = filteredTasks.filter(t => t.completed).length;
  const progress = filteredTasks.length > 0 ? Math.round((completed / filteredTasks.length) * 100) : 0;
  const pendingHomework = homework.filter(h => !h.completed).length;
  const activeBooks = readingList.filter(b => !b.completed).length;
  const routineDone = routine.filter(r => r.completed).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const renderTask = ({ item }) => (
    <Animated.View style={[styles.taskCard, { opacity: fadeAnim, backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
      <TouchableOpacity onPress={() => toggleComplete(item.id, item.completed)} style={styles.checkbox}>
        <Feather name={item.completed ? 'check-circle' : 'circle'} size={24} color={item.completed ? COLORS.primary : COLORS.gray} />
      </TouchableOpacity>
      <View style={styles.taskContent}>
        <Text style={[styles.taskTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }, item.completed && styles.completedTask]}>{item.title}</Text>
        {item.description ? <Text style={[styles.taskDescription, { color: COLORS.gray }]} numberOfLines={1}>{item.description}</Text> : null}
        <View style={styles.taskMeta}>
          <View style={styles.metaItem}><Feather name="calendar" size={12} color={COLORS.gray} /><Text style={[styles.taskTime, { color: COLORS.gray }]}>{item.date || 'No date'}</Text></View>
          {item.category && <View style={[styles.categoryBadge, { backgroundColor: categories.find(c => c.id === item.category)?.color + '20' }]}><Text style={[styles.categoryBadgeText, { color: categories.find(c => c.id === item.category)?.color }]}>{item.category}</Text></View>}
        </View>
      </View>
      <TouchableOpacity onPress={() => deleteTask(item.id)}><Feather name="trash-2" size={20} color={COLORS.gray} /></TouchableOpacity>
    </Animated.View>
  );

  if (loading) return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? COLORS.background : LIGHT_COLORS.background, justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? COLORS.background : LIGHT_COLORS.background }]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeHeader}>
          <View><Text style={[styles.greetingText, { color: COLORS.gray }]}>{getGreeting()},</Text><Text style={[styles.userName, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>{user?.name || 'User'}! 👋</Text></View>
          <View style={[styles.premiumBadge, { backgroundColor: COLORS.primary + '20' }]}><FontAwesome5 name="crown" size={14} color={COLORS.gold} /><Text style={styles.premiumText}>PREMIUM</Text></View>
        </View>

        <View style={styles.quickStatsRow}>
          <View style={[styles.quickStat, { backgroundColor: COLORS.routine + '15' }]}><Feather name="sunrise" size={20} color={COLORS.routine} /><Text style={[styles.quickStatNumber, { color: COLORS.routine }]}>{routineDone}/10</Text><Text style={styles.quickStatLabel}>Routine</Text></View>
          <View style={[styles.quickStat, { backgroundColor: COLORS.school + '15' }]}><Feather name="book" size={20} color={COLORS.school} /><Text style={[styles.quickStatNumber, { color: COLORS.school }]}>{pendingHomework}</Text><Text style={styles.quickStatLabel}>Homework</Text></View>
          <View style={[styles.quickStat, { backgroundColor: COLORS.reading + '15' }]}><Feather name="book-open" size={20} color={COLORS.reading} /><Text style={[styles.quickStatNumber, { color: COLORS.reading }]}>{activeBooks + pdfBooks.length}</Text><Text style={styles.quickStatLabel}>Books</Text></View>
        </View>

        <View style={[styles.progressCard, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
          <Text style={[styles.progressTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>Today's Progress</Text>
          <View style={styles.progressBarContainer}><View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: COLORS.primary }]} /></View>
          <Text style={[styles.progressStats, { color: COLORS.gray }]}>{completed}/{filteredTasks.length} tasks • {progress}%</Text>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
          <Feather name="search" size={18} color={COLORS.gray} />
          <TextInput placeholder="Search tasks..." placeholderTextColor={COLORS.gray} style={[styles.searchInput, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]} value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          <TouchableOpacity style={[styles.categoryChip, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }, selectedCategory === 'all' && { backgroundColor: COLORS.primary }]} onPress={() => setSelectedCategory('all')}><Text style={[styles.categoryChipText, selectedCategory === 'all' && styles.categoryChipTextActive]}>All</Text></TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity key={cat.id} style={[styles.categoryChip, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }, selectedCategory === cat.id && { backgroundColor: COLORS.primary }]} onPress={() => setSelectedCategory(cat.id)}>
              <Feather name={cat.icon} size={14} color={selectedCategory === cat.id ? '#000' : cat.color} />
              <Text style={[styles.categoryChipText, selectedCategory === cat.id && styles.categoryChipTextActive]}>{cat.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <FlatList data={filteredTasks} keyExtractor={item => item.id} renderItem={renderTask} scrollEnabled={false}
          ListEmptyComponent={<View style={styles.emptyContainer}><Ionicons name="clipboard-outline" size={80} color={COLORS.gray} /><Text style={[styles.emptyText, { color: COLORS.gray }]}>No tasks yet</Text><Text style={[styles.emptySubtext, { color: COLORS.gray }]}>Tap + to add</Text></View>}
        />
      </ScrollView>
      <TouchableOpacity style={[styles.fab, { backgroundColor: COLORS.primary }]} onPress={() => navigation.navigate('AddTask', { onTaskAdded: loadTasks })}>
        <Feather name="plus" size={28} color="#000" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ============ ADD TASK SCREEN ============
function AddTaskScreen({ navigation, route }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [reminder, setReminder] = useState(false);
  const [priority, setPriority] = useState('medium');
  const [selectedCategory, setSelectedCategory] = useState('personal');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useContext(AuthContext);
  const { darkMode } = useContext(ThemeContext);

  const saveTask = async () => {
    if (!title.trim()) { Alert.alert('Error', 'Please enter task title'); return; }
    setIsLoading(true);
    const newTask = {
      id: Date.now().toString(), user_id: user.id, title: title.trim(), description: description || '',
      date: date.toLocaleDateString(), time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reminder, completed: false, priority, category: selectedCategory, created_at: new Date().toISOString(),
    };
    try {
      const { error } = await supabase.from('tasks').insert([newTask]);
      if (error) throw error;
      Alert.alert('Success', 'Task added!');
      if (route.params?.onTaskAdded) route.params.onTaskAdded();
      navigation.goBack();
    } catch (error) { Alert.alert('Error', 'Failed to save task'); } finally { setIsLoading(false); }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? COLORS.background : LIGHT_COLORS.background }]}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Feather name="arrow-left" size={28} color={darkMode ? COLORS.white : LIGHT_COLORS.text} /></TouchableOpacity>
        <Text style={[styles.modalTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>New Task</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView>
        <TextInput placeholder="Task title" placeholderTextColor={COLORS.gray} style={[styles.input, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card, color: darkMode ? COLORS.white : LIGHT_COLORS.text }]} value={title} onChangeText={setTitle} />
        <TextInput placeholder="Description" placeholderTextColor={COLORS.gray} style={[styles.input, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card, color: darkMode ? COLORS.white : LIGHT_COLORS.text, height: 100 }]} multiline value={description} onChangeText={setDescription} />

        <Text style={[styles.inputLabel, { color: COLORS.gray }]}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelect}>
          {categories.map(cat => (
            <TouchableOpacity key={cat.id} style={[styles.categorySelectItem, { borderColor: darkMode ? COLORS.card : LIGHT_COLORS.border }, selectedCategory === cat.id && { borderColor: cat.color, backgroundColor: cat.color + '20' }]} onPress={() => setSelectedCategory(cat.id)}>
              <Feather name={cat.icon} size={20} color={selectedCategory === cat.id ? cat.color : COLORS.gray} />
              <Text style={[styles.categorySelectText, { color: selectedCategory === cat.id ? cat.color : COLORS.gray }]}>{cat.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.inputLabel, { color: COLORS.gray }]}>Priority</Text>
        <View style={styles.priorityRow}>
          {['low', 'medium', 'high'].map(p => (
            <TouchableOpacity key={p} style={[styles.priorityBtn, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }, priority === p && { backgroundColor: p === 'high' ? COLORS.high : p === 'medium' ? COLORS.medium : COLORS.low }]} onPress={() => setPriority(p)}>
              <Text style={styles.priorityBtnText}>{p.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.dateBtn, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]} onPress={() => setShowDate(true)}><Feather name="calendar" size={20} color={COLORS.primary} /><Text style={[styles.dateBtnText, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>{date.toLocaleDateString()}</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.dateBtn, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]} onPress={() => setShowTime(true)}><Feather name="clock" size={20} color={COLORS.primary} /><Text style={[styles.dateBtnText, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text></TouchableOpacity>

        {showDate && <DateTimePicker value={date} mode="date" onChange={(e, selected) => { setShowDate(false); if (selected) setDate(selected); }} />}
        {showTime && <DateTimePicker value={time} mode="time" onChange={(e, selected) => { setShowTime(false); if (selected) setTime(selected); }} />}

        <View style={[styles.reminderBox, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
          <Text style={[styles.reminderText, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>🔔 Set Reminder</Text>
          <Switch value={reminder} onValueChange={setReminder} trackColor={{ false: '#767577', true: COLORS.primary }} />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={saveTask} disabled={isLoading}>
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={[styles.gradientBtn, { opacity: isLoading ? 0.7 : 1 }]}>
            <Text style={styles.saveBtnText}>{isLoading ? 'Saving...' : '✨ Create Task'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============ ROUTINE SCREEN ============
function RoutineScreen() {
  const { routine, routineProgress, toggleRoutine, resetRoutine } = useContext(RoutineContext);
  const { darkMode } = useContext(ThemeContext);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? COLORS.background : LIGHT_COLORS.background }]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
      <ScrollView>
        <Text style={[styles.pageTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>Daily Routine</Text>
        <View style={[styles.routineProgressCard, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
          <Text style={[styles.routineProgressTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>Today's Progress</Text>
          <View style={styles.routineProgressBarContainer}><View style={[styles.routineProgressBar, { width: `${routineProgress}%`, backgroundColor: COLORS.routine }]} /></View>
          <Text style={[styles.routineProgressText, { color: COLORS.gray }]}>{routineProgress}% Complete</Text>
        </View>
        {routine.map((item) => (
          <View key={item.id} style={[styles.routineItem, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
            <TouchableOpacity onPress={() => toggleRoutine(item.id)} style={styles.routineCheckbox}>
              <Feather name={item.completed ? 'check-circle' : 'circle'} size={24} color={item.completed ? COLORS.routine : COLORS.gray} />
            </TouchableOpacity>
            <View style={styles.routineContent}>
              <Text style={[styles.routineTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }, item.completed && styles.completedTask]}>{item.title}</Text>
              <Text style={[styles.routineTime, { color: COLORS.gray }]}>{item.time}</Text>
            </View>
            <FontAwesome5 name={item.icon} size={20} color={item.completed ? COLORS.routine : COLORS.gray} />
          </View>
        ))}
        <TouchableOpacity style={[styles.routineResetBtn, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]} onPress={resetRoutine}>
          <Feather name="refresh-cw" size={18} color={COLORS.danger} /><Text style={[styles.routineResetText, { color: COLORS.danger }]}>Reset Daily Routine</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============ SCHOOL SCREEN ============
function SchoolScreen() {
  const { schedule, homework, addHomework, toggleHomework, deleteHomework, weekDays } = useContext(SchoolContext);
  const { darkMode } = useContext(ThemeContext);
  const [selectedDay, setSelectedDay] = useState(weekDays[new Date().getDay() - 1] || 'Monday');
  const [showAddHomework, setShowAddHomework] = useState(false);
  const [homeworkSubject, setHomeworkSubject] = useState('');
  const [homeworkDesc, setHomeworkDesc] = useState('');
  const [homeworkDue, setHomeworkDue] = useState(new Date());

  const filteredSchedule = schedule.filter(s => s.day === selectedDay);
  const todayHomework = homework.filter(h => !h.completed);

  const handleAddHomework = () => {
    if (!homeworkSubject || !homeworkDesc) { Alert.alert('Error', 'Please fill all fields'); return; }
    addHomework(homeworkSubject, homeworkDesc, homeworkDue.toLocaleDateString());
    setShowAddHomework(false);
    setHomeworkSubject('');
    setHomeworkDesc('');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? COLORS.background : LIGHT_COLORS.background }]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
      <ScrollView>
        <Text style={[styles.pageTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>School Schedule</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelector}>
          {weekDays.map(day => (
            <TouchableOpacity key={day} style={[styles.dayChip, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }, selectedDay === day && { backgroundColor: COLORS.school }]} onPress={() => setSelectedDay(day)}>
              <Text style={[styles.dayChipText, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }, selectedDay === day && styles.dayChipTextActive]}>{day.slice(0, 3)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={[styles.scheduleSection, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
          <Text style={[styles.sectionTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>📅 {selectedDay}'s Classes</Text>
          {filteredSchedule.map(cls => (
            <View key={cls.id} style={styles.scheduleItem}>
              <View style={styles.scheduleTimeBox}><Text style={[styles.scheduleTime, { color: COLORS.school }]}>{cls.time}</Text></View>
              <View style={styles.scheduleInfo}>
                <Text style={[styles.scheduleSubject, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>{cls.subject}</Text>
                <Text style={[styles.scheduleDetail, { color: COLORS.gray }]}>{cls.teacher || 'Teacher'} • Room {cls.room || 'N/A'}</Text>
              </View>
            </View>
          ))}
        </View>
        <View style={[styles.homeworkSection, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
          <View style={styles.homeworkHeader}>
            <Text style={[styles.sectionTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>📝 Homework</Text>
            <TouchableOpacity style={styles.addHomeworkBtn} onPress={() => setShowAddHomework(true)}><Feather name="plus" size={20} color={COLORS.white} /></TouchableOpacity>
          </View>
          {todayHomework.map(hw => (
            <View key={hw.id} style={styles.homeworkItem}>
              <TouchableOpacity onPress={() => toggleHomework(hw.id)}><Feather name={hw.completed ? 'check-circle' : 'circle'} size={20} color={hw.completed ? COLORS.success : COLORS.school} /></TouchableOpacity>
              <View style={styles.homeworkContent}>
                <Text style={[styles.homeworkSubject, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>{hw.subject}</Text>
                <Text style={[styles.homeworkDesc, { color: COLORS.gray }]}>{hw.description}</Text>
                <Text style={[styles.homeworkDue, { color: COLORS.warning }]}>Due: {hw.dueDate}</Text>
              </View>
              <TouchableOpacity onPress={() => deleteHomework(hw.id)}><Feather name="trash-2" size={16} color={COLORS.gray} /></TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
      <Modal visible={showAddHomework} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
            <Text style={[styles.modalTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>Add Homework</Text>
            <TextInput placeholder="Subject" style={[styles.modalInput, { backgroundColor: darkMode ? COLORS.cardLight : LIGHT_COLORS.border, color: darkMode ? COLORS.white : LIGHT_COLORS.text }]} value={homeworkSubject} onChangeText={setHomeworkSubject} />
            <TextInput placeholder="Description" style={[styles.modalInput, { backgroundColor: darkMode ? COLORS.cardLight : LIGHT_COLORS.border, color: darkMode ? COLORS.white : LIGHT_COLORS.text }]} value={homeworkDesc} onChangeText={setHomeworkDesc} multiline />
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: COLORS.school }]} onPress={handleAddHomework}><Text style={styles.modalButtonText}>Add Homework</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.modalCancel, { borderColor: COLORS.gray }]} onPress={() => setShowAddHomework(false)}><Text style={[styles.modalCancelText, { color: COLORS.gray }]}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ============ READING SCREEN ============
function ReadingScreen() {
  const { readingList, pdfBooks, addBook, addPdfBook, updateProgress, deleteBook, deletePdfBook, openPdf } = useContext(ReadingContext);
  const { darkMode } = useContext(ThemeContext);
  const [showAddBook, setShowAddBook] = useState(false);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookPages, setBookPages] = useState('');
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [pagesRead, setPagesRead] = useState('');

  const handleAddBook = () => {
    if (!bookTitle || !bookAuthor || !bookPages) { Alert.alert('Error', 'Please fill all fields'); return; }
    addBook(bookTitle, bookAuthor, bookPages);
    setShowAddBook(false);
    setBookTitle('');
    setBookAuthor('');
    setBookPages('');
  };

  const handleUpdateProgress = () => {
    if (!pagesRead || parseInt(pagesRead) <= 0) { Alert.alert('Error', 'Enter valid pages'); return; }
    updateProgress(selectedBook.id, parseInt(pagesRead));
    setShowProgressModal(false);
    setPagesRead('');
    setSelectedBook(null);
  };

  const pickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (result.canceled === false) {
        const pdf = result.assets[0];
        await addPdfBook(pdf.uri, pdf.name);
      }
    } catch (error) { Alert.alert('Error', 'Failed to load PDF'); }
  };

  const totalPages = readingList.reduce((sum, book) => sum + book.totalPages, 0);
  const totalRead = readingList.reduce((sum, book) => sum + book.currentPage, 0);
  const readingProgress = totalPages > 0 ? Math.round((totalRead / totalPages) * 100) : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? COLORS.background : LIGHT_COLORS.background }]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
      <ScrollView>
        <Text style={[styles.pageTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>Reading List</Text>
        <View style={[styles.readingStatsCard, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
          <View style={styles.readingStatsRow}>
            <View style={styles.readingStatItem}><Text style={[styles.readingStatNumber, { color: COLORS.reading }]}>{readingList.length + pdfBooks.length}</Text><Text style={[styles.readingStatLabel, { color: COLORS.gray }]}>Books</Text></View>
            <View style={styles.readingStatItem}><Text style={[styles.readingStatNumber, { color: COLORS.reading }]}>{totalRead}</Text><Text style={[styles.readingStatLabel, { color: COLORS.gray }]}>Pages Read</Text></View>
            <View style={styles.readingStatItem}><Text style={[styles.readingStatNumber, { color: COLORS.reading }]}>{readingProgress}%</Text><Text style={[styles.readingStatLabel, { color: COLORS.gray }]}>Progress</Text></View>
          </View>
          <View style={styles.readingProgressBarContainer}><View style={[styles.readingProgressBar, { width: `${readingProgress}%`, backgroundColor: COLORS.reading }]} /></View>
        </View>
        <TouchableOpacity style={[styles.addBookBtn, { backgroundColor: COLORS.reading }]} onPress={() => setShowAddBook(true)}><Feather name="plus" size={20} color="#000" /><Text style={styles.addBookBtnText}>Add New Book</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.addPdfBtn, { backgroundColor: COLORS.reading + '80' }]} onPress={pickPdf}><Feather name="file-text" size={20} color="#000" /><Text style={styles.addPdfBtnText}>Upload PDF Book</Text></TouchableOpacity>

        {readingList.map(book => {
          const bookProgress = Math.round((book.currentPage / book.totalPages) * 100);
          return (
            <View key={book.id} style={[styles.bookCard, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
              <View style={styles.bookHeader}>
                <View style={styles.bookIcon}><FontAwesome5 name="book" size={24} color={COLORS.reading} /></View>
                <View style={styles.bookInfo}><Text style={[styles.bookTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>{book.title}</Text><Text style={[styles.bookAuthor, { color: COLORS.gray }]}>by {book.author}</Text></View>
                <TouchableOpacity onPress={() => deleteBook(book.id)}><Feather name="trash-2" size={18} color={COLORS.gray} /></TouchableOpacity>
              </View>
              <View style={styles.bookProgressContainer}>
                <View style={styles.bookProgressBarBg}><View style={[styles.bookProgressBar, { width: `${bookProgress}%`, backgroundColor: COLORS.reading }]} /></View>
                <Text style={[styles.bookProgressText, { color: COLORS.gray }]}>{book.currentPage}/{book.totalPages} pages ({bookProgress}%)</Text>
              </View>
              {!book.completed && (
                <TouchableOpacity style={[styles.updateProgressBtn, { borderColor: COLORS.reading }]} onPress={() => { setSelectedBook(book); setShowProgressModal(true); }}>
                  <Text style={[styles.updateProgressText, { color: COLORS.reading }]}>Update Progress</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {pdfBooks.map(book => (
          <View key={book.id} style={[styles.bookCard, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
            <View style={styles.bookHeader}>
              <View style={[styles.bookIcon, { backgroundColor: COLORS.reading + '20' }]}><Feather name="file-text" size={24} color={COLORS.reading} /></View>
              <View style={styles.bookInfo}><Text style={[styles.bookTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>{book.title}</Text><Text style={[styles.bookAuthor, { color: COLORS.gray }]}>PDF Document</Text></View>
              <TouchableOpacity onPress={() => deletePdfBook(book.id)}><Feather name="trash-2" size={18} color={COLORS.gray} /></TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.openPdfBtn, { backgroundColor: COLORS.reading + '15' }]} onPress={() => openPdf(book.uri)}>
              <Feather name="eye" size={16} color={COLORS.reading} /><Text style={[styles.openPdfText, { color: COLORS.reading }]}>Open PDF</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal visible={showAddBook} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
            <Text style={[styles.modalTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>Add New Book</Text>
            <TextInput placeholder="Book Title" style={[styles.modalInput, { backgroundColor: darkMode ? COLORS.cardLight : LIGHT_COLORS.border, color: darkMode ? COLORS.white : LIGHT_COLORS.text }]} value={bookTitle} onChangeText={setBookTitle} />
            <TextInput placeholder="Author" style={[styles.modalInput, { backgroundColor: darkMode ? COLORS.cardLight : LIGHT_COLORS.border, color: darkMode ? COLORS.white : LIGHT_COLORS.text }]} value={bookAuthor} onChangeText={setBookAuthor} />
            <TextInput placeholder="Total Pages" style={[styles.modalInput, { backgroundColor: darkMode ? COLORS.cardLight : LIGHT_COLORS.border, color: darkMode ? COLORS.white : LIGHT_COLORS.text }]} value={bookPages} onChangeText={setBookPages} keyboardType="numeric" />
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: COLORS.reading }]} onPress={handleAddBook}><Text style={styles.modalButtonText}>Add Book</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.modalCancel, { borderColor: COLORS.gray }]} onPress={() => setShowAddBook(false)}><Text style={[styles.modalCancelText, { color: COLORS.gray }]}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showProgressModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
            <Text style={[styles.modalTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>Update Reading Progress</Text>
            <Text style={[styles.modalSubtitle, { color: COLORS.gray }]}>{selectedBook?.title}</Text>
            <TextInput placeholder="Pages read" style={[styles.modalInput, { backgroundColor: darkMode ? COLORS.cardLight : LIGHT_COLORS.border, color: darkMode ? COLORS.white : LIGHT_COLORS.text }]} value={pagesRead} onChangeText={setPagesRead} keyboardType="numeric" />
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: COLORS.reading }]} onPress={handleUpdateProgress}><Text style={styles.modalButtonText}>Update</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.modalCancel, { borderColor: COLORS.gray }]} onPress={() => { setShowProgressModal(false); setPagesRead(''); }}><Text style={[styles.modalCancelText, { color: COLORS.gray }]}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ============ PROFILE SCREEN ============
function ProfileScreen({ navigation }) {
  const { user, logout, updateUserAvatar } = useContext(AuthContext);
  const { darkMode, setDarkMode } = useContext(ThemeContext);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Please grant gallery permission'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5 });
      if (!result.canceled) {
        setUploading(true);
        const image = result.assets[0];
        const response = await fetch(image.uri);
        const blob = await response.blob();
        const fileName = `${user.id}_${Date.now()}.jpg`;
        const { error } = await supabase.storage.from('avatars').upload(fileName, blob, { contentType: image.mimeType, upsert: true });
        if (error) throw error;
        const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
        await updateUserAvatar(data.publicUrl);
        Alert.alert('Success', 'Profile photo updated!');
      }
    } catch (error) { Alert.alert('Error', 'Failed to upload image'); } finally { setUploading(false); }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Logout', onPress: () => { logout(); navigation.replace('Login'); } }
    ]);
  };

  const memberSince = user?.join_date ? new Date(user.join_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? COLORS.background : LIGHT_COLORS.background }]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
      <ScrollView>
        <View style={[styles.profileHeader, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
          <TouchableOpacity onPress={pickImage} disabled={uploading}>
            <View style={[styles.profileAvatar, { backgroundColor: COLORS.primary }]}>
              {user?.avatar_url ? <Image source={{ uri: user.avatar_url }} style={styles.profileAvatarImage} /> : <Text style={styles.profileAvatarText}>{user?.name?.[0] || 'U'}</Text>}
              <View style={styles.cameraIcon}><Feather name="camera" size={16} color="#000" /></View>
            </View>
          </TouchableOpacity>
          {uploading && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 10 }} />}
          <Text style={[styles.profileName, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>{user?.name}</Text>
          <Text style={[styles.profileEmail, { color: COLORS.gray }]}>{user?.email}</Text>
          <View style={[styles.memberSince, { backgroundColor: COLORS.primary + '15' }]}><Text style={[styles.memberSinceText, { color: COLORS.primary }]}>Member since {memberSince}</Text></View>
          <View style={[styles.premiumCard, { backgroundColor: COLORS.primary + '20' }]}><FontAwesome5 name="crown" size={18} color={COLORS.gold} /><Text style={styles.premiumCardText}>Premium Member</Text></View>
        </View>
        <View style={[styles.settingsSection, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
          <Text style={[styles.settingsTitle, { color: COLORS.gray }]}>Preferences</Text>
          <View style={[styles.settingItem, { borderBottomColor: darkMode ? COLORS.dark : LIGHT_COLORS.border }]}>
            <View style={styles.settingLeft}><Feather name="moon" size={20} color={COLORS.primary} /><Text style={[styles.settingText, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>Dark Mode</Text></View>
            <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ false: '#767577', true: COLORS.primary }} />
          </View>
        </View>
        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]} onPress={handleLogout}>
          <Feather name="log-out" size={20} color={COLORS.danger} /><Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        <Text style={[styles.versionText, { color: COLORS.gray }]}>Keynan v2.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============ MAIN APP ============
function MainApp() {
  const { darkMode } = useContext(ThemeContext);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card, height: 60, borderTopWidth: 0 },
        tabBarShowLabel: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
      }}>
      <Tab.Screen name="Home" options={{ tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} /> }}>{props => <HomeScreen {...props} navigation={props.navigation} />}</Tab.Screen>
      <Tab.Screen name="Routine" options={{ tabBarIcon: ({ color, size }) => <Feather name="sunrise" size={size} color={color} /> }}>{props => <RoutineScreen {...props} />}</Tab.Screen>
      <Tab.Screen name="School" options={{ tabBarIcon: ({ color, size }) => <Feather name="book" size={size} color={color} /> }}>{props => <SchoolScreen {...props} />}</Tab.Screen>
      <Tab.Screen name="Reading" options={{ tabBarIcon: ({ color, size }) => <Feather name="book-open" size={size} color={color} /> }}>{props => <ReadingScreen {...props} />}</Tab.Screen>
      <Tab.Screen name="Profile" options={{ tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} /> }}>{props => <ProfileScreen {...props} navigation={props.navigation} />}</Tab.Screen>
      <Tab.Screen name="AddTask" options={{ tabBarButton: () => null }}>{props => <AddTaskScreen {...props} navigation={props.navigation} route={props.route} />}</Tab.Screen>
    </Tab.Navigator>
  );
}

// ============ APP ============
export default function App() {
  const [isReady, setIsReady] = useState(false);
  useEffect(() => { setTimeout(() => setIsReady(true), 500); }, []);

  if (!isReady) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.splashText, { color: COLORS.primary }]}>Keynan</Text>
        <Text style={styles.splashSubtext}>Study • Routine • Read</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <RoutineProvider>
            <SchoolProvider>
              <ReadingProvider>
                <NavigationContainer>
                  <AuthContext.Consumer>
                    {({ user, loading }) => {
                      if (loading) return <View style={styles.splashContainer}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
                      return user ? <MainApp /> : <LoginScreen navigation={{ replace: () => {} }} />;
                    }}
                  </AuthContext.Consumer>
                </NavigationContainer>
              </ReadingProvider>
            </SchoolProvider>
          </RoutineProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  splashContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  splashText: { fontSize: 32, fontWeight: 'bold', marginTop: 20 },
  splashSubtext: { color: COLORS.gray, fontSize: 14, marginTop: 8 },
  loginContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loginContent: { width: width - 40, alignItems: 'center' },
  logoCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  loginTitle: { fontSize: 32, fontWeight: 'bold', marginTop: 10 },
  loginSubtitle: { marginBottom: 30, textAlign: 'center' },
  loginInput: { width: '100%', borderRadius: 15, padding: 15, marginBottom: 12 },
  loginButton: { width: '100%', padding: 16, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  loginButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  loginSwitch: { marginTop: 20 },
  welcomeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 20 },
  greetingText: { fontSize: 14 },
  userName: { fontSize: 24, fontWeight: 'bold' },
  premiumBadge: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignItems: 'center', gap: 6 },
  premiumText: { color: COLORS.gold, fontWeight: 'bold', fontSize: 12 },
  quickStatsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  quickStat: { flex: 1, borderRadius: 16, padding: 12, alignItems: 'center' },
  quickStatNumber: { fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  quickStatLabel: { fontSize: 10, marginTop: 2, color: COLORS.gray },
  progressCard: { borderRadius: 20, padding: 16, marginBottom: 20 },
  progressTitle: { fontWeight: '600', marginBottom: 10 },
  progressBarContainer: { height: 8, backgroundColor: COLORS.dark, borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 4 },
  progressStats: { fontSize: 12, marginTop: 8 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, marginBottom: 16 },
  searchInput: { flex: 1, paddingVertical: 12, marginLeft: 8 },
  categoryScroll: { flexDirection: 'row', marginBottom: 20 },
  categoryChip: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 25, marginRight: 10, gap: 6 },
  categoryChipText: { fontWeight: '500', color: COLORS.gray },
  categoryChipTextActive: { color: '#000', fontWeight: '600' },
  taskCard: { borderRadius: 16, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'flex-start' },
  checkbox: { marginRight: 12 },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: '600' },
  completedTask: { textDecorationLine: 'line-through', color: COLORS.gray },
  taskDescription: { fontSize: 13, marginTop: 4 },
  taskMeta: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  taskTime: { fontSize: 11, marginLeft: 4 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  categoryBadgeText: { fontSize: 10, fontWeight: '600' },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 18, marginTop: 15 },
  emptySubtext: { marginTop: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  input: { borderRadius: 12, padding: 14, marginBottom: 16 },
  inputLabel: { marginBottom: 8, fontSize: 14 },
  categorySelect: { flexDirection: 'row', marginBottom: 16 },
  categorySelectItem: { alignItems: 'center', marginRight: 16, padding: 10, borderRadius: 12, borderWidth: 1 },
  categorySelectText: { fontSize: 12, marginTop: 4 },
  priorityRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  priorityBtn: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center' },
  priorityBtnText: { color: '#000', fontSize: 12, fontWeight: '600' },
  dateBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 12, gap: 10 },
  dateBtnText: { fontSize: 14 },
  reminderBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 20 },
  reminderText: { fontSize: 14 },
  saveBtn: { marginBottom: 40 },
  gradientBtn: { padding: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  tabBar: { borderTopWidth: 0, height: 60, paddingBottom: 8 },
  routineProgressCard: { borderRadius: 20, padding: 16, marginBottom: 20 },
  routineProgressTitle: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  routineProgressBarContainer: { height: 8, backgroundColor: COLORS.dark, borderRadius: 4, overflow: 'hidden' },
  routineProgressBar: { height: '100%', borderRadius: 4 },
  routineProgressText: { fontSize: 12, marginTop: 8, textAlign: 'right' },
  routineItem: { borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  routineCheckbox: { marginRight: 12 },
  routineContent: { flex: 1 },
  routineTitle: { fontSize: 16, fontWeight: '500' },
  routineTime: { fontSize: 12, marginTop: 2 },
  routineResetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, marginTop: 20 },
  routineResetText: { fontWeight: '500' },
  daySelector: { flexDirection: 'row', marginBottom: 20 },
  dayChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  dayChipText: { fontSize: 14, fontWeight: '500' },
  dayChipTextActive: { color: '#000', fontWeight: '600' },
  scheduleSection: { borderRadius: 20, padding: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  scheduleItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.dark },
  scheduleTimeBox: { width: 80 },
  scheduleTime: { fontSize: 12, fontWeight: '600' },
  scheduleInfo: { flex: 1, marginLeft: 12 },
  scheduleSubject: { fontSize: 14, fontWeight: '500' },
  scheduleDetail: { fontSize: 10, marginTop: 2 },
  homeworkSection: { borderRadius: 20, padding: 16, marginBottom: 20 },
  homeworkHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addHomeworkBtn: { backgroundColor: COLORS.school, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  homeworkItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, gap: 10 },
  homeworkContent: { flex: 1 },
  homeworkSubject: { fontSize: 14, fontWeight: '500' },
  homeworkDesc: { fontSize: 12, marginTop: 2 },
  homeworkDue: { fontSize: 10, marginTop: 2 },
  readingStatsCard: { borderRadius: 20, padding: 16, marginBottom: 20 },
  readingStatsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  readingStatItem: { alignItems: 'center' },
  readingStatNumber: { fontSize: 28, fontWeight: 'bold' },
  readingStatLabel: { fontSize: 12, marginTop: 4 },
  readingProgressBarContainer: { height: 8, backgroundColor: COLORS.dark, borderRadius: 4, overflow: 'hidden' },
  readingProgressBar: { height: '100%', borderRadius: 4 },
  addBookBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, marginBottom: 12 },
  addBookBtnText: { color: '#000', fontWeight: '600' },
  addPdfBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, marginBottom: 12 },
  addPdfBtnText: { color: '#000', fontWeight: '600' },
  bookCard: { borderRadius: 16, padding: 16, marginBottom: 12 },
  bookHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  bookIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.reading + '20', justifyContent: 'center', alignItems: 'center' },
  bookInfo: { flex: 1, marginLeft: 12 },
  bookTitle: { fontSize: 16, fontWeight: '600' },
  bookAuthor: { fontSize: 12, marginTop: 2 },
  bookProgressContainer: { marginBottom: 12 },
  bookProgressBarBg: { height: 6, backgroundColor: COLORS.dark, borderRadius: 3, overflow: 'hidden' },
  bookProgressBar: { height: '100%', borderRadius: 3 },
  bookProgressText: { fontSize: 10, marginTop: 6, textAlign: 'right' },
  updateProgressBtn: { borderWidth: 1, padding: 8, borderRadius: 8, alignItems: 'center' },
  updateProgressText: { fontSize: 12, fontWeight: '500' },
  openPdfBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 8 },
  openPdfText: { fontSize: 14, fontWeight: '500' },
  profileHeader: { borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20 },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  profileAvatarImage: { width: 80, height: 80, borderRadius: 40 },
  profileAvatarText: { fontSize: 36, fontWeight: 'bold', color: '#000' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.white, borderRadius: 15, padding: 5 },
  profileName: { fontSize: 24, fontWeight: 'bold', marginTop: 12 },
  profileEmail: { marginTop: 4 },
  memberSince: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 8 },
  memberSinceText: { fontSize: 10 },
  premiumCard: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 12, gap: 8 },
  premiumCardText: { color: COLORS.gold, fontWeight: 'bold' },
  settingsSection: { borderRadius: 20, padding: 16, marginBottom: 20 },
  settingsTitle: { fontSize: 14, marginBottom: 12 },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingText: { fontSize: 16 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 12, marginBottom: 20 },
  logoutText: { color: COLORS.danger, fontSize: 16, fontWeight: '600' },
  versionText: { textAlign: 'center', marginBottom: 30 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: width - 40, borderRadius: 24, padding: 20 },
  modalSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 16 },
  modalInput: { borderRadius: 12, padding: 14, marginBottom: 12 },
  modalButton: { padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  modalButtonText: { color: '#000', fontWeight: '600' },
  modalCancel: { padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  modalCancelText: { fontWeight: '500' },
});
