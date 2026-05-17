// contexts/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signIn, signUp, updateUserAvatar, uploadAvatar } from '../supabase';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('@current_user');
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch (error) {} finally { setLoading(false); }
  };

  const login = async (email, password) => {
    const result = await signIn(email, password);
    if (result.success) {
      setUser(result.user);
      await AsyncStorage.setItem('@current_user', JSON.stringify(result.user));
      return true;
    }
    return false;
  };

  const signup = async (name, email, password) => {
    const result = await signUp(name, email, password);
    if (result.success) {
      setUser(result.user);
      await AsyncStorage.setItem('@current_user', JSON.stringify(result.user));
      return true;
    }
    return false;
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('@current_user');
  };

  const updateAvatar = async (uri, mimeType) => {
    const uploadResult = await uploadAvatar(user.id, uri, mimeType);
    if (uploadResult.success) {
      const updateResult = await updateUserAvatar(user.id, uploadResult.url);
      if (updateResult.success) {
        const updatedUser = { ...user, avatar_url: uploadResult.url };
        setUser(updatedUser);
        await AsyncStorage.setItem('@current_user', JSON.stringify(updatedUser));
        return true;
      }
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};
