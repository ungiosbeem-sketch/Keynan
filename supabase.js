// supabase.js
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

const SUPABASE_URL = 'https://bwmvrsasculzivdcqyvi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_jC1Yhl9CMcnATcBtTRvwmQ_dM2QRr-j';

const customStorage = {
  getItem: async (key) => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value;
    } catch (error) {
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {}
  },
  removeItem: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {}
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Auth functions
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();
    if (error) throw error;
    return { success: true, user: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const signUp = async (name, email, password) => {
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
    return { success: true, user: newUser };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Task functions
export const getTasks = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { success: true, tasks: data || [] };
  } catch (error) {
    return { success: false, tasks: [] };
  }
};

export const addTask = async (task) => {
  try {
    const { error } = await supabase.from('tasks').insert([task]);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateTask = async (taskId, updates) => {
  try {
    const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false };
  }
};

export const deleteTask = async (taskId) => {
  try {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false };
  }
};

// Profile functions
export const updateUserAvatar = async (userId, avatarUrl) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false };
  }
};

export const uploadAvatar = async (userId, uri, mimeType) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileName = `${userId}_${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from('avatars')
      .upload(fileName, blob, { contentType: mimeType || 'image/jpeg', upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
    return { success: true, url: data.publicUrl };
  } catch (error) {
    return { success: false };
  }
};

export default supabase;
