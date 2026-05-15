import React, { useState, useEffect } from 'react';
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
  Modal,
  ScrollView,
  Switch,
  Dimensions,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const Tab = createBottomTabNavigator();
const STORAGE_KEY = '@keynan_premium_tasks';

const COLORS = {
  background: '#000000',
  backgroundCard: 'rgba(18, 18, 18, 0.8)',
  pink: '#FF4FA3',
  pinkLight: '#FF69B4',
  pinkGlow: '#FF4FA3',
  pinkDark: '#E91E63',
  white: '#FFFFFF',
  gray: '#888888',
  darkGray: '#1A1A1A',
  success: '#4CAF50',
  warning: '#FFC107',
  danger: '#FF4444',
  high: '#FF4444',
  medium: '#FFC107',
  low: '#4CAF50',
};

// Sample data
const CATEGORIES = [
  { id: 'study', name: 'Study', icon: 'book', color: '#FF4FA3' },
  { id: 'work', name: 'Work', icon: 'briefcase', color: '#FF69B4' },
  { id: 'personal', name: 'Personal', icon: 'heart', color: '#FF4FA3' },
  { id: 'fitness', name: 'Fitness', icon: 'activity', color: '#FF69B4' },
];

const PRIORITIES = [
  { id: 'high', name: 'High', color: '#FF4444', icon: 'alert-circle' },
  { id: 'medium', name: 'Medium', color: '#FFC107', icon: 'minus-circle' },
  { id: 'low', name: 'Low', color: '#4CAF50', icon: 'checkmark-circle' },
];

// Home Screen
function HomeScreen({ navigation, tasks, setTasks, filter, setFilter, toggleComplete, deleteTask }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [greeting] = useState(getGreeting());
  const username = "Sarah";

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'pending') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  }).filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
    progress: tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0,
  };

  const renderTaskCard = ({ item }) => (
    <Animated.View style={styles.taskCard}>
      <View style={styles.taskCardHeader}>
        <TouchableOpacity onPress={() => toggleComplete(item.id)} style={styles.checkbox}>
          <Feather 
            name={item.completed ? 'check-circle' : 'circle'} 
            size={24} 
            color={item.completed ? COLORS.pink : COLORS.gray} 
          />
        </TouchableOpacity>
        <View style={styles.taskBadges}>
          <View style={[styles.priorityBadge, { backgroundColor: PRIORITIES.find(p => p.id === item.priority)?.color + '20' }]}>
            <Feather name={PRIORITIES.find(p => p.id === item.priority)?.icon} size={12} color={PRIORITIES.find(p => p.id === item.priority)?.color} />
            <Text style={[styles.priorityText, { color: PRIORITIES.find(p => p.id === item.priority)?.color }]}>
              {PRIORITIES.find(p => p.id === item.priority)?.name}
            </Text>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: COLORS.pink + '20' }]}>
            <Feather name={CATEGORIES.find(c => c.id === item.category)?.icon} size={12} color={COLORS.pink} />
            <Text style={[styles.categoryText, { color: COLORS.pink }]}>
              {CATEGORIES.find(c => c.id === item.category)?.name}
            </Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.taskTitle}>{item.title}</Text>
      {item.description ? <Text style={styles.taskDescription}>{item.description}</Text> : null}
      
      <View style={styles.taskFooter}>
        <View style={styles.dateTimeContainer}>
          <Feather name="calendar" size={14} color={COLORS.gray} />
          <Text style={styles.dateText}>{item.date}</Text>
          <Feather name="clock" size={14} color={COLORS.gray} style={{ marginLeft: 12 }} />
          <Text style={styles.dateText}>{item.time}</Text>
        </View>
        <TouchableOpacity onPress={() => deleteTask(item.id)}>
          <Feather name="trash-2" size={20} color={COLORS.gray} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.screenContainer}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <View style={styles.greetingContainer}>
          <View>
            <Text style={styles.greetingText}>{greeting},</Text>
            <Text style={styles.usernameText}>{username} ✨</Text>
          </View>
          <TouchableOpacity style={styles.profileIcon}>
            <Ionicons name="person-circle-outline" size={48} color={COLORS.pink} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color={COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            placeholderTextColor={COLORS.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Stats Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
            <Feather name="list" size={24} color={COLORS.pink} style={styles.statIcon} />
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
            <Feather name="check-circle" size={24} color={COLORS.success} style={styles.statIcon} />
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
            <Feather name="clock" size={24} color={COLORS.warning} style={styles.statIcon} />
          </View>
          <View style={styles.statCard}>
            <View style={styles.progressCircle}>
              <Text style={styles.statValue}>{Math.round(stats.progress)}%</Text>
            </View>
            <Text style={styles.statLabel}>Progress</Text>
          </View>
        </ScrollView>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {['all', 'pending', 'completed'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.filterTab, filter === tab && styles.filterTabActive]}
              onPress={() => setFilter(tab)}
            >
              <Text style={[styles.filterTabText, filter === tab && styles.filterTabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="clipboard" size={64} color={COLORS.gray} />
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubText}>Tap + to create your first task</Text>
          </View>
        ) : (
          <FlatList
            data={filteredTasks}
            keyExtractor={(item) => item.id}
            renderItem={renderTaskCard}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddTask')}>
        <Feather name="plus" size={28} color="#000" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// Add Task Screen
function AddTaskScreen({ navigation, tasks, setTasks }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('personal');
  const [reminder, setReminder] = useState(false);

  const saveTask = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    const newTask = {
      id: Date.now().toString(),
      title,
      description,
      date: date.toLocaleDateString(),
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      priority,
      category,
      reminder,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    setTasks([...tasks, newTask]);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.addTaskHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={28} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.addTaskTitle}>New Task</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Task Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter task title..."
            placeholderTextColor={COLORS.gray}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter description..."
            placeholderTextColor={COLORS.gray}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <View style={styles.rowInputs}>
          <TouchableOpacity style={[styles.inputGroup, { flex: 1 }]} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.inputLabel}>Date</Text>
            <View style={styles.datePickerButton}>
              <Feather name="calendar" size={20} color={COLORS.pink} />
              <Text style={styles.datePickerText}>{date.toLocaleDateString()}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.inputGroup, { flex: 1 }]} onPress={() => setShowTimePicker(true)}>
            <Text style={styles.inputLabel}>Time</Text>
            <View style={styles.datePickerButton}>
              <Feather name="clock" size={20} color={COLORS.pink} />
              <Text style={styles.datePickerText}>
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={time}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) setTime(selectedTime);
            }}
          />
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Priority</Text>
          <View style={styles.priorityContainer}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.priorityOption, priority === p.id && { borderColor: p.color, backgroundColor: p.color + '20' }]}
                onPress={() => setPriority(p.id)}
              >
                <Feather name={p.icon} size={16} color={p.color} />
                <Text style={[styles.priorityOptionText, { color: p.color }]}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryOption, category === cat.id && { borderColor: COLORS.pink, backgroundColor: COLORS.pink + '20' }]}
                onPress={() => setCategory(cat.id)}
              >
                <Feather name={cat.icon} size={20} color={category === cat.id ? COLORS.pink : COLORS.gray} />
                <Text style={[styles.categoryOptionText, category === cat.id && { color: COLORS.pink }]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.reminderContainer}>
          <View style={styles.reminderLeft}>
            <Feather name="bell" size={20} color={COLORS.pink} />
            <Text style={styles.reminderText}>Set Reminder</Text>
          </View>
          <Switch value={reminder} onValueChange={setReminder} trackColor={{ false: COLORS.darkGray, true: COLORS.pink }} thumbColor={COLORS.white} />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={saveTask}>
          <Text style={styles.saveButtonText}>Save Task</Text>
          <Feather name="check" size={20} color="#000" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Calendar Screen
function CalendarScreen({ tasks }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
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
      const taskDate = new Date(task.date);
      return isSameDay(taskDate, date);
    });
  };

  const days = getDaysInMonth(currentMonth);
  const selectedDateTasks = getTasksForDate(selectedDate);

  return (
    <SafeAreaView style={styles.screenContainer}>
      <ScrollView>
        <Text style={styles.screenTitle}>Calendar</Text>
        
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
            <Feather name="chevron-left" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
            <Feather name="chevron-right" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekDays}>
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
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
              onPress={() => day && setSelectedDate(day)}
              disabled={!day}
            >
              {day && (
                <>
                  <Text style={[
                    styles.calendarDayText,
                    isSameDay(day, selectedDate) && styles.calendarDayTextSelected,
                  ]}>
                    {day.getDate()}
                  </Text>
                  {getTasksForDate(day).length > 0 && (
                    <View style={styles.taskDot} />
                  )}
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.dailyTasksContainer}>
          <Text style={styles.dailyTasksTitle}>
            Tasks for {selectedDate.toLocaleDateString()}
          </Text>
          {selectedDateTasks.length === 0 ? (
            <View style={styles.emptyDailyTasks}>
              <Feather name="calendar" size={48} color={COLORS.gray} />
              <Text style={styles.emptyDailyText}>No tasks for this day</Text>
            </View>
          ) : (
            selectedDateTasks.map(task => (
              <View key={task.id} style={styles.dailyTaskCard}>
                <View>
                  <Text style={styles.dailyTaskTitle}>{task.title}</Text>
                  <Text style={styles.dailyTaskTime}>{task.time}</Text>
                </View>
                <View style={[styles.priorityBadge, { backgroundColor: PRIORITIES.find(p => p.id === task.priority)?.color + '20' }]}>
                  <Text style={[styles.priorityText, { color: PRIORITIES.find(p => p.id === task.priority)?.color }]}>
                    {PRIORITIES.find(p => p.id === task.priority)?.name}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Statistics Screen
function StatisticsScreen({ tasks }) {
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
    progress: tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0,
  };

  const priorityStats = {
    high: tasks.filter(t => t.priority === 'high').length,
    medium: tasks.filter(t => t.priority === 'medium').length,
    low: tasks.filter(t => t.priority === 'low').length,
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      <ScrollView>
        <Text style={styles.screenTitle}>Statistics</Text>

        <View style={styles.statsMainCard}>
          <View style={styles.progressCircleLarge}>
            <Animated.View style={[styles.progressCircleInner, { width: stats.progress * 2.8 }]}>
              <Text style={styles.progressPercent}>{Math.round(stats.progress)}%</Text>
            </Animated.View>
          </View>
          <Text style={styles.progressLabel}>Overall Progress</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statGridCard}>
            <Feather name="list" size={32} color={COLORS.pink} />
            <Text style={styles.statGridValue}>{stats.total}</Text>
            <Text style={styles.statGridLabel}>Total Tasks</Text>
          </View>
          <View style={styles.statGridCard}>
            <Feather name="check-circle" size={32} color={COLORS.success} />
            <Text style={styles.statGridValue}>{stats.completed}</Text>
            <Text style={styles.statGridLabel}>Completed</Text>
          </View>
          <View style={styles.statGridCard}>
            <Feather name="clock" size={32} color={COLORS.warning} />
            <Text style={styles.statGridValue}>{stats.pending}</Text>
            <Text style={styles.statGridLabel}>Pending</Text>
          </View>
        </View>

        <View style={styles.prioritySection}>
          <Text style={styles.sectionTitle}>Priority Distribution</Text>
          <View style={styles.priorityBar}>
            <View style={[styles.priorityBarSegment, { width: (priorityStats.high / stats.total) * 100 || 0, backgroundColor: COLORS.high }]} />
            <View style={[styles.priorityBarSegment, { width: (priorityStats.medium / stats.total) * 100 || 0, backgroundColor: COLORS.medium }]} />
            <View style={[styles.priorityBarSegment, { width: (priorityStats.low / stats.total) * 100 || 0, backgroundColor: COLORS.low }]} />
          </View>
          <View style={styles.priorityLegend}>
            <View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: COLORS.high }]} /><Text style={styles.legendText}>High ({priorityStats.high})</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: COLORS.medium }]} /><Text style={styles.legendText}>Medium ({priorityStats.medium})</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: COLORS.low }]} /><Text style={styles.legendText}>Low ({priorityStats.low})</Text></View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Profile Screen
function ProfileScreen({ darkMode, setDarkMode }) {
  return (
    <SafeAreaView style={styles.screenContainer}>
      <ScrollView>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={100} color={COLORS.pink} />
          </View>
          <Text style={styles.profileName}>Sarah Johnson</Text>
          <Text style={styles.profileEmail}>sarah@keynan.app</Text>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.settingsTitle}>Preferences</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Feather name="moon" size={24} color={COLORS.pink} />
              <Text style={styles.settingText}>Dark Mode</Text>
            </View>
            <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ false: COLORS.darkGray, true: COLORS.pink }} thumbColor={COLORS.white} />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Feather name="bell" size={24} color={COLORS.pink} />
              <Text style={styles.settingText}>Notifications</Text>
            </View>
            <Switch value={true} onValueChange={() => {}} trackColor={{ false: COLORS.darkGray, true: COLORS.pink }} thumbColor={COLORS.white} />
          </View>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Feather name="log-out" size={24} color={COLORS.danger} />
              <Text style={[styles.settingText, { color: COLORS.danger }]}>Logout</Text>
            </View>
            <Feather name="chevron-right" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Keynan App v2.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Main App Component
export default function App() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setTasks(JSON.parse(stored));
    } catch (error) {
      console.log('Error loading tasks');
    }
  };

  useEffect(() => {
    saveTasks();
  }, [tasks]);

  const saveTasks = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.log('Error saving tasks');
    }
  };

  const toggleComplete = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setTasks(tasks.filter(t => t.id !== id)) },
    ]);
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === 'Home') iconName = 'home';
              else if (route.name === 'AddTask') iconName = 'plus-circle';
              else if (route.name === 'Calendar') iconName = 'calendar';
              else if (route.name === 'Stats') iconName = 'bar-chart-2';
              else if (route.name === 'Profile') iconName = 'user';
              
              return <Feather name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: COLORS.pink,
            tabBarInactiveTintColor: COLORS.gray,
            tabBarStyle: styles.tabBar,
            tabBarShowLabel: false,
            headerShown: false,
          })}
        >
          <Tab.Screen name="Home">
            {props => <HomeScreen {...props} tasks={tasks} setTasks={setTasks} filter={filter} setFilter={setFilter} toggleComplete={toggleComplete} deleteTask={deleteTask} />}
          </Tab.Screen>
          <Tab.Screen name="Calendar">
            {props => <CalendarScreen {...props} tasks={tasks} />}
          </Tab.Screen>
          <Tab.Screen name="Stats">
            {props => <StatisticsScreen {...props} tasks={tasks} />}
          </Tab.Screen>
          <Tab.Screen name="Profile">
            {props => <ProfileScreen {...props} darkMode={darkMode} setDarkMode={setDarkMode} />}
          </Tab.Screen>
          <Tab.Screen name="AddTask" options={{ tabBarButton: () => null }}>
            {props => <AddTaskScreen {...props} tasks={tasks} setTasks={setTasks} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// Styles
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
  },
  tabBar: {
    backgroundColor: COLORS.darkGray,
    borderTopWidth: 0,
    elevation: 0,
    height: 60,
    paddingBottom: 10,
    paddingTop: 10,
  },
  greetingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 16,
    color: COLORS.gray,
    fontFamily: 'System',
  },
  usernameText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 4,
  },
  profileIcon: {
    opacity: 0.9,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkGray,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    color: COLORS.white,
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: COLORS.darkGray,
    borderRadius: 20,
    padding: 16,
    marginRight: 12,
    minWidth: 110,
    position: 'relative',
    overflow: 'hidden',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  statIcon: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    opacity: 0.3,
  },
  progressCircle: {
    alignItems: 'center',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.darkGray,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: COLORS.pink,
  },
  filterTabText: {
    color: COLORS.gray,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#000',
  },
  taskCard: {
    backgroundColor: COLORS.darkGray,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  taskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    marginRight: 12,
  },
  taskBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 6,
  },
  taskDescription: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 12,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: COLORS.pink,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: COLORS.pink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.white,
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8,
  },
  addTaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  addTaskTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.darkGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COLORS.white,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  datePickerButton: {
    backgroundColor: COLORS.darkGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  datePickerText: {
    color: COLORS.white,
    fontSize: 16,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.darkGray,
  },
  priorityOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.darkGray,
    marginRight: 8,
  },
  categoryOptionText: {
    color: COLORS.gray,
    fontSize: 14,
  },
  reminderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.darkGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
  },
  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reminderText: {
    color: COLORS.white,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: COLORS.pink,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 20,
    marginBottom: 24,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.gray,
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  calendarDay: {
    width: width / 7 - 8,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 30,
  },
  calendarDaySelected: {
    backgroundColor: COLORS.pink,
  },
  calendarDayText: {
    color: COLORS.white,
    fontSize: 16,
  },
  calendarDayTextSelected: {
    color: '#000',
    fontWeight: 'bold',
  },
  taskDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.pink,
    position: 'absolute',
    bottom: 6,
  },
  dailyTasksContainer: {
    marginTop: 20,
  },
  dailyTasksTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 16,
  },
  emptyDailyTasks: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyDailyText: {
    color: COLORS.gray,
    marginTop: 12,
  },
  dailyTaskCard: {
    backgroundColor: COLORS.darkGray,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dailyTaskTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
  },
  dailyTaskTime: {
    color: COLORS.gray,
    fontSize: 12,
    marginTop: 4,
  },
  statsMainCard: {
    backgroundColor: COLORS.darkGray,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  progressCircleLarge: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: COLORS.pink + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressCircleInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.pink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  progressLabel: {
    fontSize: 16,
    color: COLORS.gray,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statGridCard: {
    flex: 1,
    backgroundColor: COLORS.darkGray,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
  },
  statGridValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 8,
  },
  statGridLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  prioritySection: {
    backgroundColor: COLORS.darkGray,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 16,
  },
  priorityBar: {
    height: 8,
    flexDirection: 'row',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  priorityBarSegment: {
    height: '100%',
  },
  priorityLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.gray,
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.darkGray,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    color: COLORS.white,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  versionText: {
    color: COLORS.gray,
    fontSize: 12,
  },
});
