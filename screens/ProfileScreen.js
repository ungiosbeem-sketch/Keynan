// screens/ProfileScreen.js
import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Image, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { COLORS, LIGHT_COLORS } from '../utils/colors';

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateAvatar } = useContext(AuthContext);
  const { darkMode, setDarkMode } = useContext(ThemeContext);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant gallery permission');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        setUploading(true);
        const image = result.assets[0];
        const success = await updateAvatar(image.uri, image.mimeType);
        if (success) {
          Alert.alert('Success', 'Profile photo updated!');
        } else {
          Alert.alert('Error', 'Failed to upload image');
        }
        setUploading(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image');
      setUploading(false);
    }
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
      <ScrollView>
        <View style={[styles.profileHeader, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
          <TouchableOpacity onPress={pickImage} disabled={uploading}>
            <View style={[styles.profileAvatar, { backgroundColor: COLORS.primary }]}>
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.profileAvatarImage} />
              ) : (
                <Text style={styles.profileAvatarText}>{user?.name?.[0] || 'U'}</Text>
              )}
              <View style={styles.cameraIcon}>
                <Feather name="camera" size={16} color="#000" />
              </View>
            </View>
          </TouchableOpacity>
          {uploading && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 10 }} />}
          <Text style={[styles.profileName, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>{user?.name}</Text>
          <Text style={[styles.profileEmail, { color: COLORS.gray }]}>{user?.email}</Text>
          <View style={[styles.memberSince, { backgroundColor: COLORS.primary + '15' }]}>
            <Text style={[styles.memberSinceText, { color: COLORS.primary }]}>Member since {memberSince}</Text>
          </View>
          <View style={[styles.premiumCard, { backgroundColor: COLORS.primary + '20' }]}>
            <FontAwesome5 name="crown" size={18} color={COLORS.gold} />
            <Text style={styles.premiumCardText}>Premium Member</Text>
          </View>
        </View>

        <View style={[styles.settingsSection, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
          <Text style={[styles.settingsTitle, { color: COLORS.gray }]}>Preferences</Text>
          <View style={[styles.settingItem, { borderBottomColor: darkMode ? COLORS.dark : LIGHT_COLORS.border }]}>
            <View style={styles.settingLeft}>
              <Feather name="moon" size={20} color={COLORS.primary} />
              <Text style={[styles.settingText, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>Dark Mode</Text>
            </View>
            <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ false: '#767577', true: COLORS.primary }} />
          </View>
        </View>

        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]} onPress={handleLogout}>
          <Feather name="log-out" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        <Text style={[styles.versionText, { color: COLORS.gray }]}>Keynan v2.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
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
});
