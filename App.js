import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView, ScrollView, View, Text, TextInput, TouchableOpacity,
  Image, FlatList, Dimensions, Animated, Vibration, Switch, Modal,
  StatusBar
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const Colors = {
  dark: { bg: '#0B0E14', card: '#11141C', text: '#F1F5F9', textSec: '#94A3B8', accent: '#06F2F2', accentPurple: '#B76EFF' },
  light: { bg: '#F8FAFE', card: '#FFFFFF', text: '#0F172A', textSec: '#475569', accent: '#06F2F2', accentPurple: '#B76EFF' },
};

const ThemeContext = React.createContext({ isDark: true, toggleTheme: () => {} });

const demoPhotos = [
  'https://picsum.photos/id/104/200/200',
  'https://picsum.photos/id/106/200/200',
  'https://picsum.photos/id/20/200/200',
  'https://picsum.photos/id/22/200/200',
  'https://picsum.photos/id/26/200/200',
  'https://picsum.photos/id/28/200/200',
];

const SplashScreen = ({ onFinish }) => {
  useEffect(() => { setTimeout(() => onFinish(), 2000); }, []);
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0E14' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name="shield-checkmark" size={70} color="#06F2F2" />
        <MaterialIcons name="photo-library" size={60} color="#B76EFF" style={{ marginLeft: -15 }} />
      </View>
      <Text style={{ fontSize: 32, fontWeight: '700', color: '#FFF', marginTop: 20 }}>SecurePhoto Lock</Text>
      <Text style={{ color: '#94A3B8', marginTop: 8 }}>Private Cloud Gallery</Text>
    </View>
  );
};

const OnboardingScreen = ({ onFinish }) => {
  const [step, setStep] = useState(0);
  const steps = [
    { icon: 'folder-special', title: 'Protect Your Private Memories', desc: 'Military-grade encryption for your precious photos & videos.' },
    { icon: 'cloud-upload', title: 'Backup Safely With Gmail', desc: 'End-to-end encrypted cloud backup linked to your account.' },
    { icon: 'finger-print', title: 'Only You Can Access Your Vault', desc: 'Biometric lock + fake PIN mode for ultimate privacy.' },
  ];
  const next = () => { if (step < 2) setStep(step + 1); else onFinish(); };
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: Colors.dark.bg }}>
      <View style={{ alignItems: 'center' }}>
        <Ionicons name={steps[step].icon} size={90} color="#06F2F2" />
        <Text style={{ fontSize: 28, fontWeight: '700', color: '#FFF', marginTop: 30, textAlign: 'center' }}>{steps[step].title}</Text>
        <Text style={{ color: '#94A3B8', marginTop: 12, textAlign: 'center' }}>{steps[step].desc}</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 40 }}>
        {steps.map((_, i) => <View key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === step ? '#06F2F2' : '#334155', marginHorizontal: 4 }} />)}
      </View>
      <TouchableOpacity onPress={next} style={{ backgroundColor: '#06F2F2', padding: 16, borderRadius: 40, marginTop: 40 }}>
        <Text style={{ fontWeight: '600', textAlign: 'center', color: '#000' }}>{step === 2 ? 'Get Started' : 'Continue'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const LockScreen = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [shakeAnim] = useState(new Animated.Value(0));
  const correctPin = '1234';

  const handlePress = (num) => {
    if (num === 'del') { setPin(pin.slice(0, -1)); return; }
    if (pin.length < 4) setPin(pin + num);
  };

  useEffect(() => {
    if (pin.length === 4) {
      if (pin === correctPin) { onUnlock(); setPin(''); }
      else {
        Vibration.vibrate(200);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
        setPin('');
      }
    }
  }, [pin]);

  return (
    <BlurView intensity={90} style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={{ transform: [{ translateX: shakeAnim }], backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 48, padding: 32, alignItems: 'center' }}>
        <Text style={{ fontSize: 52, fontWeight: '300', color: '#FFF' }}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        <View style={{ flexDirection: 'row', marginVertical: 24 }}>
          {[0,1,2,3].map(i => <View key={i} style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: i < pin.length ? '#06F2F2' : '#334155', marginHorizontal: 8 }} />)}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: '100%', justifyContent: 'center' }}>
          {[1,2,3,4,5,6,7,8,9].map(n => <TouchableOpacity key={n} onPress={() => handlePress(n.toString())} style={{ width: '30%', padding: 16, margin: 4, backgroundColor: '#1E293B', borderRadius: 50, alignItems: 'center' }}><Text style={{ fontSize: 28, color: '#FFF' }}>{n}</Text></TouchableOpacity>)}
          <TouchableOpacity onPress={() => LocalAuthentication.authenticateAsync().then(res => res.success && onUnlock())} style={{ width: '30%', padding: 16, margin: 4, backgroundColor: '#1E293B', borderRadius: 50, alignItems: 'center' }}><Ionicons name="finger-print" size={32} color="#06F2F2" /></TouchableOpacity>
          <TouchableOpacity onPress={() => handlePress('0')} style={{ width: '30%', padding: 16, margin: 4, backgroundColor: '#1E293B', borderRadius: 50, alignItems: 'center' }}><Text style={{ fontSize: 28, color: '#FFF' }}>0</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => handlePress('del')} style={{ width: '30%', padding: 16, margin: 4, backgroundColor: '#1E293B', borderRadius: 50, alignItems: 'center' }}><Ionicons name="backspace" size={24} color="#FFF" /></TouchableOpacity>
        </View>
        <Text style={{ color: '#94A3B8', marginTop: 24 }}>Forgot Password? · Fake PIN Mode</Text>
      </Animated.View>
    </BlurView>
  );
};

const GalleryScreen = () => {
  const { isDark, colors } = React.useContext(ThemeContext);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}><Ionicons name="person-circle" size={36} color={colors.accent} /><Text style={{ color: colors.text, marginLeft: 8 }}>Hi, Alex</Text></View>
        <View style={{ flexDirection: 'row' }}><Ionicons name="cloud-done" size={24} color={colors.accent} /><Text style={{ color: colors.textSec }}> Synced</Text></View>
      </View>
      <View style={{ backgroundColor: colors.card, margin: 16, borderRadius: 32, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name="search" size={20} color={colors.textSec} />
        <TextInput placeholder="Search vault..." placeholderTextColor={colors.textSec} style={{ flex: 1, padding: 14, color: colors.text }} />
      </View>
      <View style={{ paddingHorizontal: 16 }}><Text style={{ color: colors.text }}>Storage: 4.2GB of 10GB · 42%</Text><View style={{ height: 6, backgroundColor: '#334155', borderRadius: 3, marginTop: 6 }}><View style={{ width: '42%', height: 6, backgroundColor: colors.accent, borderRadius: 3 }} /></View></View>
      <FlatList data={demoPhotos} numColumns={3} keyExtractor={(_,i)=>i.toString()} renderItem={({item}) => <Image source={{uri: item}} style={{ width: width/3.2, height: width/3.2, margin: 3, borderRadius: 16 }} />} style={{ marginTop: 12 }} />
    </SafeAreaView>
  );
};

const AlbumsScreen = () => {
  const { colors } = React.useContext(ThemeContext);
  const albums = ['Camera', 'Videos', 'Screenshots', 'Downloads', 'Favorites'];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: 16 }}>
      <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 20 }}>Albums</Text>
      {albums.map(album => <View key={album} style={{ backgroundColor: colors.card, borderRadius: 24, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}><Ionicons name="albums" size={32} color={colors.accent} /><Text style={{ color: colors.text, fontSize: 18, marginLeft: 16 }}>{album}</Text><Text style={{ color: colors.textSec, marginLeft: 'auto' }}>12 items</Text></View>)}
      <TouchableOpacity style={{ position: 'absolute', bottom: 20, right: 20, backgroundColor: colors.accent, padding: 16, borderRadius: 32 }}>
        <Ionicons name="add" size={28} color="#000" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const VaultScreen = () => {
  const { colors } = React.useContext(ThemeContext);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: 16 }}>
      <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text }}>🔒 Encrypted Vault</Text>
      <BlurView intensity={40} style={{ marginTop: 20, padding: 20, borderRadius: 32, alignItems: 'center' }}><Ionicons name="shield-checkmark" size={48} color="#06F2F2" /><Text style={{ color: '#FFF', marginTop: 8 }}>Secure enclave active</Text></BlurView>
      <View style={{ marginVertical: 20, flexDirection: 'row', alignItems: 'center' }}><Image source={{ uri: 'https://picsum.photos/id/105/100/100' }} style={{ width: 80, height: 80, borderRadius: 16 }} /><Text style={{ color: colors.textSec, marginLeft: 16 }}>3 hidden items</Text></View>
      <TouchableOpacity style={{ backgroundColor: colors.accent, padding: 16, borderRadius: 40, alignItems: 'center', marginBottom: 12 }}><Text style={{ fontWeight: '600' }}>Move to Vault +</Text></TouchableOpacity>
      <TouchableOpacity style={{ borderWidth: 1, borderColor: colors.textSec, padding: 16, borderRadius: 40, alignItems: 'center' }}><Text style={{ color: colors.text }}>Fake Vault Mode</Text></TouchableOpacity>
    </SafeAreaView>
  );
};

const BackupScreen = () => {
  const { colors } = React.useContext(ThemeContext);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: 16 }}>
      <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text }}>Cloud Backup</Text>
      <View style={{ backgroundColor: colors.card, borderRadius: 40, padding: 28, marginTop: 20, alignItems: 'center' }}>
        <Ionicons name="cloud-upload" size={64} color={colors.accent} />
        <Text style={{ color: colors.text, marginVertical: 12 }}>Backup progress 67%</Text>
        <View style={{ height: 8, backgroundColor: '#334155', borderRadius: 4, width: '100%' }}><View style={{ width: '67%', height: 8, backgroundColor: colors.accent, borderRadius: 4 }} /></View>
        <Text style={{ color: colors.textSec, marginTop: 12 }}>Last backup: 2 min ago</Text>
        <TouchableOpacity style={{ backgroundColor: colors.accent, padding: 14, borderRadius: 40, marginTop: 24, width: '100%' }}><Text style={{ textAlign: 'center', fontWeight: '600' }}>Restore Backup</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const SettingsScreen = () => {
  const { isDark, toggleTheme, colors } = React.useContext(ThemeContext);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: 16 }}>
      <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text }}>Settings</Text>
      <View style={{ marginTop: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16 }}><Text style={{ color: colors.text }}>🔒 Auto Lock (1 min)</Text><Switch value={true} /></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16 }}><Text style={{ color: colors.text }}>📸 Intruder Selfie</Text><Switch /></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16 }}><Text style={{ color: colors.text }}>🌙 Dark Mode</Text><Switch value={isDark} onValueChange={toggleTheme} /></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16 }}><Text style={{ color: colors.text }}>👤 Face Unlock</Text><Switch /></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16 }}><Text style={{ color: colors.text }}>🌐 Language</Text><Text style={{ color: colors.textSec }}>English</Text></View>
      </View>
    </SafeAreaView>
  );
};

const Tab = createBottomTabNavigator();
const MainTabs = () => (
  <Tab.Navigator screenOptions={({ route }) => ({ headerShown: false, tabBarStyle: { backgroundColor: '#11141C', borderTopWidth: 0, height: 60 }, tabBarIcon: ({ focused, color, size }) => { let icon; if (route.name === 'Photos') icon = 'images'; else if (route.name === 'Albums') icon = 'albums'; else if (route.name === 'Locked') icon = 'lock-closed'; else if (route.name === 'Backup') icon = 'cloud'; else icon = 'settings'; return <Ionicons name={icon} size={size} color={color} />; }, tabBarActiveTintColor: '#06F2F2', tabBarInactiveTintColor: '#64748B' })}>
    <Tab.Screen name="Photos" component={GalleryScreen} /><Tab.Screen name="Albums" component={AlbumsScreen} /><Tab.Screen name="Locked" component={VaultScreen} /><Tab.Screen name="Backup" component={BackupScreen} /><Tab.Screen name="Settings" component={SettingsScreen} />
  </Tab.Navigator>
);

const Stack = createStackNavigator();
export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboard, setShowOnboard] = useState(true);

  useEffect(() => { AsyncStorage.getItem('onboarded').then(val => val === 'true' && setShowOnboard(false)); }, []);
  const finishOnboard = () => { setShowOnboard(false); AsyncStorage.setItem('onboarded', 'true'); };

  if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;
  if (showOnboard) return <OnboardingScreen onFinish={finishOnboard} />;
  if (!isAuthenticated) return <LockScreen onUnlock={() => setIsAuthenticated(true)} />;

  return (
    <ThemeContext.Provider value={{ isDark, colors: isDark ? Colors.dark : Colors.light, toggleTheme: () => setIsDark(prev => !prev) }}>
      <NavigationContainer><MainTabs /></NavigationContainer>
    </ThemeContext.Provider>
  );
                                                }
