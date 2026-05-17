// App.js
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { ThemeProvider, ThemeContext } from './contexts/ThemeContext';
import { RoutineProvider } from './contexts/RoutineContext';
import { SchoolProvider } from './contexts/SchoolContext';
import { ReadingProvider } from './contexts/ReadingContext';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import AddTaskScreen from './screens/AddTaskScreen';
import RoutineScreen from './screens/RoutineScreen';
import SchoolScreen from './screens/SchoolScreen';
import ReadingScreen from './screens/ReadingScreen';
import ProfileScreen from './screens/ProfileScreen';
import { COLORS } from './utils/colors';

const Tab = createBottomTabNavigator();

function MainApp() {
  const { darkMode } = React.useContext(ThemeContext);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { backgroundColor: darkMode ? COLORS.card : '#FFFFFF' }],
        tabBarShowLabel: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
      }}>
      <Tab.Screen name="Home" options={{ tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} /> }}>
        {props => <HomeScreen {...props} />}
      </Tab.Screen>
      <Tab.Screen name="Routine" options={{ tabBarIcon: ({ color, size }) => <Feather name="sunrise" size={size} color={color} /> }}>
        {props => <RoutineScreen {...props} />}
      </Tab.Screen>
      <Tab.Screen name="School" options={{ tabBarIcon: ({ color, size }) => <Feather name="book" size={size} color={color} /> }}>
        {props => <SchoolScreen {...props} />}
      </Tab.Screen>
      <Tab.Screen name="Reading" options={{ tabBarIcon: ({ color, size }) => <Feather name="book-open" size={size} color={color} /> }}>
        {props => <ReadingScreen {...props} />}
      </Tab.Screen>
      <Tab.Screen name="Profile" options={{ tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} /> }}>
        {props => <ProfileScreen {...props} navigation={props.navigation} />}
      </Tab.Screen>
      <Tab.Screen name="AddTask" options={{ tabBarButton: () => null }}>
        {props => <AddTaskScreen {...props} navigation={props.navigation} route={props.route} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = React.useContext(AuthContext);
  const { darkMode } = React.useContext(ThemeContext);

  if (loading) {
    return (
      <View style={[styles.splashContainer, { backgroundColor: darkMode ? COLORS.background : '#F5F5F5' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.splashText, { color: COLORS.primary }]}>Keynan</Text>
      </View>
    );
  }

  return user ? <MainApp /> : <LoginScreen />;
}

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
                  <AppNavigator />
                </NavigationContainer>
              </ReadingProvider>
            </SchoolProvider>
          </RoutineProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  splashText: { fontSize: 32, fontWeight: 'bold', marginTop: 20 },
  splashSubtext: { color: COLORS.gray, fontSize: 14, marginTop: 8 },
  tabBar: { borderTopWidth: 0, height: 60, paddingBottom: 8 },
});
