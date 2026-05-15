import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
  Alert,
  Keyboard,
  ScrollView,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from './supabase';

const { width } = Dimensions.get('window');
const Tab = createBottomTabNavigator();
const STORAGE_KEY = '@keynan_tasks';
const COLORS = {
  background: '#000000',
  darkGray: '#1A1A1A',
  pink: '#FF4FA3',
  white: '#FFFFFF',
  gray: '#888888',
  success: '#4CAF50',
  error: '#FF4444',
};

// ============ AUTH SCREEN ============
function AuthScreen({ onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthSuccess();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        Alert.alert('Success', 'Account created! Please sign in.');
        setIsLogin(true);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.authContainer}>
      <View style={styles.authCard}>
        <Feather name="calendar" size={48} color={COLORS.pink} />
        <Text style={styles.authTitle}>Keynan</Text>
        <Text style={styles.authSubtitle}>Your Premium Task Planner</Text>

        <TextInput
          style={styles.authInput}
          placeholder="Email"
          placeholderTextColor={COLORS.gray}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.authInput}
          placeholder="Password"
          placeholderTextColor={COLORS.gray}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.authButton} onPress={handleAuth} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.authButtonText}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.authSwitchText}>
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============ HOME SCREEN ============
function HomeScreen({ tasks, setTasks, filter, setFilter, signOut }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const addTask = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    const user = supabase.auth.getUser();
    const newTask = {
      id: Date.now().toString(),
      title,
      date: date.toLocaleDateString(),
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      completed: false,
      created_at: new Date().toISOString(),
    };
    setTasks([newTask, ...tasks]);
    setTitle('');
    Keyboard.dismiss();
  };

  const toggleComplete = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id) => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setTasks(tasks.filter(t => t.id !== id)) },
    ]);
  };

  const getFilteredTasks = () => {
    if (filter === 'pending') return tasks.filter(t => !t.completed);
    if (filter === 'completed') return tasks.filter(t => t.completed);
    return tasks;
  };

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
  };

  const renderTask = ({ item }) => (
    <View style={styles.taskCard}>
      <TouchableOpacity onPress={() => toggleComplete(item.id)} style={styles.checkbox}>
        <Feather name={item.completed ? 'check-circle' : 'circle'} size={24} color={item.completed ? COLORS.pink : COLORS.gray} />
      </TouchableOpacity>
      <View style={styles.taskContent}>
        <Text style={[styles.taskTitle, item.completed && styles.completedText]}>{item.title}</Text>
        <View style={styles.taskMeta}>
          <Feather name="calendar" size={12} color={COLORS.gray} />
          <Text style={styles.taskDate}>{item.date}</Text>
          <Feather name="clock" size={12} color={COLORS.gray} style={{ marginLeft: 8 }} />
          <Text style={styles.taskDate}>{item.time}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => deleteTask(item.id)}>
        <Feather name="trash-2" size={20} color={COLORS.gray} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.screenContainer}>
      <View style={styles.homeHeader}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.username}>Keynan User</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
          <Feather name="log-out" size={24} color={COLORS.pink} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.addCard}>
          <TextInput
            style={styles.input}
            placeholder="What do you want to do?"
            placeholderTextColor={COLORS.gray}
            value={title}
            onChangeText={setTitle}
          />
          <View style={styles.dateRow}>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
              <Feather name="calendar" size={16} color={COLORS.pink} />
              <Text style={styles.dateText}>{date.toLocaleDateString()}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowTimePicker(true)}>
              <Feather name="clock" size={16} color={COLORS.pink} />
              <Text style={styles.dateText}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={addTask}>
              <Feather name="plus" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statMini}><Text style={styles.statValue}>{stats.total}</Text><Text style={styles.statLabel}>Total</Text></View>
          <View style={styles.statMini}><Text style={styles.statValue}>{stats.completed}</Text><Text style={styles.statLabel}>Done</Text></View>
          <View style={styles.statMini}><Text style={styles.statValue}>{stats.pending}</Text><Text style={styles.statLabel}>Pending</Text></View>
        </View>

        <View style={styles.filterRow}>
          {['all', 'pending', 'completed'].map(f => (
            <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {getFilteredTasks().length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="clipboard" size={64} color={COLORS.gray} />
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubText}>Add your first task above</Text>
          </View>
        ) : (
          <FlatList data={getFilteredTasks()} keyExtractor={item => item.id} renderItem={renderTask} scrollEnabled={false} />
        )}
      </ScrollView>

      {showDatePicker && <DateTimePicker value={date} mode="date" display="default" onChange={(e, d) => { setShowDatePicker(false); if (d) setDate(d); }} />}
      {showTimePicker && <DateTimePicker value={time} mode="time" display="default" onChange={(e, t) => { setShowTimePicker(false); if (t) setTime(t); }} />}
    </SafeAreaView>
  );
}

// ============ STATS SCREEN ============
function StatsScreen({ tasks }) {
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      <ScrollView>
        <Text style={styles.statsMainTitle}>Statistics</Text>
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Your Progress</Text>
          <View style={styles.progressCircle}>
            <Text style={styles.progressPercent}>{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</Text>
          </View>
          <Text style={styles.progressLabel}>Completion Rate</Text>
        </View>
        <View style={styles.statsDetailCard}>
          <Text style={styles.statsDetailTitle}>Summary</Text>
          <View style={styles.statsDetailRow}><Text style={styles.statsDetailLabel}>Total Tasks</Text><Text style={styles.statsDetailValue}>{stats.total}</Text></View>
          <View style={styles.statsDetailRow}><Text style={styles.statsDetailLabel}>Completed</Text><Text style={styles.statsDetailValue}>{stats.completed}</Text></View>
          <View style={styles.statsDetailRow}><Text style={styles.statsDetailLabel}>Pending</Text><Text style={styles.statsDetailValue}>{stats.pending}</Text></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============ PROFILE SCREEN ============
function ProfileScreen({ signOut }) {
  return (
    <SafeAreaView style={styles.screenContainer}>
      <ScrollView>
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Feather name="user" size={60} color={COLORS.pink} />
          </View>
          <Text style={styles.profileName}>Keynan User</Text>
          <Text style={styles.profileEmail}>Premium Member</Text>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <Feather name="bell" size={24} color={COLORS.pink} />
            <Text style={styles.menuText}>Notifications</Text>
            <Feather name="chevron-right" size={20} color={COLORS.gray} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Feather name="moon" size={24} color={COLORS.pink} />
            <Text style={styles.menuText}>Dark Mode</Text>
            <Feather name="chevron-right" size={20} color={COLORS.gray} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={signOut}>
            <Feather name="log-out" size={24} color={COLORS.error} />
            <Text style={[styles.menuText, { color: COLORS.error }]}>Sign Out</Text>
            <Feather name="chevron-right" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>Keynan App v2.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============ MAIN APP WITH BOTTOM TABS ============
function MainApp({ signOut, tasks, setTasks, filter, setFilter }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Stats') iconName = 'bar-chart-2';
          else if (route.name === 'Profile') iconName = 'user';
          return <Feather name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.pink,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home">
        {props => <HomeScreen {...props} tasks={tasks} setTasks={setTasks} filter={filter} setFilter={setFilter} signOut={signOut} />}
      </Tab.Screen>
      <Tab.Screen name="Stats">
        {props => <StatsScreen {...props} tasks={tasks} />}
      </Tab.Screen>
      <Tab.Screen name="Profile">
        {props => <ProfileScreen {...props} signOut={signOut} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// ============ ROOT APP COMPONENT ============
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    checkSession();
    loadTasks();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      saveTasks();
    }
  }, [tasks]);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    setLoading(false);
  };

  const loadTasks = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setTasks(JSON.parse(stored));
    } catch (error) {}
  };

  const saveTasks = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {}
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setTasks([]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.pink} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen onAuthSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <MainApp signOut={signOut} tasks={tasks} setTasks={setTasks} filter={filter} setFilter={setFilter} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  screenContainer: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20 },
  tabBar: { backgroundColor: COLORS.darkGray, borderTopWidth: 0, elevation: 0, height: 60, paddingBottom: 5, paddingTop: 5 },
  
  // Auth Styles
  authContainer: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  authCard: { backgroundColor: COLORS.darkGray, borderRadius: 30, padding: 32, width: '100%', alignItems: 'center' },
  authTitle: { fontSize: 32, fontWeight: 'bold', color: COLORS.white, marginTop: 16 },
  authSubtitle: { fontSize: 14, color: COLORS.gray, marginBottom: 32 },
  authInput: { width: '100%', backgroundColor: '#2A2A2A', borderRadius: 12, padding: 14, color: COLORS.white, marginBottom: 16, fontSize: 16 },
  authButton: { width: '100%', backgroundColor: COLORS.pink, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  authButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  authSwitchText: { color: COLORS.pink, marginTop: 20, fontSize: 14 },
  
  // Home Styles
  homeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 24 },
  greeting: { fontSize: 16, color: COLORS.gray },
  username: { fontSize: 24, fontWeight: 'bold', color: COLORS.white },
  logoutButton: { padding: 8 },
  addCard: { backgroundColor: COLORS.darkGray, borderRadius: 20, padding: 16, marginBottom: 20 },
  input: { backgroundColor: '#2A2A2A', borderRadius: 12, padding: 14, color: COLORS.white, fontSize: 16, marginBottom: 12 },
  dateRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  dateButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2A2A2A', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, flex: 1 },
  dateText: { color: COLORS.white, fontSize: 12 },
  addButton: { backgroundColor: COLORS.pink, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statMini: { flex: 1, backgroundColor: COLORS.darkGray, borderRadius: 16, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.white },
  statLabel: { fontSize: 12, color: COLORS.gray, marginTop: 4 },
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.darkGray },
  filterChipActive: { backgroundColor: COLORS.pink },
  filterText: { color: COLORS.gray },
  filterTextActive: { color: '#000', fontWeight: 'bold' },
  taskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.darkGray, borderRadius: 16, padding: 14, marginBottom: 10 },
  checkbox: { marginRight: 12 },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 16, color: COLORS.white, marginBottom: 4 },
  completedText: { textDecorationLine: 'line-through', color: COLORS.gray },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  taskDate: { fontSize: 11, color: COLORS.gray },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, color: COLORS.white, marginTop: 16 },
  emptySubText: { fontSize: 14, color: COLORS.gray, marginTop: 8 },
  
  // Stats Styles
  statsMainTitle: { fontSize: 32, fontWeight: 'bold', color: COLORS.white, marginTop: 20, marginBottom: 24 },
  statsCard: { backgroundColor: COLORS.darkGray, borderRadius: 24, padding: 32, alignItems: 'center', marginBottom: 20 },
  statsTitle: { fontSize: 18, color: COLORS.white, marginBottom: 20 },
  progressCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: COLORS.pink + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  progressPercent: { fontSize: 36, fontWeight: 'bold', color: COLORS.pink },
  progressLabel: { fontSize: 14, color: COLORS.gray },
  statsDetailCard: { backgroundColor: COLORS.darkGray, borderRadius: 20, padding: 20, marginBottom: 20 },
  statsDetailTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white, marginBottom: 16 },
  statsDetailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' },
  statsDetailLabel: { color: COLORS.gray },
  statsDetailValue: { color: COLORS.white, fontWeight: 'bold' },
  
  // Profile Styles
  profileHeader: { alignItems: 'center', marginTop: 40, marginBottom: 32 },
  avatarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.darkGray, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  profileName: { fontSize: 24, fontWeight: 'bold', color: COLORS.white },
  profileEmail: { fontSize: 14, color: COLORS.gray, marginTop: 4 },
  menuSection: { backgroundColor: COLORS.darkGray, borderRadius: 20, paddingHorizontal: 16, marginBottom: 24 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' },
  menuText: { flex: 1, fontSize: 16, color: COLORS.white, marginLeft: 12 },
  versionText: { textAlign: 'center', color: COLORS.gray, fontSize: 12, marginBottom: 40 },
});
