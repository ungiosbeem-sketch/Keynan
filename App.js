import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ScrollView,
  Switch,
  Dimensions,
  Animated,
  StatusBar,
  LinearGradient,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const Tab = createBottomTabNavigator();
const STORAGE_KEY = '@ungio_premium_tasks';

const COLORS = {
  background: '#050505',
  card: '#121212',
  pink: '#FF4FA3',
  pink2: '#FF69B4',
  pinkGlow: '#ff5eb6',
  white: '#FFFFFF',
  gray: '#8E8E93',
  dark: '#1C1C1E',
  success: '#4CAF50',
  warning: '#FFC107',
  danger: '#FF4D4D',
};

const categories = [
  { id: 'study', title: 'Study', icon: 'book-open' },
  { id: 'work', title: 'Work', icon: 'briefcase' },
  { id: 'personal', title: 'Personal', icon: 'heart' },
  { id: 'gym', title: 'Gym', icon: 'activity' },
];

function HomeScreen({ navigation, tasks, toggleComplete, deleteTask }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const completed = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

  const renderTask = ({ item }) => (
    <Animated.View style={[styles.taskCard, { opacity: fadeAnim }]}>
      <View style={styles.taskTop}>
        <TouchableOpacity onPress={() => toggleComplete(item.id)}>
          <Feather
            name={item.completed ? 'check-circle' : 'circle'}
            size={24}
            color={item.completed ? COLORS.pink : COLORS.gray}
          />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <Text style={styles.taskDescription}>{item.description}</Text>

          <View style={styles.taskBottomRow}>
            <Feather name="calendar" size={14} color={COLORS.gray} />
            <Text style={styles.taskTime}>{item.date}</Text>

            <Feather
              name="clock"
              size={14}
              color={COLORS.gray}
              style={{ marginLeft: 10 }}
            />
            <Text style={styles.taskTime}>{item.time}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => deleteTask(item.id)}>
          <Feather name="trash-2" size={20} color={COLORS.gray} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.smallText}>Welcome Back 👋</Text>
            <Text style={styles.header}>Ungio Planner</Text>
          </View>

          <Ionicons
            name="person-circle"
            size={54}
            color={COLORS.pink}
          />
        </View>

        <View style={styles.searchBox}>
          <Feather name="search" size={20} color={COLORS.gray} />

          <TextInput
            placeholder="Search your tasks..."
            placeholderTextColor={COLORS.gray}
            style={styles.searchInput}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 20 }}
        >
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{tasks.length}</Text>
            <Text style={styles.statLabel}>Tasks</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{progress}%</Text>
            <Text style={styles.statLabel}>Progress</Text>
          </View>
        </ScrollView>

        <Text style={styles.sectionTitle}>Today's Tasks</Text>

        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTask}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="clipboard-outline"
                size={80}
                color={COLORS.gray}
              />
              <Text style={styles.emptyText}>No Tasks Yet</Text>
            </View>
          }
        />
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddTask')}
      >
        <Feather name="plus" size={30} color="#000" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function AddTaskScreen({ navigation, tasks, setTasks }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [reminder, setReminder] = useState(false);

  const saveTask = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter task title');
      return;
    }

    const newTask = {
      id: Date.now().toString(),
      title,
      description,
      date: date.toLocaleDateString(),
      time: time.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      reminder,
      completed: false,
    };

    setTasks([...tasks, newTask]);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={28} color={COLORS.white} />
          </TouchableOpacity>

          <Text style={styles.header}>New Task</Text>
        </View>

        <TextInput
          placeholder="Task title"
          placeholderTextColor={COLORS.gray}
          style={styles.input}
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          placeholder="Description"
          placeholderTextColor={COLORS.gray}
          style={[styles.input, { height: 120 }]}
          multiline
          value={description}
          onChangeText={setDescription}
        />

        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowDate(true)}
        >
          <Text style={styles.inputText}>
            📅 {date.toLocaleDateString()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowTime(true)}
        >
          <Text style={styles.inputText}>
            ⏰
            {time.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </TouchableOpacity>

        {showDate && (
          <DateTimePicker
            value={date}
            mode="date"
            onChange={(e, selected) => {
              setShowDate(false);
              if (selected) setDate(selected);
            }}
          />
        )}

        {showTime && (
          <DateTimePicker
            value={time}
            mode="time"
            onChange={(e, selected) => {
              setShowTime(false);
              if (selected) setTime(selected);
            }}
          />
        )}

        <View style={styles.reminderBox}>
          <Text style={styles.reminderText}>Enable Reminder</Text>

          <Switch
            value={reminder}
            onValueChange={setReminder}
            trackColor={{ true: COLORS.pink }}
          />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={saveTask}>
          <Text style={styles.saveBtnText}>Save Task</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatsScreen({ tasks }) {
  const completed = tasks.filter(t => t.completed).length;
  const pending = tasks.filter(t => !t.completed).length;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Statistics</Text>

      <View style={styles.bigStatsCard}>
        <Text style={styles.bigStatsNumber}>{completed}</Text>
        <Text style={styles.bigStatsText}>Completed Tasks</Text>
      </View>

      <View style={styles.rowStats}>
        <View style={styles.smallStat}>
          <Text style={styles.smallStatNum}>{tasks.length}</Text>
          <Text style={styles.smallStatText}>All Tasks</Text>
        </View>

        <View style={styles.smallStat}>
          <Text style={styles.smallStatNum}>{pending}</Text>
          <Text style={styles.smallStatText}>Pending</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function ProfileScreen() {
  const [dark, setDark] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.profileBox}>
          <Ionicons
            name="person-circle"
            size={120}
            color={COLORS.pink}
          />

          <Text style={styles.profileName}>Sarah Johnson</Text>
          <Text style={styles.profileMail}>sarah@gmail.com</Text>
        </View>

        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingText}>Dark Mode</Text>
            <Switch value={dark} onValueChange={setDark} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    saveTasks();
  }, [tasks]);

  const loadTasks = async () => {
    const data = await AsyncStorage.getItem(STORAGE_KEY);

    if (data) {
      setTasks(JSON.parse(data));
    }
  };

  const saveTasks = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  };

  const toggleComplete = (id) => {
    setTasks(
      tasks.map(task =>
        task.id === id
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarShowLabel: false,
            tabBarActiveTintColor: COLORS.pink,
            tabBarInactiveTintColor: COLORS.gray,
            tabBarIcon: ({ color, size }) => {
              let icon;

              if (route.name === 'Home') icon = 'home';
              if (route.name === 'Stats') icon = 'bar-chart-2';
              if (route.name === 'Profile') icon = 'user';

              return (
                <Feather
                  name={icon}
                  size={size}
                  color={color}
                />
              );
            },
          })}
        >
          <Tab.Screen name="Home">
            {(props) => (
              <HomeScreen
                {...props}
                tasks={tasks}
                toggleComplete={toggleComplete}
                deleteTask={deleteTask}
              />
            )}
          </Tab.Screen>

          <Tab.Screen name="Stats">
            {(props) => <StatsScreen {...props} tasks={tasks} />}
          </Tab.Screen>

          <Tab.Screen name="Profile">
            {(props) => <ProfileScreen {...props} />}
          </Tab.Screen>

          <Tab.Screen
            name="AddTask"
            options={{ tabBarButton: () => null }}
          >
            {(props) => (
              <AddTaskScreen
                {...props}
                tasks={tasks}
                setTasks={setTasks}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },

  smallText: {
    color: COLORS.gray,
    fontSize: 15,
  },

  header: {
    color: COLORS.white,
    fontSize: 30,
    fontWeight: 'bold',
  },

  searchBox: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 20,
  },

  searchInput: {
    flex: 1,
    color: COLORS.white,
    padding: 14,
  },

  statCard: {
    backgroundColor: COLORS.card,
    width: 120,
    borderRadius: 24,
    padding: 20,
    marginRight: 12,
  },

  statNumber: {
    color: COLORS.pink,
    fontSize: 28,
    fontWeight: 'bold',
  },

  statLabel: {
    color: COLORS.gray,
    marginTop: 6,
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  taskCard: {
    backgroundColor: COLORS.card,
    padding: 18,
    borderRadius: 24,
    marginBottom: 14,
  },

  taskTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  taskTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },

  taskDescription: {
    color: COLORS.gray,
    marginTop: 6,
    lineHeight: 20,
  },

  taskBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },

  taskTime: {
    color: COLORS.gray,
    marginLeft: 5,
  },

  fab: {
    position: 'absolute',
    bottom: 90,
    right: 25,
    backgroundColor: COLORS.pink,
    width: 65,
    height: 65,
    borderRadius: 33,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.pinkGlow,
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },

  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },

  emptyText: {
    color: COLORS.gray,
    marginTop: 15,
    fontSize: 18,
  },

  input: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
    color: COLORS.white,
    marginBottom: 16,
  },

  inputText: {
    color: COLORS.white,
  },

  reminderBox: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  reminderText: {
    color: COLORS.white,
    fontSize: 16,
  },

  saveBtn: {
    backgroundColor: COLORS.pink,
    padding: 18,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 40,
  },

  saveBtnText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },

  tabBar: {
    backgroundColor: COLORS.card,
    borderTopWidth: 0,
    height: 70,
  },

  bigStatsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 30,
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
  },

  bigStatsNumber: {
    color: COLORS.pink,
    fontSize: 50,
    fontWeight: 'bold',
  },

  bigStatsText: {
    color: COLORS.gray,
    marginTop: 10,
  },

  rowStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  smallStat: {
    backgroundColor: COLORS.card,
    width: '48%',
    borderRadius: 24,
    padding: 25,
    alignItems: 'center',
  },

  smallStatNum: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: 'bold',
  },

  smallStatText: {
    color: COLORS.gray,
    marginTop: 5,
  },

  profileBox: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },

  profileName: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 15,
  },

  profileMail: {
    color: COLORS.gray,
    marginTop: 5,
  },

  settingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
  },

  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  settingText: {
    color: COLORS.white,
    fontSize: 16,
  },
});
