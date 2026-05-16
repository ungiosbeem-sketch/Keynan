import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ScrollView,
  Switch,
  Dimensions,
  Animated,
  StatusBar,
  Modal,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const Tab = createBottomTabNavigator();
const STORAGE_KEY = '@ungio_premium_tasks';
const USERS_KEY = '@ungio_users';
const CURRENT_USER_KEY = '@ungio_current_user';

const COLORS = {
  background: '#050505',
  backgroundLight: '#0D0D0D',
  card: '#121212',
  cardLight: '#1C1C1E',
  pink: '#FF4FA3',
  pink2: '#FF69B4',
  pinkGlow: '#ff5eb6',
  white: '#FFFFFF',
  gray: '#8E8E93',
  dark: '#1C1C1E',
  success: '#4CAF50',
  warning: '#FFC107',
  danger: '#FF4D4D',
  purple: '#9B59B6',
  blue: '#3498DB',
  orange: '#E67E22',
  gold: '#F1C40F',
};

const categories = [
  { id: 'study', title: 'Study', icon: 'book-open', color: COLORS.blue },
  { id: 'work', title: 'Work', icon: 'briefcase', color: COLORS.purple },
  { id: 'personal', title: 'Personal', icon: 'heart', color: COLORS.pink },
  { id: 'gym', title: 'Gym', icon: 'activity', color: COLORS.orange },
  { id: 'shopping', title: 'Shopping', icon: 'shopping-bag', color: COLORS.success },
];

const AuthContext = createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const savedUser = await AsyncStorage.getItem(CURRENT_USER_KEY);
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const users = JSON.parse(await AsyncStorage.getItem(USERS_KEY) || '[]');
      const foundUser = users.find(u => u.email === email && u.password === password);
      if (foundUser) {
        setUser(foundUser);
        await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(foundUser));
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
      const users = JSON.parse(await AsyncStorage.getItem(USERS_KEY) || '[]');
      if (users.find(u => u.email === email)) return false;
      const newUser = { id: Date.now().toString(), name, email, password, premium: true, joinDate: new Date().toISOString() };
      users.push(newUser);
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
      setUser(newUser);
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showSignup, setShowSignup] = useState(false);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup } = useContext(AuthContext);
  const fadeAnim = useRef(new Animated.Value(0)).current;

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

  return (
    <View style={styles.loginContainer}>
      <Animated.View style={[styles.loginContent, { opacity: fadeAnim }]}>
        <View style={styles.logoCircle}>
          <FontAwesome5 name="rocket" size={50} color={COLORS.pink} />
        </View>
        <Text style={styles.loginTitle}>Ungio Premium</Text>
        <Text style={styles.loginSubtitle}>Plan Your Success</Text>
        
        {showSignup && (
          <TextInput
            placeholder="Full Name"
            placeholderTextColor={COLORS.gray}
            style={styles.loginInput}
            value={name}
            onChangeText={setName}
          />
        )}
        <TextInput
          placeholder="Email"
          placeholderTextColor={COLORS.gray}
          style={styles.loginInput}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor={COLORS.gray}
          style={styles.loginInput}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity style={styles.loginButton} onPress={handleAuth} disabled={isLoading}>
          <Text style={styles.loginButtonText}>
            {isLoading ? 'Loading...' : (showSignup ? 'Sign Up' : 'Login')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => setShowSignup(!showSignup)}>
          <Text style={styles.loginSwitch}>
            {showSignup ? 'Already have account? Login' : 'Create new account'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function HomeScreen({ tasks, toggleComplete, deleteTask, navigation }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { user } = useContext(AuthContext);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
  }, []);

  const filteredTasks = tasks.filter(task => {
    const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const completed = filteredTasks.filter(t => t.completed).length;
  const progress = filteredTasks.length > 0 ? Math.round((completed / filteredTasks.length) * 100) : 0;

  const renderTask = ({ item, index }) => (
    <Animated.View style={[styles.taskCard, { opacity: fadeAnim }]}>
      <TouchableOpacity onPress={() => toggleComplete(item.id)} style={styles.checkbox}>
        <Feather name={item.completed ? 'check-circle' : 'circle'} size={24} color={item.completed ? COLORS.pink : COLORS.gray} />
      </TouchableOpacity>
      <View style={styles.taskContent}>
        <Text style={[styles.taskTitle, item.completed && styles.completedTask]}>{item.title}</Text>
        {item.description ? <Text style={styles.taskDescription}>{item.description}</Text> : null}
        <View style={styles.taskMeta}>
          <View style={styles.metaItem}>
            <Feather name="calendar" size={12} color={COLORS.gray} />
            <Text style={styles.taskTime}> {item.date}</Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="clock" size={12} color={COLORS.gray} />
            <Text style={styles.taskTime}> {item.time}</Text>
          </View>
          {item.category && (
            <View style={[styles.categoryBadge, { backgroundColor: categories.find(c => c.id === item.category)?.color + '20' }]}>
              <Text style={[styles.categoryBadgeText, { color: categories.find(c => c.id === item.category)?.color }]}>
                {item.category}
              </Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity onPress={() => deleteTask(item.id)}>
        <Feather name="trash-2" size={20} color={COLORS.gray} />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeHeader}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'User'}! 👋</Text>
          </View>
          <View style={styles.premiumBadge}>
            <FontAwesome5 name="crown" size={14} color={COLORS.gold} />
            <Text style={styles.premiumText}>PREMIUM</Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Today's Progress</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressStats}>{completed}/{filteredTasks.length} tasks completed • {progress}%</Text>
        </View>

        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color={COLORS.gray} style={styles.searchIcon} />
          <TextInput
            placeholder="Search tasks..."
            placeholderTextColor={COLORS.gray}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          <TouchableOpacity 
            style={[styles.categoryChip, selectedCategory === 'all' && styles.categoryChipActive]} 
            onPress={() => setSelectedCategory('all')}>
            <Text style={[styles.categoryChipText, selectedCategory === 'all' && styles.categoryChipTextActive]}>All</Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity key={cat.id} 
              style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]} 
              onPress={() => setSelectedCategory(cat.id)}>
              <Feather name={cat.icon} size={14} color={selectedCategory === cat.id ? '#000' : COLORS.gray} />
              <Text style={[styles.categoryChipText, selectedCategory === cat.id && styles.categoryChipTextActive]}>{cat.title}</Text>
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
              <Ionicons name="clipboard-outline" size={80} color={COLORS.gray} />
              <Text style={styles.emptyText}>No tasks yet</Text>
              <Text style={styles.emptySubtext}>Tap + to add your first task</Text>
            </View>
          }
        />
      </ScrollView>
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddTask')}>
        <Feather name="plus" size={28} color="#000" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function AddTaskScreen({ navigation, tasks, setTasks }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [reminder, setReminder] = useState(false);
  const [priority, setPriority] = useState('medium');
  const [selectedCategory, setSelectedCategory] = useState('personal');

  const saveTask = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter task title');
      return;
    }
    const newTask = {
      id: Date.now().toString(),
      title,
      description,
      date: date.toLocaleDateString(),
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reminder,
      completed: false,
      priority,
      category: selectedCategory,
    };
    setTasks([...tasks, newTask]);
    Alert.alert('Success', 'Task added successfully!');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={28} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>New Task</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TextInput
          placeholder="Task title"
          placeholderTextColor={COLORS.gray}
          style={styles.input}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          placeholder="Description (optional)"
          placeholderTextColor={COLORS.gray}
          style={[styles.input, { height: 100 }]}
          multiline
          value={description}
          onChangeText={setDescription}
        />
        
        <Text style={styles.inputLabel}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelect}>
          {categories.map(cat => (
            <TouchableOpacity 
              key={cat.id} 
              style={[styles.categorySelectItem, selectedCategory === cat.id && { borderColor: cat.color, backgroundColor: cat.color + '20' }]} 
              onPress={() => setSelectedCategory(cat.id)}>
              <Feather name={cat.icon} size={20} color={selectedCategory === cat.id ? cat.color : COLORS.gray} />
              <Text style={[styles.categorySelectText, selectedCategory === cat.id && { color: cat.color }]}>{cat.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.inputLabel}>Priority</Text>
        <View style={styles.priorityRow}>
          {['low', 'medium', 'high'].map(p => (
            <TouchableOpacity 
              key={p} 
              style={[
                styles.priorityBtn, 
                priority === p && { backgroundColor: p === 'high' ? COLORS.danger : p === 'medium' ? COLORS.warning : COLORS.success }
              ]} 
              onPress={() => setPriority(p)}>
              <Text style={styles.priorityBtnText}>{p.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDate(true)}>
          <Feather name="calendar" size={20} color={COLORS.white} />
          <Text style={styles.dateBtnText}>{date.toLocaleDateString()}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowTime(true)}>
          <Feather name="clock" size={20} color={COLORS.white} />
          <Text style={styles.dateBtnText}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </TouchableOpacity>

        {showDate && (
          <DateTimePicker
            value={date}
            mode="date"
            onChange={(e, selected) => {
              setShowDate(false);
              if (selected) setDate(selected);
            }}
          />
        )}
        {showTime && (
          <DateTimePicker
            value={time}
            mode="time"
            onChange={(e, selected) => {
              setShowTime(false);
              if (selected) setTime(selected);
            }}
          />
        )}

        <View style={styles.reminderBox}>
          <Text style={styles.reminderText}>🔔 Set Reminder</Text>
          <Switch value={reminder} onValueChange={setReminder} trackColor={{ true: COLORS.pink }} />
        </View>
        
        <TouchableOpacity style={styles.saveBtn} onPress={saveTask}>
          <View style={styles.gradientBtn}>
            <Text style={styles.saveBtnText}>✨ Create Task</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatsScreen({ tasks }) {
  const completed = tasks.filter(t => t.completed).length;
  const pending = tasks.filter(t => !t.completed).length;
  const byCategory = categories.map(cat => ({ ...cat, count: tasks.filter(t => t.category === cat.id).length }));
  const completionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.pageTitle}>Statistics</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.mainStatCard}>
          <Text style={styles.mainStatNumber}>{completionRate}%</Text>
          <Text style={styles.mainStatLabel}>Completion Rate</Text>
          <View style={styles.mainStatRing}>
            <Text style={styles.mainStatRingText}>{completed}/{tasks.length}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statMiniCard}>
            <Text style={styles.statMiniNumber}>{tasks.length}</Text>
            <Text style={styles.statMiniLabel}>Total</Text>
          </View>
          <View style={styles.statMiniCard}>
            <Text style={styles.statMiniNumber}>{completed}</Text>
            <Text style={styles.statMiniLabel}>Done</Text>
          </View>
          <View style={styles.statMiniCard}>
            <Text style={styles.statMiniNumber}>{pending}</Text>
            <Text style={styles.statMiniLabel}>Pending</Text>
          </View>
        </View>

        <Text style={styles.sectionSubtitle}>By Category</Text>
        {byCategory.map(cat => cat.count > 0 && (
          <View key={cat.id} style={styles.categoryStat}>
            <View style={styles.categoryStatLeft}>
              <Feather name={cat.icon} size={18} color={cat.color} />
              <Text style={styles.categoryStatName}>{cat.title}</Text>
            </View>
            <Text style={styles.categoryStatCount}>{cat.count}</Text>
          </View>
        ))}
        
        <View style={styles.quoteCard}>
          <Text style={styles.quoteText}>"The secret of getting ahead is getting started."</Text>
          <Text style={styles.quoteAuthor}>- Mark Twain</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: () => { logout(); navigation.replace('Login'); } }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{user?.name?.[0] || 'U'}</Text>
          </View>
          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={styles.premiumCard}>
            <FontAwesome5 name="crown" size={18} color={COLORS.gold} />
            <Text style={styles.premiumCardText}>Premium Member</Text>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.settingsTitle}>Preferences</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Feather name="moon" size={20} color={COLORS.pink} />
              <Text style={styles.settingText}>Dark Mode</Text>
            </View>
            <Switch value={darkMode} onValueChange={setDarkMode} />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Feather name="bell" size={20} color={COLORS.pink} />
              <Text style={styles.settingText}>Notifications</Text>
            </View>
            <Switch value={notifications} onValueChange={setNotifications} />
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.settingsTitle}>Account</Text>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Feather name="edit-2" size={20} color={COLORS.pink} />
              <Text style={styles.settingText}>Edit Profile</Text>
            </View>
            <Feather name="chevron-right" size={20} color={COLORS.gray} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Feather name="lock" size={20} color={COLORS.pink} />
              <Text style={styles.settingText}>Change Password</Text>
            </View>
            <Feather name="chevron-right" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Feather name="log-out" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        <Text style={styles.versionText}>Ungio Premium v2.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function MainApp() {
  const [tasks, setTasks] = useState([]);
  
  useEffect(() => { loadTasks(); }, []);
  useEffect(() => { saveTasks(); }, [tasks]);
  
  const loadTasks = async () => { 
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY); 
      if (data) setTasks(JSON.parse(data));
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };
  
  const saveTasks = async () => { 
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  };
  
  const toggleComplete = (id) => { 
    setTasks(tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
  };
  
  const deleteTask = (id) => { 
    Alert.alert('Delete', 'Remove this task?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', onPress: () => setTasks(tasks.filter(task => task.id !== id)) }
    ]);
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: COLORS.pink,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarIcon: ({ color, size, route }) => {
          let icon;
          if (route.name === 'Home') icon = 'home';
          if (route.name === 'Stats') icon = 'bar-chart-2';
          if (route.name === 'Profile') icon = 'user';
          return <Feather name={icon} size={size} color={color} />;
        },
      }}
    >
      <Tab.Screen name="Home">
        {props => <HomeScreen {...props} tasks={tasks} toggleComplete={toggleComplete} deleteTask={deleteTask} />}
      </Tab.Screen>
      <Tab.Screen name="Stats">
        {props => <StatsScreen {...props} tasks={tasks} />}
      </Tab.Screen>
      <Tab.Screen name="Profile">
        {props => <ProfileScreen {...props} navigation={props.navigation} />}
      </Tab.Screen>
      <Tab.Screen 
        name="AddTask" 
        options={{ tabBarButton: () => null }}>
        {props => <AddTaskScreen {...props} tasks={tasks} setTasks={setTasks} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => { 
    setTimeout(() => setIsReady(true), 500);
  }, []);

  if (!isReady) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color={COLORS.pink} />
        <Text style={styles.splashText}>Ungio Premium</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <AuthContext.Consumer>
            {({ user, loading }) => {
              if (loading) {
                return (
                  <View style={styles.splashContainer}>
                    <ActivityIndicator size="large" color={COLORS.pink} />
                  </View>
                );
              }
              return user ? <MainApp /> : <LoginScreen navigation={{ replace: () => {} }} />;
            }}
          </AuthContext.Consumer>
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20 },
  splashContainer: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  splashText: { color: COLORS.pink, fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  
  // Login Styles
  loginContainer: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  loginContent: { width: width - 40, alignItems: 'center' },
  logoCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  loginTitle: { fontSize: 32, fontWeight: 'bold', color: COLORS.white, marginTop: 10 },
  loginSubtitle: { color: COLORS.gray, marginBottom: 30 },
  loginInput: { backgroundColor: COLORS.card, width: '100%', borderRadius: 15, padding: 15, color: COLORS.white, marginBottom: 12 },
  loginButton: { backgroundColor: COLORS.pink, width: '100%', padding: 16, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  loginButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  loginSwitch: { color: COLORS.pink, marginTop: 20 },
  
  // Home Styles
  welcomeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 20 },
  welcomeText: { color: COLORS.gray, fontSize: 14 },
  userName: { color: COLORS.white, fontSize: 24, fontWeight: 'bold' },
  premiumBadge: { flexDirection: 'row', backgroundColor: COLORS.gold + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignItems: 'center', gap: 6 },
  premiumText: { color: COLORS.gold, fontWeight: 'bold', fontSize: 12 },
  progressCard: { backgroundColor: COLORS.card, borderRadius: 20, padding: 16, marginBottom: 20 },
  progressTitle: { color: COLORS.white, fontWeight: '600', marginBottom: 10 },
  progressBarContainer: { height: 8, backgroundColor: COLORS.dark, borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: COLORS.pink, borderRadius: 4 },
  progressStats: { color: COLORS.gray, fontSize: 12, marginTop: 8 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 12, paddingHorizontal: 12, marginBottom: 16 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: COLORS.white, paddingVertical: 12 },
  categoryScroll: { flexDirection: 'row', marginBottom: 20 },
  categoryChip: { flexDirection: 'row', backgroundColor: COLORS.card, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 25, marginRight: 10, gap: 6 },
  categoryChipActive: { backgroundColor: COLORS.pink },
  categoryChipText: { color: COLORS.gray },
  categoryChipTextActive: { color: '#000', fontWeight: '600' },
  taskCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'flex-start' },
  checkbox: { marginRight: 12 },
  taskContent: { flex: 1 },
  taskTitle: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  completedTask: { textDecorationLine: 'line-through', color: COLORS.gray },
  taskDescription: { color: COLORS.gray, fontSize: 13, marginTop: 4 },
  taskMeta: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  taskTime: { color: COLORS.gray, fontSize: 11 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  categoryBadgeText: { fontSize: 10, fontWeight: '600' },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: COLORS.pink, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.pink, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: COLORS.gray, fontSize: 18, marginTop: 15 },
  emptySubtext: { color: COLORS.gray, marginTop: 5 },
  
  // Add Task Styles
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 16 },
  modalTitle: { color: COLORS.white, fontSize: 20, fontWeight: 'bold' },
  input: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, color: COLORS.white, marginBottom: 16 },
  inputLabel: { color: COLORS.gray, marginBottom: 8, fontSize: 14 },
  categorySelect: { flexDirection: 'row', marginBottom: 16 },
  categorySelectItem: { alignItems: 'center', marginRight: 16, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: COLORS.card },
  categorySelectText: { color: COLORS.gray, fontSize: 12, marginTop: 4 },
  priorityRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  priorityBtn: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: COLORS.card, alignItems: 'center' },
  priorityBtnText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  dateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, padding: 14, borderRadius: 12, marginBottom: 12, gap: 10 },
  dateBtnText: { color: COLORS.white },
  reminderBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.card, padding: 14, borderRadius: 12, marginBottom: 20 },
  reminderText: { color: COLORS.white },
  saveBtn: { marginBottom: 40 },
  gradientBtn: { backgroundColor: COLORS.pink, padding: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  tabBar: { backgroundColor: COLORS.card, borderTopWidth: 0, height: 60, paddingBottom: 8 },
  
  // Stats Styles
  pageTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.white, marginVertical: 16 },
  mainStatCard: { backgroundColor: COLORS.card, borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20 },
  mainStatNumber: { fontSize: 48, fontWeight: 'bold', color: COLORS.pink },
  mainStatLabel: { color: COLORS.gray, marginTop: 5 },
  mainStatRing: { marginTop: 10 },
  mainStatRingText: { color: COLORS.white, fontSize: 14 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, gap: 12 },
  statMiniCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 16, padding: 16, alignItems: 'center' },
  statMiniNumber: { color: COLORS.white, fontSize: 24, fontWeight: 'bold' },
  statMiniLabel: { color: COLORS.gray, fontSize: 12, marginTop: 4 },
  sectionSubtitle: { color: COLORS.white, fontSize: 18, fontWeight: '600', marginBottom: 12 },
  categoryStat: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.card, padding: 12, borderRadius: 12, marginBottom: 8 },
  categoryStatLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryStatName: { color: COLORS.white },
  categoryStatCount: { color: COLORS.pink, fontWeight: 'bold' },
  quoteCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 20, marginTop: 20, marginBottom: 40 },
  quoteText: { color: COLORS.white, fontSize: 16, fontStyle: 'italic', textAlign: 'center' },
  quoteAuthor: { color: COLORS.gray, textAlign: 'center', marginTop: 10 },
  
  // Profile Styles
  profileHeader: { backgroundColor: COLORS.card, borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20 },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.pink, justifyContent: 'center', alignItems: 'center' },
  profileAvatarText: { fontSize: 36, fontWeight: 'bold', color: '#000' },
  profileName: { fontSize: 24, fontWeight: 'bold', color: COLORS.white, marginTop: 12 },
  profileEmail: { color: COLORS.gray, marginTop: 4 },
  premiumCard: { flexDirection: 'row', backgroundColor: COLORS.gold + '30', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 12, gap: 8 },
  premiumCardText: { color: COLORS.gold, fontWeight: 'bold' },
  settingsSection: { backgroundColor: COLORS.card, borderRadius: 20, padding: 16, marginBottom: 20 },
  settingsTitle: { color: COLORS.gray, fontSize: 14, marginBottom: 12 },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.dark },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingText: { color: COLORS.white, fontSize: 16 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.card, padding: 16, borderRadius: 12, marginBottom: 20 },
  logoutText: { color: COLORS.danger, fontSize: 16, fontWeight: '600' },
  versionText: { textAlign: 'center', color: COLORS.gray, marginBottom: 30 },
});
