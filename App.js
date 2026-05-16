import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  Alert, ScrollView, Switch, Dimensions, Animated, StatusBar, ActivityIndicator,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { createClient } from '@supabase/supabase-js';
import * as Notifications from 'expo-notifications';
import 'react-native-url-polyfill/auto';

const { width } = Dimensions.get('window');
const Tab = createBottomTabNavigator();

// ============ SUPABASE CONFIGURATION ============
const SUPABASE_URL = 'https://bwmvrsasculzivdcqyvi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_jC1Yhl9CMcnATcBtTRvwmQ_dM2QRr-j';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============ NOTIFICATIONS CONFIGURATION ============
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('tasks', {
      name: 'Task Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#007AFF',
    });
  }

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    return false;
  }
  return true;
}

// ============ COLORS (Blue & Black Theme) ============
const COLORS = {
  background: '#000000',
  backgroundLight: '#0A0A0A',
  card: '#111111',
  cardLight: '#1A1A1A',
  primary: '#007AFF',
  primaryDark: '#0055CC',
  primaryLight: '#4CA3FF',
  white: '#FFFFFF',
  gray: '#8E8E93',
  dark: '#1C1C1E',
  success: '#34C759',
  warning: '#FFCC00',
  danger: '#FF3B30',
  purple: '#5856D6',
  orange: '#FF9500',
  gold: '#FFD60A',
};

const categories = [
  { id: 'study', title: 'Study', icon: 'book-open', color: '#007AFF' },
  { id: 'work', title: 'Work', icon: 'briefcase', color: '#5856D6' },
  { id: 'personal', title: 'Personal', icon: 'heart', color: '#FF3B30' },
  { id: 'gym', title: 'Gym', icon: 'activity', color: '#34C759' },
  { id: 'shopping', title: 'Shopping', icon: 'shopping-bag', color: '#FF9500' },
];

// Light mode colors
const LIGHT_COLORS = {
  background: '#F5F5F5',
  card: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#666666',
  border: '#E0E0E0',
};

// ============ AUTH CONTEXT ============
const AuthContext = createContext();
const ThemeContext = createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('@current_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error) throw error;
      
      if (data) {
        setUser(data);
        await AsyncStorage.setItem('@current_user', JSON.stringify(data));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const signup = async (name, email, password) => {
    try {
      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password,
        premium: true,
        join_date: new Date().toISOString(),
      };

      const { error } = await supabase.from('users').insert([newUser]);
      if (error) throw error;

      setUser(newUser);
      await AsyncStorage.setItem('@current_user', JSON.stringify(newUser));
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('@current_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
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
  
  const theme = darkMode ? COLORS : LIGHT_COLORS;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (showSignup && !name) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setIsLoading(true);
    let success;
    if (showSignup) success = await signup(name, email, password);
    else success = await login(email, password);
    setIsLoading(false);

    if (success) {
      navigation.replace('MainApp');
    } else {
      Alert.alert('Error', showSignup ? 'Email already exists' : 'Invalid credentials');
    }
  };

  const handleForgotPassword = () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address first');
      return;
    }
    Alert.alert('Reset Password', `Send reset link to ${email}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send', onPress: async () => {
        Alert.alert('Success', `Password reset link sent to ${email}`);
      }}
    ]);
  };

  return (
    <View style={[styles.loginContainer, { backgroundColor: darkMode ? COLORS.background : LIGHT_COLORS.background }]}>
      <Animated.View style={[styles.loginContent, { opacity: fadeAnim }]}>
        <View style={[styles.logoCircle, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
          <FontAwesome5 name="rocket" size={50} color={COLORS.primary} />
        </View>
        <Text style={[styles.loginTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>Keynan</Text>
        <Text style={[styles.loginSubtitle, { color: darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary }]}>Modern Productivity Planner</Text>

        {showSignup && (
          <TextInput
            placeholder="Full Name"
            placeholderTextColor={darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary}
            style={[styles.loginInput, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card, color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}
            value={name}
            onChangeText={setName}
          />
        )}
        
        <TextInput
          placeholder="Email"
          placeholderTextColor={darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary}
          style={[styles.loginInput, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card, color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput
          placeholder="Password"
          placeholderTextColor={darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary}
          style={[styles.loginInput, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card, color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={[styles.loginButton, { backgroundColor: COLORS.primary }]} onPress={handleAuth} disabled={isLoading}>
          <Text style={styles.loginButtonText}>{isLoading ? 'Loading...' : (showSignup ? 'Sign Up' : 'Login')}</Text>
        </TouchableOpacity>

        {!showSignup && (
          <TouchableOpacity onPress={handleForgotPassword}>
            <Text style={[styles.forgotPassword, { color: COLORS.primary }]}>Forgot Password?</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => setShowSignup(!showSignup)}>
          <Text style={[styles.loginSwitch, { color: COLORS.primary }]}>{showSignup ? 'Already have account? Login' : 'Create new account'}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ============ HOME SCREEN ============
function HomeScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { user } = useContext(AuthContext);
  const { darkMode } = useContext(ThemeContext);
  const theme = darkMode ? COLORS : LIGHT_COLORS;

  useEffect(() => {
    if (user) loadTasks();
  }, [user]);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (id, currentStatus) => {
    try {
      const { error } = await supabase.from('tasks').update({ completed: !currentStatus }).eq('id', id);
      if (error) throw error;
      setTasks(tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const deleteTask = async (id) => {
    Alert.alert('Delete', 'Remove this task?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', onPress: async () => {
        try {
          const { error } = await supabase.from('tasks').delete().eq('id', id);
          if (error) throw error;
          setTasks(tasks.filter(task => task.id !== id));
        } catch (error) {
          console.error('Error deleting task:', error);
        }
      }}
    ]);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const completed = filteredTasks.filter(t => t.completed).length;
  const progress = filteredTasks.length > 0 ? Math.round((completed / filteredTasks.length) * 100) : 0;

  const renderTask = ({ item }) => (
    <Animated.View style={[styles.taskCard, { opacity: fadeAnim, backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
      <TouchableOpacity onPress={() => toggleComplete(item.id, item.completed)} style={styles.checkbox}>
        <Feather name={item.completed ? 'check-circle' : 'circle'} size={24} color={item.completed ? COLORS.primary : COLORS.gray} />
      </TouchableOpacity>
      <View style={styles.taskContent}>
        <Text style={[styles.taskTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }, item.completed && styles.completedTask]}>{item.title}</Text>
        {item.description ? <Text style={[styles.taskDescription, { color: darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary }]}>{item.description}</Text> : null}
        <View style={styles.taskMeta}>
          <View style={styles.metaItem}>
            <Feather name="calendar" size={12} color={darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary} />
            <Text style={[styles.taskTime, { color: darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary }]}>{item.date || 'No date'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="clock" size={12} color={darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary} />
            <Text style={[styles.taskTime, { color: darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary }]}>{item.time || 'No time'}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity onPress={() => deleteTask(item.id)}>
        <Feather name="trash-2" size={20} color={darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? COLORS.background : LIGHT_COLORS.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>Loading tasks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? COLORS.background : LIGHT_COLORS.background }]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} backgroundColor={darkMode ? COLORS.background : LIGHT_COLORS.background} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeHeader}>
          <View>
            <Text style={[styles.welcomeText, { color: darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary }]}>Welcome back,</Text>
            <Text style={[styles.userName, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>{user?.name || 'User'}! 👋</Text>
          </View>
          <View style={[styles.premiumBadge, { backgroundColor: COLORS.primary + '20' }]}>
            <FontAwesome5 name="crown" size={14} color={COLORS.gold} />
            <Text style={styles.premiumText}>PREMIUM</Text>
          </View>
        </View>

        <View style={[styles.progressCard, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
          <Text style={[styles.progressTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>Today's Progress</Text>
          <View style={[styles.progressBarContainer, { backgroundColor: darkMode ? COLORS.dark : '#E0E0E0' }]}>
            <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: COLORS.primary }]} />
          </View>
          <Text style={[styles.progressStats, { color: darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary }]}>{completed}/{filteredTasks.length} tasks completed • {progress}%</Text>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
          <Feather name="search" size={18} color={darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary} />
          <TextInput
            placeholder="Search tasks..."
            placeholderTextColor={darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary}
            style={[styles.searchInput, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          <TouchableOpacity style={[styles.categoryChip, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }, selectedCategory === 'all' && { backgroundColor: COLORS.primary }]} onPress={() => setSelectedCategory('all')}>
            <Text style={[styles.categoryChipText, { color: darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary }, selectedCategory === 'all' && styles.categoryChipTextActive]}>All</Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity key={cat.id} style={[styles.categoryChip, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }, selectedCategory === cat.id && { backgroundColor: COLORS.primary }]} onPress={() => setSelectedCategory(cat.id)}>
              <Feather name={cat.icon} size={14} color={selectedCategory === cat.id ? '#000' : (darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary)} />
              <Text style={[styles.categoryChipText, { color: darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary }, selectedCategory === cat.id && styles.categoryChipTextActive]}>{cat.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <FlatList
          data={filteredTasks}
          keyExtractor={item => item.id}
          renderItem={renderTask}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="clipboard-outline" size={80} color={darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary} />
              <Text style={[styles.emptyText, { color: darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary }]}>No tasks yet</Text>
              <Text style={[styles.emptySubtext, { color: darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary }]}>Tap + to add your first task</Text>
            </View>
          }
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

  const scheduleNotification = async (taskTitle, taskTime, taskDate) => {
    try {
      const hasPermission = await registerForPushNotifications();
      if (!hasPermission) return;

      const trigger = new Date(taskDate);
      const [hours, minutes] = taskTime.split(':');
      trigger.setHours(parseInt(hours), parseInt(minutes), 0);

      if (trigger > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Task Reminder',
            body: `Time to complete: ${taskTitle}`,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
            data: { taskTitle },
          },
          trigger: { date: trigger, channelId: 'tasks' },
        });
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  const saveTask = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter task title');
      return;
    }

    setIsLoading(true);

    const newTask = {
      id: Date.now().toString(),
      user_id: user.id,
      title: title.trim(),
      description: description || '',
      date: date.toLocaleDateString(),
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reminder: reminder,
      completed: false,
      priority: priority,
      category: selectedCategory,
      created_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from('tasks').insert([newTask]);
      if (error) throw error;

      if (reminder) {
        await scheduleNotification(title, newTask.time, date);
      }

      Alert.alert('Success', 'Task added successfully!');
      if (route.params?.onTaskAdded) route.params.onTaskAdded();
      navigation.goBack();
    } catch (error) {
      console.error('Error saving task:', error);
      Alert.alert('Error', 'Failed to save task: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? COLORS.background : LIGHT_COLORS.background }]}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={28} color={darkMode ? COLORS.white : LIGHT_COLORS.text} />
        </TouchableOpacity>
        <Text style={[styles.modalTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>New Task</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TextInput
          placeholder="Task title"
          placeholderTextColor={darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary}
          style={[styles.input, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card, color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          placeholder="Description (optional)"
          placeholderTextColor={darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary}
          style={[styles.input, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card, color: darkMode ? COLORS.white : LIGHT_COLORS.text, height: 100 }]}
          multiline
          value={description}
          onChangeText={setDescription}
        />

        <Text style={[styles.inputLabel, { color: darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary }]}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelect}>
          {categories.map(cat => (
            <TouchableOpacity key={cat.id} style={[styles.categorySelectItem, { borderColor: darkMode ? COLORS.card : LIGHT_COLORS.border }, selectedCategory === cat.id && { borderColor: cat.color, backgroundColor: cat.color + '20' }]} onPress={() => setSelectedCategory(cat.id)}>
              <Feather name={cat.icon} size={20} color={selectedCategory === cat.id ? cat.color : (darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary)} />
              <Text style={[styles.categorySelectText, { color: darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary }, selectedCategory === cat.id && { color: cat.color }]}>{cat.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.inputLabel, { color: darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary }]}>Priority</Text>
        <View style={styles.priorityRow}>
          {['low', 'medium', 'high'].map(p => (
            <TouchableOpacity key={p} style={[styles.priorityBtn, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }, priority === p && { backgroundColor: p === 'high' ? COLORS.danger : p === 'medium' ? COLORS.warning : COLORS.success }]} onPress={() => setPriority(p)}>
              <Text style={styles.priorityBtnText}>{p.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.dateBtn, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]} onPress={() => setShowDate(true)}>
          <Feather name="calendar" size={20} color={darkMode ? COLORS.white : LIGHT_COLORS.text} />
          <Text style={[styles.dateBtnText, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>{date.toLocaleDateString()}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.dateBtn, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]} onPress={() => setShowTime(true)}>
          <Feather name="clock" size={20} color={darkMode ? COLORS.white : LIGHT_COLORS.text} />
          <Text style={[styles.dateBtnText, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </TouchableOpacity>

        {showDate && <DateTimePicker value={date} mode="date" onChange={(e, selected) => { setShowDate(false); if (selected) setDate(selected); }} />}
        {showTime && <DateTimePicker value={time} mode="time" onChange={(e, selected) => { setShowTime(false); if (selected) setTime(selected); }} />}

        <View style={[styles.reminderBox, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
          <Text style={[styles.reminderText, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>🔔 Set Reminder</Text>
          <Switch value={reminder} onValueChange={setReminder} trackColor={{ true: COLORS.primary }} />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={saveTask} disabled={isLoading}>
          <View style={[styles.gradientBtn, { backgroundColor: COLORS.primary }]}>
            <Text style={styles.saveBtnText}>{isLoading ? 'Saving...' : '✨ Create Task'}</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============ CALENDAR SCREEN ============
function CalendarScreen({ tasks }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const { darkMode } = useContext(ThemeContext);
  
  const formatDate = (date) => date.toLocaleDateString();
  const tasksForSelectedDate = tasks.filter(task => task.date === formatDate(selectedDate));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? COLORS.background : LIGHT_COLORS.background }]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
      <View style={styles.calendarSimple}>
        <Text style={[styles.pageTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>Calendar View</Text>
        <TouchableOpacity style={[styles.datePickerBtn, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]} onPress={() => setShowPicker(true)}>
          <Feather name="calendar" size={24} color={COLORS.primary} />
          <Text style={[styles.datePickerText, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>{formatDate(selectedDate)}</Text>
        </TouchableOpacity>
        {showPicker && <DateTimePicker value={selectedDate} mode="date" onChange={(event, date) => { setShowPicker(false); if (date) setSelectedDate(date); }} />}
      </View>
      <ScrollView style={styles.calendarTasksList}>
        <Text style={[styles.sectionTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>Tasks for {formatDate(selectedDate)}</Text>
        {tasksForSelectedDate.map(task => (
          <View key={task.id} style={[styles.calendarTaskItem, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
            <Feather name={task.completed ? 'check-circle' : 'circle'} size={20} color={COLORS.primary} />
            <Text style={[styles.calendarTaskText, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }, task.completed && styles.completedTask]}>{task.title}</Text>
          </View>
        ))}
        {tasksForSelectedDate.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={60} color={darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary} />
            <Text style={[styles.emptyText, { color: darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary }]}>No tasks for this day</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============ GOALS SCREEN ============
function GoalsScreen() {
  const [goals, setGoals] = useState([]);
  const [goalText, setGoalText] = useState('');
  const { darkMode } = useContext(ThemeContext);

  const addGoal = () => {
    if (goalText.trim()) {
      setGoals([...goals, { id: Date.now(), text: goalText.trim(), completed: false }]);
      setGoalText('');
    }
  };

  const toggleGoal = (id) => {
    setGoals(goals.map(goal => goal.id === id ? { ...goal, completed: !goal.completed } : goal));
  };

  const deleteGoal = (id) => {
    Alert.alert('Delete Goal', 'Remove this goal?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', onPress: () => setGoals(goals.filter(goal => goal.id !== id)) }
    ]);
  };

  const completedCount = goals.filter(g => g.completed).length;
  const progress = goals.length > 0 ? Math.round((completedCount / goals.length) * 100) : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? COLORS.background : LIGHT_COLORS.background }]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.goalsHeader}>
          <Text style={[styles.pageTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>My Goals</Text>
          <View style={[styles.progressContainer, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
            <View style={[styles.progressBarContainer, { backgroundColor: darkMode ? COLORS.dark : '#E0E0E0' }]}>
              <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: COLORS.primary }]} />
            </View>
            <Text style={[styles.progressStats, { color: darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary }]}>{completedCount}/{goals.length} completed • {progress}%</Text>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <TextInput style={[styles.goalInput, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card, color: darkMode ? COLORS.white : LIGHT_COLORS.text }]} placeholder="Add a new goal..." placeholderTextColor={darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary} value={goalText} onChangeText={setGoalText} onSubmitEditing={addGoal} />
          <TouchableOpacity style={[styles.addGoalButton, { backgroundColor: COLORS.primary }]} onPress={addGoal}>
            <Feather name="plus" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {goals.map(goal => (
          <View key={goal.id} style={[styles.goalItem, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
            <TouchableOpacity onPress={() => toggleGoal(goal.id)} style={styles.checkbox}>
              <Feather name={goal.completed ? 'check-circle' : 'circle'} size={22} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={[styles.goalText, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }, goal.completed && styles.completedTask]}>{goal.text}</Text>
            <TouchableOpacity onPress={() => deleteGoal(goal.id)}>
              <Feather name="trash-2" size={18} color={darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============ STATS SCREEN ============
function StatsScreen({ tasks }) {
  const { darkMode } = useContext(ThemeContext);
  const completed = tasks.filter(t => t.completed).length;
  const pending = tasks.filter(t => !t.completed).length;
  const byCategory = categories.map(cat => ({ ...cat, count: tasks.filter(t => t.category === cat.id).length }));
  const completionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? COLORS.background : LIGHT_COLORS.background }]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
      <Text style={[styles.pageTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>Statistics</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.mainStatCard, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
          <Text style={[styles.mainStatNumber, { color: COLORS.primary }]}>{completionRate}%</Text>
          <Text style={[styles.mainStatLabel, { color: darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary }]}>Completion Rate</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statMiniCard, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
            <Text style={[styles.statMiniNumber, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>{tasks.length}</Text>
            <Text style={[styles.statMiniLabel, { color: darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary }]}>Total</Text>
          </View>
          <View style={[styles.statMiniCard, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
            <Text style={[styles.statMiniNumber, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>{completed}</Text>
            <Text style={[styles.statMiniLabel, { color: darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary }]}>Done</Text>
          </View>
          <View style={[styles.statMiniCard, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
            <Text style={[styles.statMiniNumber, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>{pending}</Text>
            <Text style={[styles.statMiniLabel, { color: darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary }]}>Pending</Text>
          </View>
        </View>

        <Text style={[styles.sectionSubtitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>By Category</Text>
        {byCategory.map(cat => cat.count > 0 && (
          <View key={cat.id} style={[styles.categoryStat, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
            <View style={styles.categoryStatLeft}>
              <Feather name={cat.icon} size={18} color={cat.color} />
              <Text style={[styles.categoryStatName, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>{cat.title}</Text>
            </View>
            <Text style={[styles.categoryStatCount, { color: COLORS.primary }]}>{cat.count}</Text>
          </View>
        ))}

        <View style={[styles.quoteCard, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
          <Text style={[styles.quoteText, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>"The secret of getting ahead is getting started."</Text>
          <Text style={[styles.quoteAuthor, { color: darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary }]}>- Mark Twain</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============ PROFILE SCREEN ============
function ProfileScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const { darkMode, setDarkMode } = useContext(ThemeContext);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: () => { logout(); navigation.replace('Login'); } }
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? COLORS.background : LIGHT_COLORS.background }]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.profileHeader, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
          <View style={[styles.profileAvatar, { backgroundColor: COLORS.primary }]}>
            <Text style={styles.profileAvatarText}>{user?.name?.[0] || 'U'}</Text>
          </View>
          <Text style={[styles.profileName, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>{user?.name}</Text>
          <Text style={[styles.profileEmail, { color: darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary }]}>{user?.email}</Text>
          <View style={[styles.premiumCard, { backgroundColor: COLORS.primary + '20' }]}>
            <FontAwesome5 name="crown" size={18} color={COLORS.gold} />
            <Text style={styles.premiumCardText}>Premium Member</Text>
          </View>
        </View>

        <View style={[styles.settingsSection, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
          <Text style={[styles.settingsTitle, { color: darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary }]}>Preferences</Text>
          <View style={[styles.settingItem, { borderBottomColor: darkMode ? COLORS.dark : LIGHT_COLORS.border }]}>
            <View style={styles.settingLeft}>
              <Feather name="moon" size={20} color={COLORS.primary} />
              <Text style={[styles.settingText, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>Dark Mode</Text>
            </View>
            <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ false: '#767577', true: COLORS.primary }} thumbColor={darkMode ? '#fff' : '#f4f3f4'} />
          </View>
        </View>

        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]} onPress={handleLogout}>
          <Feather name="log-out" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        <Text style={[styles.versionText, { color: darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary }]}>Keynan v2.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============ MAIN APP ============
function MainApp() {
  const [tasks, setTasks] = useState([]);
  const { user } = useContext(AuthContext);
  const { darkMode } = useContext(ThemeContext);

  useEffect(() => {
    if (user) loadTasks();
  }, [user]);

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }],
        tabBarShowLabel: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: darkMode ? COLORS.gray : LIGHT_COLORS.textSecondary,
      }}
    >
      <Tab.Screen name="Home" options={{ tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} /> }}>{props => <HomeScreen {...props} />}</Tab.Screen>
      <Tab.Screen name="Calendar" options={{ tabBarIcon: ({ color, size }) => <Feather name="calendar" size={size} color={color} /> }}>{props => <CalendarScreen {...props} tasks={tasks} />}</Tab.Screen>
      <Tab.Screen name="Goals" options={{ tabBarIcon: ({ color, size }) => <Feather name="flag" size={size} color={color} /> }}>{props => <GoalsScreen {...props} />}</Tab.Screen>
      <Tab.Screen name="Stats" options={{ tabBarIcon: ({ color, size }) => <Feather name="bar-chart-2" size={size} color={color} /> }}>{props => <StatsScreen {...props} tasks={tasks} />}</Tab.Screen>
      <Tab.Screen name="Profile" options={{ tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} /> }}>{props => <ProfileScreen {...props} navigation={props.navigation} />}</Tab.Screen>
      <Tab.Screen name="AddTask" options={{ tabBarButton: () => null }}>{props => <AddTaskScreen {...props} navigation={props.navigation} route={props.route} />}</Tab.Screen>
    </Tab.Navigator>
  );
}

// ============ APP ============
export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsReady(true), 500);
  }, []);

  if (!isReady) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.splashText, { color: COLORS.primary }]}>Keynan</Text>
        <Text style={styles.splashSubtext}>Modern Productivity Planner</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <NavigationContainer>
            <AuthContext.Consumer>
              {({ user, loading }) => {
                if (loading) {
                  return (
                    <View style={styles.splashContainer}>
                      <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                  );
                }
                return user ? <MainApp /> : <LoginScreen navigation={{ replace: () => {} }} />;
              }}
            </AuthContext.Consumer>
          </NavigationContainer>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  splashContainer: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' },
  splashText: { fontSize: 32, fontWeight: 'bold', marginTop: 20 },
  splashSubtext: { color: COLORS.gray, fontSize: 14, marginTop: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10 },
  
  loginContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loginContent: { width: width - 40, alignItems: 'center' },
  logoCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  loginTitle: { fontSize: 32, fontWeight: 'bold', marginTop: 10 },
  loginSubtitle: { marginBottom: 30, textAlign: 'center' },
  loginInput: { width: '100%', borderRadius: 15, padding: 15, marginBottom: 12 },
  loginButton: { width: '100%', padding: 16, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  loginButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  loginSwitch: { marginTop: 20 },
  forgotPassword: { marginTop: 15, textAlign: 'center', fontSize: 14 },
  
  welcomeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 20 },
  welcomeText: { fontSize: 14 },
  userName: { fontSize: 24, fontWeight: 'bold' },
  premiumBadge: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignItems: 'center', gap: 6 },
  premiumText: { color: COLORS.gold, fontWeight: 'bold', fontSize: 12 },
  progressCard: { borderRadius: 20, padding: 16, marginBottom: 20 },
  progressTitle: { fontWeight: '600', marginBottom: 10 },
  progressBarContainer: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 4 },
  progressStats: { fontSize: 12, marginTop: 8 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, marginBottom: 16 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12 },
  categoryScroll: { flexDirection: 'row', marginBottom: 20 },
  categoryChip: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 25, marginRight: 10, gap: 6 },
  categoryChipText: { fontWeight: '500' },
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
  fab: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
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
  priorityBtnText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  dateBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 12, gap: 10 },
  dateBtnText: { fontSize: 14 },
  reminderBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 20 },
  reminderText: { fontSize: 14 },
  saveBtn: { marginBottom: 40 },
  gradientBtn: { padding: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  tabBar: { borderTopWidth: 0, height: 60, paddingBottom: 8 },
  
  calendarSimple: { padding: 20, alignItems: 'center' },
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, gap: 10, marginTop: 10 },
  datePickerText: { fontSize: 16 },
  calendarTasksList: { flex: 1, paddingHorizontal: 20 },
  calendarTaskItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 10, gap: 12 },
  calendarTaskText: { flex: 1, fontSize: 14 },
  
  goalsHeader: { marginBottom: 20 },
  pageTitle: { fontSize: 28, fontWeight: 'bold', marginVertical: 16 },
  inputContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  goalInput: { flex: 1, borderRadius: 12, padding: 14 },
  addGoalButton: { width: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  goalItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 10, gap: 12 },
  goalText: { flex: 1, fontSize: 16 },
  
  mainStatCard: { borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20 },
  mainStatNumber: { fontSize: 48, fontWeight: 'bold' },
  mainStatLabel: { marginTop: 5 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, gap: 12 },
  statMiniCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center' },
  statMiniNumber: { fontSize: 24, fontWeight: 'bold' },
  statMiniLabel: { fontSize: 12, marginTop: 4 },
  sectionSubtitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  categoryStat: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8 },
  categoryStatLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryStatName: { fontSize: 14 },
  categoryStatCount: { fontWeight: 'bold' },
  quoteCard: { borderRadius: 16, padding: 20, marginTop: 20, marginBottom: 40 },
  quoteText: { fontSize: 16, fontStyle: 'italic', textAlign: 'center' },
  quoteAuthor: { textAlign: 'center', marginTop: 10 },
  
  profileHeader: { borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20 },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  profileAvatarText: { fontSize: 36, fontWeight: 'bold', color: '#000' },
  profileName: { fontSize: 24, fontWeight: 'bold', marginTop: 12 },
  profileEmail: { marginTop: 4 },
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
});
