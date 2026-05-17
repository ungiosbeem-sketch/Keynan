import React, { useState, useEffect, useContext, createContext } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert, TextInput, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Feather, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const Tab = createBottomTabNavigator();

// Supabase config
const SUPABASE_URL = 'https://bwmvrsasculzivdcqyvi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_jC1Yhl9CMcnATcBtTRvwmQ_dM2QRr-j';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Colors
const COLORS = {
  background: '#000000',
  card: '#111111',
  primary: '#007AFF',
  white: '#FFFFFF',
  gray: '#8E8E93',
  dark: '#1C1C1E',
  success: '#34C759',
  warning: '#FFCC00',
  danger: '#FF3B30',
  gold: '#FFD60A',
};

// Categories
const categories = [
  { id: 'study', title: 'Study', icon: 'book-open', color: '#007AFF' },
  { id: 'work', title: 'Work', icon: 'briefcase', color: '#5856D6' },
  { id: 'personal', title: 'Personal', icon: 'heart', color: '#FF3B30' },
  { id: 'gym', title: 'Gym', icon: 'activity', color: '#34C759' },
  { id: 'shopping', title: 'Shopping', icon: 'shopping-bag', color: '#FF9500' },
];

// Auth Context
const AuthContext = createContext();

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

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Login Screen
function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showSignup, setShowSignup] = useState(false);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup } = useContext(AuthContext);

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
    <View style={styles.loginContainer}>
      <View style={styles.loginContent}>
        <View style={styles.logoCircle}>
          <FontAwesome5 name="rocket" size={40} color={COLORS.primary} />
        </View>
        <Text style={styles.loginTitle}>Keynan</Text>
        <Text style={styles.loginSubtitle}>Study • Routine • Read</Text>

        {showSignup && (
          <TextInput placeholder="Full Name" placeholderTextColor="#666" style={styles.loginInput} value={name} onChangeText={setName} />
        )}
        <TextInput placeholder="Email" placeholderTextColor="#666" style={styles.loginInput} value={email} onChangeText={setEmail} autoCapitalize="none" />
        <TextInput placeholder="Password" placeholderTextColor="#666" style={styles.loginInput} value={password} onChangeText={setPassword} secureTextEntry />

        <TouchableOpacity style={[styles.loginButton, { backgroundColor: COLORS.primary }]} onPress={handleAuth} disabled={isLoading}>
          <Text style={styles.loginButtonText}>{isLoading ? 'Loading...' : (showSignup ? 'Sign Up' : 'Login')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowSignup(!showSignup)}>
          <Text style={styles.loginSwitch}>{showSignup ? 'Already have account? Login' : 'Create new account'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Home Screen (Full Version)
function HomeScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      setTasks(data || []);
    } catch (error) {} finally { setLoading(false); }
  };

  const toggleComplete = async (id, currentStatus) => {
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

  const filteredTasks = selectedCategory === 'all' ? tasks : tasks.filter(t => t.category === selectedCategory);
  const completed = filteredTasks.filter(t => t.completed).length;
  const progress = filteredTasks.length > 0 ? Math.round((completed / filteredTasks.length) * 100) : 0;

  const renderTask = ({ item }) => (
    <View style={[styles.taskCard, { backgroundColor: COLORS.card }]}>
      <TouchableOpacity onPress={() => toggleComplete(item.id, item.completed)} style={styles.checkbox}>
        <Feather name={item.completed ? 'check-circle' : 'circle'} size={24} color={item.completed ? COLORS.primary : COLORS.gray} />
      </TouchableOpacity>
      <View style={styles.taskContent}>
        <Text style={[styles.taskTitle, { color: COLORS.white }, item.completed && styles.completedTask]}>{item.title}</Text>
        {item.description ? <Text style={[styles.taskDescription, { color: COLORS.gray }]}>{item.description}</Text> : null}
      </View>
      <TouchableOpacity onPress={() => deleteTask(item.id)}><Feather name="trash-2" size={20} color={COLORS.gray} /></TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView>
        <View style={styles.welcomeHeader}>
          <View>
            <Text style={styles.greetingText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'User'}! 👋</Text>
          </View>
          <View style={styles.premiumBadge}>
            <FontAwesome5 name="crown" size={14} color={COLORS.gold} />
            <Text style={styles.premiumText}>PREMIUM</Text>
          </View>
        </View>

        <View style={[styles.progressCard, { backgroundColor: COLORS.card }]}>
          <Text style={styles.progressTitle}>Today's Progress</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: COLORS.primary }]} />
          </View>
          <Text style={styles.progressStats}>{completed}/{filteredTasks.length} tasks completed • {progress}%</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          <TouchableOpacity style={[styles.categoryChip, selectedCategory === 'all' && { backgroundColor: COLORS.primary }]} onPress={() => setSelectedCategory('all')}>
            <Text style={[styles.categoryChipText, selectedCategory === 'all' && styles.categoryChipTextActive]}>All</Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity key={cat.id} style={[styles.categoryChip, selectedCategory === cat.id && { backgroundColor: COLORS.primary }]} onPress={() => setSelectedCategory(cat.id)}>
              <Feather name={cat.icon} size={14} color={selectedCategory === cat.id ? '#000' : cat.color} />
              <Text style={[styles.categoryChipText, selectedCategory === cat.id && styles.categoryChipTextActive]}>{cat.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <FlatList data={filteredTasks} keyExtractor={item => item.id} renderItem={renderTask} scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="clipboard-outline" size={80} color={COLORS.gray} />
              <Text style={styles.emptyText}>No tasks yet</Text>
              <Text style={styles.emptySubtext}>Tap + to add your first task</Text>
            </View>
          }
        />
      </ScrollView>
      <TouchableOpacity style={[styles.fab, { backgroundColor: COLORS.primary }]} onPress={() => navigation.navigate('AddTask', { onTaskAdded: loadTasks })}>
        <Feather name="plus" size={28} color="#000" />
      </TouchableOpacity>
    </View>
  );
}

// Add Task Screen
function AddTaskScreen({ navigation, route }) {
  const { user } = useContext(AuthContext);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('personal');
  const [priority, setPriority] = useState('medium');
  const [isLoading, setIsLoading] = useState(false);

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
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      completed: false,
      priority: priority,
      category: selectedCategory,
      created_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from('tasks').insert([newTask]);
      if (error) throw error;
      Alert.alert('Success', 'Task added successfully!');
      if (route.params?.onTaskAdded) route.params.onTaskAdded();
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save task');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={28} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>New Task</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView>
        <TextInput placeholder="Task title" placeholderTextColor={COLORS.gray} style={[styles.input, { backgroundColor: COLORS.card, color: COLORS.white }]} value={title} onChangeText={setTitle} />
        <TextInput placeholder="Description (optional)" placeholderTextColor={COLORS.gray} style={[styles.input, { backgroundColor: COLORS.card, color: COLORS.white, height: 100 }]} multiline value={description} onChangeText={setDescription} />

        <Text style={styles.inputLabel}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelect}>
          {categories.map(cat => (
            <TouchableOpacity key={cat.id} style={[styles.categorySelectItem, selectedCategory === cat.id && { borderColor: cat.color, backgroundColor: cat.color + '20' }]} onPress={() => setSelectedCategory(cat.id)}>
              <Feather name={cat.icon} size={20} color={selectedCategory === cat.id ? cat.color : COLORS.gray} />
              <Text style={[styles.categorySelectText, selectedCategory === cat.id && { color: cat.color }]}>{cat.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.inputLabel}>Priority</Text>
        <View style={styles.priorityRow}>
          {['low', 'medium', 'high'].map(p => (
            <TouchableOpacity key={p} style={[styles.priorityBtn, priority === p && { backgroundColor: p === 'high' ? COLORS.danger : p === 'medium' ? COLORS.warning : COLORS.success }]} onPress={() => setPriority(p)}>
              <Text style={styles.priorityBtnText}>{p.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: COLORS.primary }]} onPress={saveTask} disabled={isLoading}>
          <Text style={styles.saveBtnText}>{isLoading ? 'Saving...' : '✨ Create Task'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// Profile Screen
function ProfileScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Logout', onPress: () => { logout(); navigation.replace('Login'); } }
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <ScrollView>
        <View style={[styles.profileHeader, { backgroundColor: COLORS.card }]}>
          <View style={[styles.profileAvatar, { backgroundColor: COLORS.primary }]}>
            <Text style={styles.profileAvatarText}>{user?.name?.[0] || 'U'}</Text>
          </View>
          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={styles.premiumCard}>
            <FontAwesome5 name="crown" size={18} color={COLORS.gold} />
            <Text style={styles.premiumCardText}>Premium Member</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: COLORS.card }]} onPress={handleLogout}>
          <Feather name="log-out" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        <Text style={styles.versionText}>Keynan v2.0.0</Text>
      </ScrollView>
    </View>
  );
}

// Main App
function MainApp() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: COLORS.card, height: 60, borderTopWidth: 0 },
        tabBarShowLabel: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
      }}>
      <Tab.Screen name="Home" options={{ tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} /> }}>
        {props => <HomeScreen {...props} navigation={props.navigation} />}
      </Tab.Screen>
      <Tab.Screen name="AddTask" options={{ tabBarIcon: ({ color, size }) => <Feather name="plus" size={size} color={color} /> }}>
        {props => <AddTaskScreen {...props} navigation={props.navigation} route={props.route} />}
      </Tab.Screen>
      <Tab.Screen name="Profile" options={{ tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} /> }}>
        {props => <ProfileScreen {...props} navigation={props.navigation} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// App
export default function App() {
  const [isReady, setIsReady] = useState(false);
  useEffect(() => { setTimeout(() => setIsReady(true), 500); }, []);

  if (!isReady) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.splashText}>Keynan</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <AuthContext.Consumer>
            {({ user, loading }) => {
              if (loading) return <View style={styles.splashContainer}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
              return user ? <MainApp /> : <LoginScreen navigation={{ replace: () => {} }} />;
            }}
          </AuthContext.Consumer>
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

// Styles
const styles = StyleSheet.create({
  splashContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  splashText: { fontSize: 32, fontWeight: 'bold', color: COLORS.primary, marginTop: 20 },
  loginContainer: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  loginContent: { width: '80%', alignItems: 'center' },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  loginTitle: { fontSize: 32, fontWeight: 'bold', color: COLORS.white, marginTop: 10 },
  loginSubtitle: { color: COLORS.gray, marginBottom: 30 },
  loginInput: { width: '100%', backgroundColor: COLORS.card, borderRadius: 12, padding: 15, color: COLORS.white, marginBottom: 12 },
  loginButton: { width: '100%', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  loginButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  loginSwitch: { color: COLORS.primary, marginTop: 20 },
  
  container: { flex: 1, paddingHorizontal: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  welcomeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 20 },
  greetingText: { color: COLORS.gray, fontSize: 14 },
  userName: { color: COLORS.white, fontSize: 24, fontWeight: 'bold' },
  premiumBadge: { flexDirection: 'row', backgroundColor: COLORS.primary + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignItems: 'center', gap: 6 },
  premiumText: { color: COLORS.gold, fontWeight: 'bold', fontSize: 12 },
  progressCard: { borderRadius: 20, padding: 16, marginBottom: 20 },
  progressTitle: { color: COLORS.white, fontWeight: '600', marginBottom: 10 },
  progressBarContainer: { height: 8, backgroundColor: COLORS.dark, borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 4 },
  progressStats: { color: COLORS.gray, fontSize: 12, marginTop: 8 },
  categoryScroll: { flexDirection: 'row', marginBottom: 20 },
  categoryChip: { flexDirection: 'row', backgroundColor: COLORS.card, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 25, marginRight: 10, gap: 6 },
  categoryChipText: { color: COLORS.gray, fontWeight: '500' },
  categoryChipTextActive: { color: '#000', fontWeight: '600' },
  taskCard: { borderRadius: 16, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'flex-start' },
  checkbox: { marginRight: 12 },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: '600' },
  completedTask: { textDecorationLine: 'line-through', color: COLORS.gray },
  taskDescription: { fontSize: 13, marginTop: 4, color: COLORS.gray },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: COLORS.gray, fontSize: 18, marginTop: 15 },
  emptySubtext: { color: COLORS.gray, marginTop: 5 },
  
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 16 },
  modalTitle: { color: COLORS.white, fontSize: 20, fontWeight: 'bold' },
  input: { borderRadius: 12, padding: 14, marginBottom: 16 },
  inputLabel: { color: COLORS.gray, marginBottom: 8, fontSize: 14 },
  categorySelect: { flexDirection: 'row', marginBottom: 16 },
  categorySelectItem: { alignItems: 'center', marginRight: 16, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: COLORS.card },
  categorySelectText: { color: COLORS.gray, fontSize: 12, marginTop: 4 },
  priorityRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  priorityBtn: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: COLORS.card, alignItems: 'center' },
  priorityBtnText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  saveBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 40 },
  saveBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  
  profileHeader: { borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20 },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  profileAvatarText: { fontSize: 36, fontWeight: 'bold', color: '#000' },
  profileName: { fontSize: 24, fontWeight: 'bold', color: COLORS.white, marginTop: 12 },
  profileEmail: { color: COLORS.gray, marginTop: 4 },
  premiumCard: { flexDirection: 'row', backgroundColor: COLORS.primary + '20', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 12, gap: 8 },
  premiumCardText: { color: COLORS.gold, fontWeight: 'bold' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 12, marginBottom: 20 },
  logoutText: { color: COLORS.danger, fontSize: 16, fontWeight: '600' },
  versionText: { textAlign: 'center', color: COLORS.gray, marginBottom: 30 },
});
