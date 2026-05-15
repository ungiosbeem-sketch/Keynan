import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
  Alert,
  Keyboard,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from './supabase';

const { width } = Dimensions.get('window');
const Tab = createBottomTabNavigator();
const STORAGE_KEY = '@ungio_tasks';

const COLORS = {
  background: '#FFFFFF',
  backgroundDark: '#F8F9FA',
  primary: '#6366F1',
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  text: '#1F2937',
  textLight: '#6B7280',
  white: '#FFFFFF',
  gray: '#9CA3AF',
  lightGray: '#F3F4F6',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  study: '#8B5CF6',
  work: '#EC4899',
  personal: '#06B6D4',
};

const CATEGORIES = [
  { id: 'study', name: 'Study', icon: 'book-open', color: COLORS.study },
  { id: 'work', name: 'Work', icon: 'briefcase', color: COLORS.work },
  { id: 'personal', name: 'Personal', icon: 'heart', color: COLORS.personal },
];

const PRIORITIES = [
  { id: 'high', name: 'High', color: COLORS.error, icon: 'alert-circle' },
  { id: 'medium', name: 'Medium', color: COLORS.warning, icon: 'minus-circle' },
  { id: 'low', name: 'Low', color: COLORS.success, icon: 'checkmark-circle' },
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ============ AUTH SCREEN ============
function AuthScreen({ onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Fadlan geli email iyo password');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) throw error;
        onAuthSuccess();
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) throw error;
        Alert.alert('Success', 'Account created! Fadlan soo gal.');
        setIsLogin(true);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.authContainer}>
      <View style={styles.authCard}>
        <View style={styles.authLogo}>
          <Feather name="calendar" size={48} color={COLORS.primary} />
        </View>
        <Text style={styles.authTitle}>Ungio Planner</Text>
        <Text style={styles.authSubtitle}>Maamul hawlahaaga si fudud</Text>

        <TextInput
          style={styles.authInput}
          placeholder="Email"
          placeholderTextColor={COLORS.textLight}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.authInput}
          placeholder="Password"
          placeholderTextColor={COLORS.textLight}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.authButton} onPress={handleAuth} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.authButtonText}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.authSwitchText}>
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============ HOME SCREEN ============
function HomeScreen({ tasks, setTasks, filter, setFilter, userEmail }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('study');
  const [reminderMinutes, setReminderMinutes] = useState(15);
  const [reminderEnabled, setReminderEnabled] = useState(false);

  const todayTasks = tasks.filter(task => {
    const taskDate = new Date(task.date);
    const today = new Date();
    return taskDate.toDateString() === today.toDateString();
  });

  const completedTasks = tasks.filter(t => t.completed);
  const pendingTasks = tasks.filter(t => !t.completed);
  const todayCompleted = todayTasks.filter(t => t.completed).length;
  const todayPending = todayTasks.filter(t => !t.completed).length;

  const addTask = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Fadlan geli cinwaanka hawsha');
      return;
    }

    const taskDate = date.toLocaleDateString();
    const taskTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const newTask = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      date: taskDate,
      time: taskTime,
      priority,
      category,
      completed: false,
      reminderEnabled,
      reminderMinutes,
      createdAt: new Date().toISOString(),
    };
    
    setTasks([newTask, ...tasks]);
    setTitle('');
    setDescription('');
    setReminderEnabled(false);
    setShowAddModal(false);
    
    if (reminderEnabled) {
      await scheduleNotification(newTask.title, date, time, reminderMinutes);
    }
  };

  const scheduleNotification = async (taskTitle, taskDate, taskTime, minutesBefore) => {
    try {
      const year = taskDate.getFullYear();
      const month = taskDate.getMonth();
      const day = taskDate.getDate();
      const hours = taskTime.getHours();
      const minutes = taskTime.getMinutes() - minutesBefore;
      
      const triggerDate = new Date(year, month, day, hours, minutes);
      
      if (triggerDate < new Date()) return;
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Xusuusin Hawsha! ⏰',
          body: `${taskTitle} - ${minutesBefore} daqiiqo ka hor`,
          sound: true,
        },
        trigger: triggerDate,
      });
    } catch (error) {}
  };

  const toggleComplete = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id) => {
    Alert.alert('Tirtir hawsha', 'Ma hubtaa inaad rabto inaad tirtirto?', [
      { text: 'Kansal', style: 'cancel' },
      { text: 'Tirtir', style: 'destructive', onPress: () => setTasks(tasks.filter(t => t.id !== id)) },
    ]);
  };

  const getCategoryIcon = (catId) => {
    const cat = CATEGORIES.find(c => c.id === catId);
    return cat?.icon || 'star';
  };

  const getCategoryColor = (catId) => {
    const cat = CATEGORIES.find(c => c.id === catId);
    return cat?.color || COLORS.primary;
  };

  const getPriorityIcon = (priId) => {
    const pri = PRIORITIES.find(p => p.id === priId);
    return pri?.icon || 'minus-circle';
  };

  const getPriorityColor = (priId) => {
    const pri = PRIORITIES.find(p => p.id === priId);
    return pri?.color || COLORS.textLight;
  };

  const renderTask = ({ item }) => (
    <View style={styles.taskCard}>
      <TouchableOpacity onPress={() => toggleComplete(item.id)} style={styles.checkbox}>
        <View style={[styles.checkboxInner, item.completed && styles.checkboxChecked]}>
          {item.completed && <Feather name="check" size={14} color="#fff" />}
        </View>
      </TouchableOpacity>
      <View style={styles.taskContent}>
        <View style={styles.taskHeader}>
          <Text style={[styles.taskTitle, item.completed && styles.completedText]}>{item.title}</Text>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
            <Feather name={getPriorityIcon(item.priority)} size={10} color={getPriorityColor(item.priority)} />
            <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>{item.priority}</Text>
          </View>
        </View>
        <View style={styles.taskMeta}>
          <Feather name="calendar" size={12} color={COLORS.textLight} />
          <Text style={styles.metaText}>{item.date}</Text>
          <Feather name="clock" size={12} color={COLORS.textLight} style={{ marginLeft: 8 }} />
          <Text style={styles.metaText}>{item.time}</Text>
          <View style={[styles.categoryTag, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
            <Feather name={getCategoryIcon(item.category)} size={10} color={getCategoryColor(item.category)} />
            <Text style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>{item.category}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity onPress={() => deleteTask(item.id)}>
        <Feather name="trash-2" size={18} color={COLORS.textLight} />
      </TouchableOpacity>
    </View>
  );

  const renderCompletedTask = ({ item }) => (
    <View style={styles.completedTaskCard}>
      <Feather name="check-circle" size={20} color={COLORS.success} />
      <View style={styles.taskContent}>
        <Text style={styles.completedTaskTitle}>{item.title}</Text>
        <View style={styles.taskMeta}>
          <Feather name="calendar" size={10} color={COLORS.textLight} />
          <Text style={styles.metaText}>{item.date}</Text>
          <Feather name="clock" size={10} color={COLORS.textLight} style={{ marginLeft: 8 }} />
          <Text style={styles.metaText}>{item.time}</Text>
        </View>
      </View>
    </View>
  );

  const username = userEmail?.split('@')[0] || 'User';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Maamul hawlahaaga,</Text>
            <Text style={styles.userName}>{username}</Text>
          </View>
          <TouchableOpacity style={styles.notificationIcon}>
            <Feather name="bell" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Search/Add Bar */}
        <TouchableOpacity style={styles.searchBar} onPress={() => setShowAddModal(true)}>
          <Feather name="search" size={20} color={COLORS.textLight} />
          <Text style={styles.searchText}>Maxaaq qorshaynaysaa?</Text>
          <Feather name="plus-circle" size={24} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Category Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          <TouchableOpacity 
            style={[styles.categoryTab, filter === 'all' && styles.categoryTabActive]} 
            onPress={() => setFilter('all')}>
            <Text style={[styles.categoryTabText, filter === 'all' && styles.categoryTabTextActive]}>Dhammaan</Text>
          </TouchableOpacity>
          {CATEGORIES.map(cat => (
            <TouchableOpacity 
              key={cat.id}
              style={[styles.categoryTab, filter === cat.id && styles.categoryTabActive]} 
              onPress={() => setFilter(cat.id)}>
              <Feather name={cat.icon} size={14} color={filter === cat.id ? COLORS.white : cat.color} />
              <Text style={[styles.categoryTabText, filter === cat.id && styles.categoryTabTextActive]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Today's Tasks Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Hawlaha Maanta</Text>
          <Text style={styles.sectionDate}>{new Date().toLocaleDateString('so-SO', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{todayTasks.length}</Text>
            <Text style={styles.statLabel}>Wadarta</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: COLORS.success + '10' }]}>
            <Text style={[styles.statNumber, { color: COLORS.success }]}>{todayCompleted}</Text>
            <Text style={styles.statLabel}>Dhammayey</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: COLORS.warning + '10' }]}>
            <Text style={[styles.statNumber, { color: COLORS.warning }]}>{todayPending}</Text>
            <Text style={styles.statLabel}>Hadhay</Text>
          </View>
        </View>

        {/* Pending Tasks */}
        {pendingTasks.filter(t => filter === 'all' ? true : t.category === filter).length > 0 && (
          <>
            <Text style={styles.subsectionTitle}>Hawlaha Qabso</Text>
            <FlatList 
              data={pendingTasks.filter(t => filter === 'all' ? true : t.category === filter)} 
              keyExtractor={item => item.id} 
              renderItem={renderTask} 
              scrollEnabled={false} 
            />
          </>
        )}

        {/* Completed Tasks Section */}
        {completedTasks.length > 0 && (
          <>
            <Text style={styles.subsectionTitle}>Dhammeyay ({completedTasks.length})</Text>
            <FlatList 
              data={completedTasks.slice(0, 3)} 
              keyExtractor={item => item.id} 
              renderItem={renderCompletedTask} 
              scrollEnabled={false} 
            />
          </>
        )}
      </ScrollView>

      {/* FAB Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Feather name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Add Task Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hawl cusub</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Feather name="x" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalLabel}>Cinwaanka hawsha</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Tusaale: Wax akhris"
                placeholderTextColor={COLORS.textLight}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.modalLabel}>Sharaxaad (ikhtiyaari)</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="Faahfaahin dheeraad ah..."
                placeholderTextColor={COLORS.textLight}
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <View style={styles.modalRow}>
                <TouchableOpacity style={styles.modalHalfButton} onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.modalLabelSmall}>Taariikh</Text>
                  <View style={styles.modalPicker}>
                    <Feather name="calendar" size={16} color={COLORS.primary} />
                    <Text style={styles.modalPickerText}>{date.toLocaleDateString()}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalHalfButton} onPress={() => setShowTimePicker(true)}>
                  <Text style={styles.modalLabelSmall}>Saacad</Text>
                  <View style={styles.modalPicker}>
                    <Feather name="clock" size={16} color={COLORS.primary} />
                    <Text style={styles.modalPickerText}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <Text style={styles.modalLabel}>Mudnaan</Text>
              <View style={styles.priorityContainer}>
                {PRIORITIES.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.priorityOption, priority === p.id && { borderColor: p.color, backgroundColor: p.color + '10' }]}
                    onPress={() => setPriority(p.id)}>
                    <Feather name={p.icon} size={14} color={p.color} />
                    <Text style={[styles.priorityOptionText, { color: p.color }]}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>Qeybta</Text>
              <View style={styles.categoryContainer}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.categoryOption, category === c.id && { borderColor: c.color, backgroundColor: c.color + '10' }]}
                    onPress={() => setCategory(c.id)}>
                    <Feather name={c.icon} size={16} color={category === c.id ? c.color : COLORS.textLight} />
                    <Text style={[styles.categoryOptionText, category === c.id && { color: c.color }]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>Xusuusin</Text>
              <View style={styles.reminderRow}>
                <TouchableOpacity 
                  style={[styles.reminderButton, reminderEnabled && styles.reminderButtonActive]} 
                  onPress={() => setReminderEnabled(!reminderEnabled)}>
                  <Feather name="bell" size={16} color={reminderEnabled ? COLORS.primary : COLORS.textLight} />
                  <Text style={[styles.reminderText, reminderEnabled && styles.reminderTextActive]}>Dhaar xusuusin</Text>
                </TouchableOpacity>
                
                {reminderEnabled && (
                  <View style={styles.minutesSelector}>
                    {[5, 10, 15, 30].map(min => (
                      <TouchableOpacity
                        key={min}
                        style={[styles.minuteOption, reminderMinutes === min && styles.minuteOptionActive]}
                        onPress={() => setReminderMinutes(min)}>
                        <Text style={[styles.minuteText, reminderMinutes === min && styles.minuteTextActive]}>{min} min</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={addTask}>
                <Text style={styles.saveButtonText}>Kaydi hawsha</Text>
                <Feather name="check" size={18} color="#fff" />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {showDatePicker && <DateTimePicker value={date} mode="date" display="default" onChange={(e, d) => { setShowDatePicker(false); if (d) setDate(d); }} />}
      {showTimePicker && <DateTimePicker value={time} mode="time" display="default" onChange={(e, t) => { setShowTimePicker(false); if (t) setTime(t); }} />}
    </SafeAreaView>
  );
}

// ============ CALENDAR SCREEN ============
function CalendarScreen({ tasks }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    const startOffset = firstDay.getDay();
    for (let i = 0; i < startOffset; i++) days.push(null);
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const isSameDay = (date1, date2) => {
    return date1 && date2 && 
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear();
  };

  const getTasksForDate = (date) => {
    return tasks.filter(task => {
      const [day, month, year] = task.date.split('/');
      return day && month && year && 
        parseInt(day) === date.getDate() &&
        parseInt(month) - 1 === date.getMonth() &&
        parseInt(year) === date.getFullYear();
    });
  };

  const days = getDaysInMonth(currentMonth);
  const selectedTasks = getTasksForDate(selectedDate);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
            <Feather name="chevron-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.calendarMonth}>
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
            <Feather name="chevron-right" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekDays}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <Text key={day} style={styles.weekDayText}>{day}</Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {days.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.calendarDay,
                day && isSameDay(day, selectedDate) && styles.calendarDaySelected,
              ]}
              onPress={() => day && setSelectedDate(day)}>
              {day && (
                <>
                  <Text style={[styles.calendarDayText, isSameDay(day, selectedDate) && styles.calendarDayTextSelected]}>
                    {day.getDate()}
                  </Text>
                  {getTasksForDate(day).length > 0 && <View style={styles.calendarDot} />}
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.dailyTasksContainer}>
          <Text style={styles.dailyTasksTitle}>
            {selectedDate.toLocaleDateString('so-SO', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
          {selectedTasks.length === 0 ? (
            <View style={styles.emptyDaily}>
              <Feather name="calendar" size={40} color={COLORS.textLight} />
              <Text style={styles.emptyDailyText}>Ma jiraan hawlaha maanta</Text>
            </View>
          ) : (
            selectedTasks.map(task => (
              <View key={task.id} style={styles.dailyTaskCard}>
                <View>
                  <Text style={styles.dailyTaskTitle}>{task.title}</Text>
                  <Text style={styles.dailyTaskTime}>{task.time}</Text>
                </View>
                <View style={[styles.categoryTagSmall, { backgroundColor: CATEGORIES.find(c => c.id === task.category)?.color + '20' }]}>
                  <Text style={[styles.categoryTextSmall, { color: CATEGORIES.find(c => c.id === task.category)?.color }]}>{task.category}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============ STATISTICS SCREEN ============
function StatisticsScreen({ tasks }) {
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  
  const weeklyTasks = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    return days.map((day, i) => {
      const dayDate = new Date(today);
      dayDate.setDate(today.getDate() - (6 - i));
      const dayStr = dayDate.toLocaleDateString();
      const count = tasks.filter(t => t.date === dayStr).length;
      const completed = tasks.filter(t => t.date === dayStr && t.completed).length;
      return { day, count, completed };
    });
  };

  const weeklyData = weeklyTasks();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.statsTitle}>Statistics</Text>
        
        <View style={styles.statsCard}>
          <View style={styles.progressRing}>
            <View style={styles.progressCircle}>
              <Text style={styles.progressPercent}>{completionRate}%</Text>
            </View>
          </View>
          <View style={styles.statsSummary}>
            <View style={styles.statsItem}>
              <Text style={styles.statsNumber}>{stats.total}</Text>
              <Text style={styles.statsLabel}>Dhammaan</Text>
            </View>
            <View style={styles.statsItem}>
              <Text style={[styles.statsNumber, { color: COLORS.success }]}>{stats.completed}</Text>
              <Text style={styles.statsLabel}>Dhammeyay</Text>
            </View>
            <View style={styles.statsItem}>
              <Text style={[styles.statsNumber, { color: COLORS.warning }]}>{stats.pending}</Text>
              <Text style={styles.statsLabel}>Hadhay</Text>
            </View>
          </View>
        </View>

        <View style={styles.streakCard}>
          <Feather name="zap" size={24} color={COLORS.warning} />
          <Text style={styles.streakNumber}>7</Text>
          <Text style={styles.streakText}>maalmood isdaba joog ah</Text>
        </View>

        <View style={styles.weeklyCard}>
          <Text style={styles.weeklyTitle}>This Week</Text>
          <View style={styles.weeklyBars}>
            {weeklyData.map((item, index) => (
              <View key={index} style={styles.weeklyBarContainer}>
                <View style={styles.weeklyBarWrapper}>
                  <View style={[styles.weeklyBarCompleted, { height: Math.max(4, (item.completed / Math.max(item.count, 1)) * 60) }]} />
                  <View style={[styles.weeklyBarTotal, { height: Math.max(4, (item.count / Math.max(weeklyData.reduce((a,b) => Math.max(a, b.count), 1), 1)) * 60) }]} />
                </View>
                <Text style={styles.weeklyDay}>{item.day}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============ PROFILE SCREEN ============
function ProfileScreen({ userEmail, signOut, tasks }) {
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
  };

  const username = userEmail?.split('@')[0] || 'User';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{username.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.profileName}>{username}</Text>
          <Text style={styles.profileEmail}>{userEmail}</Text>
        </View>

        <View style={styles.profileStats}>
          <View style={styles.profileStat}>
            <Text style={styles.profileStatNumber}>{stats.total}</Text>
            <Text style={styles.profileStatLabel}>Hawlaha</Text>
          </View>
          <View style={styles.profileStatDivider} />
          <View style={styles.profileStat}>
            <Text style={styles.profileStatNumber}>{stats.completed}</Text>
            <Text style={styles.profileStatLabel}>Dhammaystay</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <Feather name="settings" size={22} color={COLORS.text} />
            <Text style={styles.menuText}>Habeynta</Text>
            <Feather name="chevron-right" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Feather name="moon" size={22} color={COLORS.text} />
            <Text style={styles.menuText}>Mawduuca</Text>
            <Feather name="chevron-right" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Feather name="bell" size={22} color={COLORS.text} />
            <Text style={styles.menuText}>Xusuusinta</Text>
            <Feather name="chevron-right" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Feather name="info" size={22} color={COLORS.text} />
            <Text style={styles.menuText}>Ku saabsan app-ka</Text>
            <Feather name="chevron-right" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={signOut}>
            <Feather name="log-out" size={22} color={COLORS.error} />
            <Text style={[styles.menuText, { color: COLORS.error }]}>Ka bax</Text>
            <Feather name="chevron-right" size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============ MAIN APP ============
function MainApp({ signOut, tasks, setTasks, filter, setFilter, userEmail }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Calendar') iconName = 'calendar';
          else if (route.name === 'Stats') iconName = 'bar-chart-2';
          else if (route.name === 'Profile') iconName = 'user';
          return <Feather name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home">
        {props => <HomeScreen {...props} tasks={tasks} setTasks={setTasks} filter={filter} setFilter={setFilter} userEmail={userEmail} />}
      </Tab.Screen>
      <Tab.Screen name="Calendar">
        {props => <CalendarScreen {...props} tasks={tasks} />}
      </Tab.Screen>
      <Tab.Screen name="Stats">
        {props => <StatisticsScreen {...props} tasks={tasks} />}
      </Tab.Screen>
      <Tab.Screen name="Profile">
        {props => <ProfileScreen {...props} userEmail={userEmail} signOut={signOut} tasks={tasks} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// ============ ROOT APP ============
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    registerForPushNotifications();
    checkSession();
  }, []);

  useEffect(() => {
    if (isAuthenticated && userEmail) loadTasks();
  }, [isAuthenticated, userEmail]);

  useEffect(() => {
    if (isAuthenticated && userEmail) saveTasks();
  }, [tasks]);

  const registerForPushNotifications = async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }
    if (Device.isDevice) {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    }
  };

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUserEmail(session.user.email);
      setIsAuthenticated(true);
    }
    setLoading(false);
  };

  const loadTasks = async () => {
    try {
      const key = `${STORAGE_KEY}_${userEmail}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) setTasks(JSON.parse(stored));
    } catch (error) {}
  };

  const saveTasks = async () => {
    try {
      const key = `${STORAGE_KEY}_${userEmail}`;
      await AsyncStorage.setItem(key, JSON.stringify(tasks));
    } catch (error) {}
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserEmail('');
    setTasks([]);
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen onAuthSuccess={() => checkSession()} />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <MainApp 
          signOut={signOut} 
          tasks={tasks} 
          setTasks={setTasks} 
          filter={filter} 
          setFilter={setFilter} 
          userEmail={userEmail} 
        />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundDark, paddingHorizontal: 16 },
  loadingContainer: { flex: 1, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center' },
  tabBar: { backgroundColor: COLORS.white, borderTopWidth: 0, elevation: 0, height: 60, paddingBottom: 8, paddingTop: 8 },
  
  // Auth Styles
  authContainer: { flex: 1, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  authCard: { width: '100%', alignItems: 'center' },
  authLogo: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary + '10', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  authTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  authSubtitle: { fontSize: 14, color: COLORS.textLight, marginBottom: 40 },
  authInput: { width: '100%', backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 14, color: COLORS.text, marginBottom: 16, fontSize: 16 },
  authButton: { width: '100%', backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  authButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  authSwitchText: { color: COLORS.primary, marginTop: 20, fontSize: 14 },
  
  // Home Styles
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 20 },
  welcomeText: { fontSize: 14, color: COLORS.textLight },
  userName: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  notificationIcon: { padding: 8 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 16, padding: 14, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  searchText: { flex: 1, marginLeft: 12, color: COLORS.textLight, fontSize: 14 },
  categoriesScroll: { marginBottom: 20 },
  categoryTab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.white, marginRight: 10, gap: 6 },
  categoryTabActive: { backgroundColor: COLORS.primary },
  categoryTabText: { fontSize: 14, color: COLORS.textLight },
  categoryTabTextActive: { color: COLORS.white },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  sectionDate: { fontSize: 12, color: COLORS.textLight },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: COLORS.white, borderRadius: 16, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  statNumber: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },
  subsectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 12, marginTop: 8 },
  taskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  checkbox: { marginRight: 12 },
  checkboxInner: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  taskContent: { flex: 1 },
  taskHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  taskTitle: { fontSize: 15, fontWeight: '500', color: COLORS.text },
  completedText: { textDecorationLine: 'line-through', color: COLORS.textLight },
  priorityBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  priorityText: { fontSize: 10, fontWeight: '500' },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  metaText: { fontSize: 11, color: COLORS.textLight },
  categoryTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginLeft: 4 },
  categoryText: { fontSize: 10, fontWeight: '500' },
  completedTaskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 12, marginBottom: 8, gap: 12 },
  completedTaskTitle: { fontSize: 14, color: COLORS.text, textDecorationLine: 'line-through' },
  fab: { position: 'absolute', bottom: 80, right: 20, backgroundColor: COLORS.primary, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 10 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  modalLabel: { fontSize: 14, fontWeight: '500', color: COLORS.text, marginBottom: 6, marginTop: 12 },
  modalLabelSmall: { fontSize: 12, color: COLORS.textLight, marginBottom: 4 },
  modalInput: { backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 12, color: COLORS.text, fontSize: 14 },
  textArea: { height: 80, textAlignVertical: 'top' },
  modalRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  modalHalfButton: { flex: 1 },
  modalPicker: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 12 },
  modalPickerText: { color: COLORS.text, fontSize: 14 },
  priorityContainer: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  priorityOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.lightGray },
  priorityOptionText: { fontSize: 12, fontWeight: '500' },
  categoryContainer: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  categoryOption: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.lightGray },
  categoryOptionText: { fontSize: 13, color: COLORS.textLight },
  reminderRow: { marginBottom: 20 },
  reminderButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: COLORS.lightGray, alignSelf: 'flex-start' },
  reminderButtonActive: { backgroundColor: COLORS.primary + '10', borderWidth: 1, borderColor: COLORS.primary },
  reminderText: { fontSize: 13, color: COLORS.textLight },
  reminderTextActive: { color: COLORS.primary },
  minutesSelector: { flexDirection: 'row', gap: 10, marginTop: 10 },
  minuteOption: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.lightGray },
  minuteOptionActive: { backgroundColor: COLORS.primary },
  minuteText: { fontSize: 12, color: COLORS.textLight },
  minuteTextActive: { color: COLORS.white },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, marginTop: 10, marginBottom: 20 },
  saveButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  
  // Calendar Styles
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 20 },
  calendarMonth: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  weekDays: { flexDirection: 'row', marginBottom: 12 },
  weekDayText: { flex: 1, textAlign: 'center', color: COLORS.textLight, fontSize: 12, fontWeight: '500' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24 },
  calendarDay: { width: (width - 32) / 7, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 30 },
  calendarDaySelected: { backgroundColor: COLORS.primary },
  calendarDayText: { fontSize: 14, color: COLORS.text },
  calendarDayTextSelected: { color: COLORS.white, fontWeight: 'bold' },
  calendarDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.primary, position: 'absolute', bottom: 6 },
  dailyTasksContainer: { marginBottom: 20 },
  dailyTasksTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  emptyDaily: { alignItems: 'center', paddingVertical: 40 },
  emptyDailyText: { color: COLORS.textLight, marginTop: 8 },
  dailyTaskCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 12, marginBottom: 8 },
  dailyTaskTitle: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  dailyTaskTime: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  categoryTagSmall: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  categoryTextSmall: { fontSize: 10, fontWeight: '500' },
  
  // Statistics Styles
  statsTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginTop: 20, marginBottom: 20 },
  statsCard: { backgroundColor: COLORS.white, borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 16 },
  progressRing: { marginBottom: 20 },
  progressCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.primary + '15', alignItems: 'center', justifyContent: 'center' },
  progressPercent: { fontSize: 32, fontWeight: 'bold', color: COLORS.primary },
  statsSummary: { flexDirection: 'row', gap: 32 },
  statsItem: { alignItems: 'center' },
  statsNumber: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  statsLabel: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },
  streakCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.white, borderRadius: 20, padding: 16, marginBottom: 16 },
  streakNumber: { fontSize: 28, fontWeight: 'bold', color: COLORS.warning },
  streakText: { fontSize: 14, color: COLORS.textLight },
  weeklyCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 16, marginBottom: 20 },
  weeklyTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 },
  weeklyBars: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 80 },
  weeklyBarContainer: { alignItems: 'center', flex: 1 },
  weeklyBarWrapper: { height: 60, width: 30, justifyContent: 'flex-end', position: 'relative' },
  weeklyBarTotal: { width: 30, backgroundColor: COLORS.lightGray, borderRadius: 15, position: 'absolute', bottom: 0 },
  weeklyBarCompleted: { width: 30, backgroundColor: COLORS.primary, borderRadius: 15, position: 'absolute', bottom: 0 },
  weeklyDay: { fontSize: 11, color: COLORS.textLight, marginTop: 8 },
  
  // Profile Styles
  profileHeader: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
  avatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: COLORS.primary },
  profileName: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  profileEmail: { fontSize: 14, color: COLORS.textLight, marginTop: 4 },
  profileStats: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 20, padding: 20, marginBottom: 20 },
  profileStat: { flex: 1, alignItems: 'center' },
  profileStatNumber: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  profileStatLabel: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },
  profileStatDivider: { width: 1, backgroundColor: COLORS.lightGray },
  menuSection: { backgroundColor: COLORS.white, borderRadius: 20, marginBottom: 20, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  logoutItem: { borderBottomWidth: 0 },
  menuText: { flex: 1, fontSize: 15, color: COLORS.text },
});
