import React, { useState, useEffect, useContext, createContext } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert, TextInput, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
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
};

// Auth Context
const AuthContext = createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('@current_user');
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch (error) { console.error('Check user error:', error); } 
    finally { setLoading(false); }
  };

  const login = async (email, password) => {
    try {
      console.log('Login attempt:', email);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();
      if (error) {
        console.log('Login error:', error);
        return false;
      }
      if (data) {
        console.log('Login success:', data);
        setUser(data);
        await AsyncStorage.setItem('@current_user', JSON.stringify(data));
        return true;
      }
      return false;
    } catch (error) { 
      console.error('Login exception:', error);
      return false; 
    }
  };

  const signup = async (name, email, password) => {
    try {
      console.log('Signup attempt:', email);
      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password,
        premium: true,
        join_date: new Date().toISOString(),
      };
      const { error } = await supabase.from('users').insert([newUser]);
      if (error) {
        console.log('Signup error:', error);
        return false;
      }
      console.log('Signup success:', newUser);
      setUser(newUser);
      await AsyncStorage.setItem('@current_user', JSON.stringify(newUser));
      return true;
    } catch (error) { 
      console.error('Signup exception:', error);
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

// Login Screen
function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showSignup, setShowSignup] = useState(false);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup } = useContext(AuthContext);

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
      console.log('Auth success, navigating to MainApp');
      navigation.replace('MainApp');
    } else {
      Alert.alert('Error', showSignup ? 'Email already exists' : 'Invalid credentials');
    }
  };

  return (
    <View style={styles.loginContainer}>
      <View style={styles.loginContent}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>K</Text>
        </View>
        <Text style={styles.loginTitle}>Keynan</Text>
        <Text style={styles.loginSubtitle}>Study • Routine • Read</Text>

        {showSignup && (
          <TextInput
            placeholder="Full Name"
            placeholderTextColor="#666"
            style={styles.loginInput}
            value={name}
            onChangeText={setName}
          />
        )}
        <TextInput
          placeholder="Email"
          placeholderTextColor="#666"
          style={styles.loginInput}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#666"
          style={styles.loginInput}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.loginButton} onPress={handleAuth} disabled={isLoading}>
          <Text style={styles.loginButtonText}>{isLoading ? 'Loading...' : (showSignup ? 'Sign Up' : 'Login')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowSignup(!showSignup)}>
          <Text style={styles.loginSwitch}>{showSignup ? 'Already have account? Login' : 'Create new account'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Home Screen
function HomeScreen() {
  const { user, logout } = useContext(AuthContext);
  console.log('HomeScreen rendered, user:', user);

  return (
    <View style={styles.homeContainer}>
      <Text style={styles.welcomeText}>Welcome, {user?.name}!</Text>
      <Text style={styles.userInfo}>Email: {user?.email}</Text>
      <Text style={styles.userInfo}>ID: {user?.id}</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={() => {
        logout();
        console.log('Logged out');
      }}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

// Profile Screen
function ProfileScreen() {
  const { user, logout } = useContext(AuthContext);

  return (
    <View style={styles.homeContainer}>
      <Text style={styles.welcomeText}>Profile</Text>
      <Text style={styles.userInfo}>Name: {user?.name}</Text>
      <Text style={styles.userInfo}>Email: {user?.email}</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

// Main App
function MainApp() {
  console.log('MainApp rendered');
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: COLORS.card, height: 60 },
        tabBarShowLabel: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
      }}>
      <Tab.Screen name="Home" options={{ tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} /> }}>
        {() => <HomeScreen />}
      </Tab.Screen>
      <Tab.Screen name="Profile" options={{ tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} /> }}>
        {() => <ProfileScreen />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// App
export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    try {
      console.log('App started');
      setTimeout(() => {
        console.log('App ready');
        setIsReady(true);
      }, 500);
    } catch (e) {
      console.error('App error:', e);
      setError(e.message);
    }
  }, []);

  if (error) {
    return (
      <View style={styles.splashContainer}>
        <Text style={[styles.splashText, { color: 'red' }]}>Error:</Text>
        <Text style={[styles.splashText, { color: 'white', fontSize: 14 }]}>{error}</Text>
      </View>
    );
  }

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
              console.log('Auth state - user:', user, 'loading:', loading);
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
  logoText: { fontSize: 40, fontWeight: 'bold', color: COLORS.primary },
  loginTitle: { fontSize: 32, fontWeight: 'bold', color: COLORS.white, marginTop: 10 },
  loginSubtitle: { color: COLORS.gray, marginBottom: 30 },
  loginInput: { width: '100%', backgroundColor: COLORS.card, borderRadius: 12, padding: 15, color: COLORS.white, marginBottom: 12 },
  loginButton: { width: '100%', backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  loginButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  loginSwitch: { color: COLORS.primary, marginTop: 20 },
  homeContainer: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  welcomeText: { fontSize: 24, fontWeight: 'bold', color: COLORS.white, marginBottom: 20 },
  userInfo: { fontSize: 16, color: COLORS.white, marginBottom: 10 },
  logoutButton: { backgroundColor: COLORS.primary, padding: 12, borderRadius: 8, marginTop: 20 },
  logoutButtonText: { color: '#000', fontWeight: 'bold' },
});
