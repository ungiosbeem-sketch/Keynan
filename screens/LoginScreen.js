// screens/LoginScreen.js
import React, { useState, useContext, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, Alert } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { COLORS, LIGHT_COLORS } from '../utils/colors';

const { width } = require('react-native').Dimensions.get('window');

export default function LoginScreen({ navigation }) {
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
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (showSignup && !name) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
          <TextInput
            placeholder="Full Name"
            placeholderTextColor={COLORS.gray}
            style={[styles.loginInput, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card, color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}
            value={name}
            onChangeText={setName}
          />
        )}
        <TextInput
          placeholder="Email"
          placeholderTextColor={COLORS.gray}
          style={[styles.loginInput, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card, color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor={COLORS.gray}
          style={[styles.loginInput, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card, color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

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

const styles = StyleSheet.create({
  loginContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loginContent: { width: width - 40, alignItems: 'center' },
  logoCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  loginTitle: { fontSize: 32, fontWeight: 'bold', marginTop: 10 },
  loginSubtitle: { marginBottom: 30, textAlign: 'center' },
  loginInput: { width: '100%', borderRadius: 15, padding: 15, marginBottom: 12 },
  loginButton: { width: '100%', padding: 16, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  loginButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  loginSwitch: { marginTop: 20 },
});
