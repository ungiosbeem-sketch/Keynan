// supabase.js
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

// ============ SUPABASE CONFIGURATION ============
// Ku beddel keys-kaaga halkan!
const SUPABASE_URL = 'https://bwmvrsasculzivdcqyvi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_jC1Yhl9CMcnATcBtTRvwmQ_dM2QRr-j';

// Custom storage for Supabase (uses AsyncStorage)
const customStorage = {
  getItem: async (key) => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value;
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Storage setItem error:', error);
    }
  },
  removeItem: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Storage removeItem error:', error);
    }
  },
};

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ============ USER FUNCTIONS ============

/**
 * Sign up new user
 */
export const signUp = async (email, password, name) => {
  try {
    // First, create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    // Then, save user details to users table
    if (authData.user) {
      const newUser = {
        id: authData.user.id,
        name: name,
        email: email,
        premium: true,
        join_date: new Date().toISOString(),
      };

      const { error: dbError } = await supabase
        .from('users')
        .insert([newUser]);

      if (dbError) throw dbError;

      return { success: true, user: newUser };
    }

    return { success: false, error: 'No user data returned' };
  } catch (error) {
    console.error('Sign up error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Login user
 */
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Get user details from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError && userError.code !== 'PGRST116') throw userError;

    return { 
      success: true, 
      user: userData || { id: data.user.id, email: data.user.email },
      session: data.session 
    };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sign out user
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    
    if (user) {
      // Get additional user data from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (userError && userError.code !== 'PGRST116') throw userError;
      
      return { success: true, user: userData || user };
    }
    
    return { success: true, user: null };
  } catch (error) {
    console.error('Get current user error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Reset password - send reset email
 */
export const resetPassword = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'ungioapp://reset-password',
    });
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Reset password error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update password
 */
export const updatePassword = async (newPassword) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Update password error:', error);
    return { success: false, error: error.message };
  }
};

// ============ TASKS FUNCTIONS ============

/**
 * Get all tasks for current user
 */
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
    console.error('Get tasks error:', error);
    return { success: false, error: error.message, tasks: [] };
  }
};

/**
 * Add new task
 */
export const addTask = async (task) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert([task])
      .select()
      .single();

    if (error) throw error;
    return { success: true, task: data };
  } catch (error) {
    console.error('Add task error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update task
 */
export const updateTask = async (taskId, updates) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, task: data };
  } catch (error) {
    console.error('Update task error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete task
 */
export const deleteTask = async (taskId) => {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Delete task error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Toggle task completion
 */
export const toggleTaskComplete = async (taskId, currentStatus) => {
  return updateTask(taskId, { completed: !currentStatus });
};

// ============ USER PROFILE FUNCTIONS ============

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, user: data };
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user statistics
 */
export const getUserStats = async (userId) => {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('completed, category, priority')
      .eq('user_id', userId);

    if (error) throw error;

    const stats = {
      total: tasks.length,
      completed: tasks.filter(t => t.completed).length,
      pending: tasks.filter(t => !t.completed).length,
      completionRate: tasks.length > 0 
        ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) 
        : 0,
      byCategory: {},
      byPriority: {
        low: tasks.filter(t => t.priority === 'low').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        high: tasks.filter(t => t.priority === 'high').length,
      },
    };

    // Calculate category stats
    tasks.forEach(task => {
      if (task.category) {
        stats.byCategory[task.category] = (stats.byCategory[task.category] || 0) + 1;
      }
    });

    return { success: true, stats };
  } catch (error) {
    console.error('Get user stats error:', error);
    return { success: false, error: error.message };
  }
};

// ============ REALTIME SUBSCRIPTIONS ============

/**
 * Subscribe to tasks changes (realtime)
 */
export const subscribeToTasks = (userId, onInsert, onUpdate, onDelete) => {
  const subscription = supabase
    .channel('tasks_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (onInsert) onInsert(payload.new);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (onUpdate) onUpdate(payload.new);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (onDelete) onDelete(payload.old);
      }
    )
    .subscribe();

  return subscription;
};

/**
 * Unsubscribe from realtime
 */
export const unsubscribeFromTasks = (subscription) => {
  if (subscription) {
    supabase.removeChannel(subscription);
  }
};

// ============ HELPER FUNCTIONS ============

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

/**
 * Get session
 */
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) return null;
  return session;
};

/**
 * Upload file to storage
 */
export const uploadFile = async (bucket, path, file) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);

    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Upload file error:', error);
    return { success: false, error: error.message };
  }
};

// Export default client
export default supabase;
