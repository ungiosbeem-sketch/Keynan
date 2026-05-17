// supabase.js
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

// ============ SUPABASE CONFIGURATION ============
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
    console.error('Sign up error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Login user
 */
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
    console.error('Sign in error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sign out user
 */
export const signOut = async () => {
  try {
    await AsyncStorage.removeItem('@current_user');
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
    const savedUser = await AsyncStorage.getItem('@current_user');
    if (savedUser) {
      return { success: true, user: JSON.parse(savedUser) };
    }
    return { success: true, user: null };
  } catch (error) {
    console.error('Get current user error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update user avatar
 */
export const updateUserAvatar = async (userId, avatarUrl) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Update avatar error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Update profile error:', error);
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

/**
 * Get task statistics
 */
export const getUserTaskStats = async (userId) => {
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

    tasks.forEach(task => {
      if (task.category) {
        stats.byCategory[task.category] = (stats.byCategory[task.category] || 0) + 1;
      }
    });

    return { success: true, stats };
  } catch (error) {
    console.error('Get task stats error:', error);
    return { success: false, error: error.message };
  }
};

// ============ ROUTINE FUNCTIONS ============

/**
 * Get daily routine
 */
export const getRoutine = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', userId)
      .order('order', { ascending: true });

    if (error) throw error;
    return { success: true, routines: data || [] };
  } catch (error) {
    console.error('Get routine error:', error);
    return { success: false, error: error.message, routines: [] };
  }
};

/**
 * Update routine item
 */
export const updateRoutineItem = async (routineId, completed) => {
  try {
    const { error } = await supabase
      .from('routines')
      .update({ completed, updated_at: new Date().toISOString() })
      .eq('id', routineId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Update routine error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Reset daily routine
 */
export const resetRoutine = async (userId) => {
  try {
    const { error } = await supabase
      .from('routines')
      .update({ completed: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Reset routine error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Add routine item
 */
export const addRoutineItem = async (routine) => {
  try {
    const { data, error } = await supabase
      .from('routines')
      .insert([routine])
      .select()
      .single();

    if (error) throw error;
    return { success: true, routine: data };
  } catch (error) {
    console.error('Add routine error:', error);
    return { success: false, error: error.message };
  }
};

// ============ SCHOOL SCHEDULE FUNCTIONS ============

/**
 * Get school schedule
 */
export const getSchedule = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('schedule')
      .select('*')
      .eq('user_id', userId)
      .order('day', { ascending: true });

    if (error) throw error;
    return { success: true, schedule: data || [] };
  } catch (error) {
    console.error('Get schedule error:', error);
    return { success: false, error: error.message, schedule: [] };
  }
};

/**
 * Add schedule item
 */
export const addScheduleItem = async (item) => {
  try {
    const { data, error } = await supabase
      .from('schedule')
      .insert([item])
      .select()
      .single();

    if (error) throw error;
    return { success: true, schedule: data };
  } catch (error) {
    console.error('Add schedule error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update schedule item
 */
export const updateScheduleItem = async (scheduleId, updates) => {
  try {
    const { error } = await supabase
      .from('schedule')
      .update(updates)
      .eq('id', scheduleId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Update schedule error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete schedule item
 */
export const deleteScheduleItem = async (scheduleId) => {
  try {
    const { error } = await supabase
      .from('schedule')
      .delete()
      .eq('id', scheduleId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Delete schedule error:', error);
    return { success: false, error: error.message };
  }
};

// ============ HOMEWORK FUNCTIONS ============

/**
 * Get homework list
 */
export const getHomework = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('homework')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, homework: data || [] };
  } catch (error) {
    console.error('Get homework error:', error);
    return { success: false, error: error.message, homework: [] };
  }
};

/**
 * Add homework
 */
export const addHomework = async (homework) => {
  try {
    const { data, error } = await supabase
      .from('homework')
      .insert([homework])
      .select()
      .single();

    if (error) throw error;
    return { success: true, homework: data };
  } catch (error) {
    console.error('Add homework error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Toggle homework completion
 */
export const toggleHomeworkComplete = async (homeworkId, completed) => {
  try {
    const { error } = await supabase
      .from('homework')
      .update({ completed })
      .eq('id', homeworkId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Toggle homework error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete homework
 */
export const deleteHomework = async (homeworkId) => {
  try {
    const { error } = await supabase
      .from('homework')
      .delete()
      .eq('id', homeworkId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Delete homework error:', error);
    return { success: false, error: error.message };
  }
};

// ============ READING LIST FUNCTIONS ============

/**
 * Get books list
 */
export const getBooks = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, books: data || [] };
  } catch (error) {
    console.error('Get books error:', error);
    return { success: false, error: error.message, books: [] };
  }
};

/**
 * Add book
 */
export const addBook = async (book) => {
  try {
    const { data, error } = await supabase
      .from('books')
      .insert([book])
      .select()
      .single();

    if (error) throw error;
    return { success: true, book: data };
  } catch (error) {
    console.error('Add book error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update book reading progress
 */
export const updateBookProgress = async (bookId, currentPage) => {
  try {
    const completed = currentPage >= (await getBookTotalPages(bookId));
    const { error } = await supabase
      .from('books')
      .update({ current_page: currentPage, completed, updated_at: new Date().toISOString() })
      .eq('id', bookId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Update book progress error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get book total pages helper
 */
const getBookTotalPages = async (bookId) => {
  const { data, error } = await supabase
    .from('books')
    .select('total_pages')
    .eq('id', bookId)
    .single();
  if (error) return 0;
  return data.total_pages;
};

/**
 * Delete book
 */
export const deleteBook = async (bookId) => {
  try {
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', bookId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Delete book error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get reading statistics
 */
export const getReadingStats = async (userId) => {
  try {
    const { data: books, error } = await supabase
      .from('books')
      .select('total_pages, current_page, completed')
      .eq('user_id', userId);

    if (error) throw error;

    const stats = {
      totalBooks: books.length,
      completedBooks: books.filter(b => b.completed).length,
      totalPages: books.reduce((sum, b) => sum + (b.total_pages || 0), 0),
      totalRead: books.reduce((sum, b) => sum + (b.current_page || 0), 0),
    };
    stats.readingProgress = stats.totalPages > 0 
      ? Math.round((stats.totalRead / stats.totalPages) * 100) 
      : 0;

    return { success: true, stats };
  } catch (error) {
    console.error('Get reading stats error:', error);
    return { success: false, error: error.message };
  }
};

// ============ AVATAR STORAGE FUNCTIONS ============

/**
 * Upload avatar image
 */
export const uploadAvatar = async (userId, imageUri, mimeType) => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const fileName = `${userId}_${Date.now()}.jpg`;

    const { error } = await supabase.storage
      .from('avatars')
      .upload(fileName, blob, { contentType: mimeType, upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
    return { success: true, url: data.publicUrl };
  } catch (error) {
    console.error('Upload avatar error:', error);
    return { success: false, error: error.message };
  }
};

// ============ REALTIME SUBSCRIPTIONS ============

/**
 * Subscribe to tasks changes
 */
export const subscribeToTasks = (userId, onInsert, onUpdate, onDelete) => {
  const subscription = supabase
    .channel('tasks_changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
      (payload) => onInsert?.(payload.new)
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
      (payload) => onUpdate?.(payload.new)
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
      (payload) => onDelete?.(payload.old)
    )
    .subscribe();

  return subscription;
};

/**
 * Unsubscribe from realtime
 */
export const unsubscribe = (subscription) => {
  if (subscription) {
    supabase.removeChannel(subscription);
  }
};

// Export default
export default supabase;
// Ku dar supabase.js gudihiisa

// ============ ROUTINE FUNCTIONS ============
export const getRoutine = async (userId) => {
  const { data, error } = await supabase
    .from('routines')
    .select('*')
    .eq('user_id', userId)
    .order('order', { ascending: true });
  return { success: !error, routines: data || [] };
};

export const updateRoutineItem = async (routineId, completed) => {
  const { error } = await supabase
    .from('routines')
    .update({ completed, updated_at: new Date().toISOString() })
    .eq('id', routineId);
  return { success: !error };
};

// ============ SCHOOL FUNCTIONS ============
export const getSchedule = async (userId) => {
  const { data, error } = await supabase
    .from('schedule')
    .select('*')
    .eq('user_id', userId);
  return { success: !error, schedule: data || [] };
};

export const addScheduleItem = async (item) => {
  const { data, error } = await supabase.from('schedule').insert([item]).select();
  return { success: !error, schedule: data?.[0] };
};

// ============ HOMEWORK FUNCTIONS ============
export const getHomework = async (userId) => {
  const { data, error } = await supabase
    .from('homework')
    .select('*')
    .eq('user_id', userId);
  return { success: !error, homework: data || [] };
};

export const addHomework = async (homework) => {
  const { data, error } = await supabase.from('homework').insert([homework]).select();
  return { success: !error, homework: data?.[0] };
};

// ============ BOOKS FUNCTIONS ============
export const getBooks = async (userId) => {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', userId);
  return { success: !error, books: data || [] };
};

export const addBook = async (book) => {
  const { data, error } = await supabase.from('books').insert([book]).select();
  return { success: !error, book: data?.[0] };
};
