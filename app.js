import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TextInput, 
  TouchableOpacity, Switch, FlatList, Alert 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [notes, setNotes] = useState("");
  const [theme, setTheme] = useState("light");
  const [taskInput, setTaskInput] = useState("");
  const [goalInput, setGoalInput] = useState("");

  // 1. Loading Data (Marka app-ka la furo)
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedTasks = await AsyncStorage.getItem("tasks");
      const savedGoals = await AsyncStorage.getItem("goals");
      const savedNotes = await AsyncStorage.getItem("notes");
      const savedTheme = await AsyncStorage.getItem("theme");

      if (savedTasks) setTasks(JSON.parse(savedTasks));
      if (savedGoals) setGoals(JSON.parse(savedGoals));
      if (savedNotes) setNotes(savedNotes);
      if (savedTheme) setTheme(savedTheme);
    } catch (e) { console.error("Error loading data", e); }
  };

  // 2. Saving Data
  const saveData = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    } catch (e) { console.error("Error saving data", e); }
  };

  // 3. Handlers
  const addTask = () => {
    if (!taskInput) return;
    const newTask = {
      id: Math.random().toString(),
      title: taskInput,
      done: false,
      day: days[Math.floor(Math.random() * days.length)],
      category: "General"
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    saveData("tasks", updatedTasks);
    setTaskInput("");
  };

  const addGoal = () => {
    if (!goalInput) return;
    const updatedGoals = [...goals, { id: Math.random().toString(), title: goalInput }];
    setGoals(updatedGoals);
    saveData("goals", updatedGoals);
    setGoalInput("");
  };

  const toggleTask = (id) => {
    const updated = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setTasks(updated);
    saveData("tasks", updated);
  };

  const isDarkMode = theme === "dark";

  return (
    <ScrollView style={[styles.container, isDarkMode ? styles.darkBg : styles.lightBg]}>
      {/* HEADER & THEME TOGGLE */}
      <View style={styles.header}>
        <Text style={[styles.mainTitle, isDarkMode ? styles.textWhite : styles.textBlack]}>Keynan Productivity</Text>
        <Switch 
          value={isDarkMode} 
          onValueChange={() => {
            const newTheme = isDarkMode ? "light" : "dark";
            setTheme(newTheme);
            saveData("theme", newTheme);
          }} 
        />
      </View>

      {/* ANALYTICS CARD */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Analytics</Text>
        <Text>{tasks.filter(t => t.done).length} / {tasks.length} tasks completed</Text>
      </View>

      {/* CALENDAR (Simple Grid) */}
      <Text style={[styles.sectionTitle, isDarkMode ? styles.textWhite : styles.textBlack]}>Calendar</Text>
      <View style={styles.calendarGrid}>
        {[...Array(31)].map((_, i) => (
          <View key={i} style={styles.calendarCell}><Text style={styles.cellText}>{i + 1}</Text></View>
        ))}
      </View>

      {/* WEEK BOARD */}
      <Text style={[styles.sectionTitle, isDarkMode ? styles.textWhite : styles.textBlack]}>Week Board</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {days.map(day => (
          <View key={day} style={styles.dayCol}>
            <Text style={styles.dayHeader}>{day}</Text>
            {tasks.filter(t => t.day === day).map(t => (
              <View key={t.id} style={styles.miniTask}><Text size={10}>{t.title}</Text></View>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* TASK INPUT */}
      <View style={styles.inputSection}>
        <TextInput 
          style={[styles.input, isDarkMode && styles.inputDark]} 
          placeholder="Enter new task..."
          placeholderTextColor={isDarkMode ? "#ccc" : "#999"}
          value={taskInput}
          onChangeText={setTaskInput}
        />
        <TouchableOpacity style={styles.btn} onPress={addTask}><Text style={styles.btnText}>Add Task</Text></TouchableOpacity>
      </View>

      {/* GOALS SECTION */}
      <Text style={[styles.sectionTitle, isDarkMode ? styles.textWhite : styles.textBlack]}>Long-term Goals</Text>
      {goals.map(g => (
        <View key={g.id} style={styles.listItem}><Text>• {g.title}</Text></View>
      ))}
      <TextInput 
        style={[styles.input, isDarkMode && styles.inputDark]} 
        placeholder="New Goal..."
        value={goalInput}
        onChangeText={setGoalInput}
        onSubmitEditing={addGoal}
      />

      {/* NOTES SECTION */}
      <Text style={[styles.sectionTitle, isDarkMode ? styles.textWhite : styles.textBlack]}>Daily Notes</Text>
      <TextInput 
        multiline
        numberOfLines={4}
        style={[styles.notesArea, isDarkMode && styles.inputDark]}
        value={notes}
        onChangeText={(text) => { setNotes(text); saveData("notes", text); }}
      />
      
      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50 },
  darkBg: { backgroundColor: '#1a1a1a' },
  lightBg: { backgroundColor: '#f5f5f5' },
  textWhite: { color: '#fff' },
  textBlack: { color: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  mainTitle: { fontSize: 22, fontWeight: 'bold' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, elevation: 3, marginBottom: 20 },
  cardTitle: { fontWeight: 'bold', marginBottom: 5 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  calendarCell: { width: 40, height: 40, backgroundColor: '#ddd', margin: 2, justifyContent: 'center', alignItems: 'center', borderRadius: 5 },
  cellText: { fontSize: 12 },
  dayCol: { width: 100, backgroundColor: '#e0e0e0', marginRight: 10, borderRadius: 8, padding: 5, minHeight: 100 },
  dayHeader: { fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  miniTask: { backgroundColor: '#fff', padding: 4, borderRadius: 4, marginBottom: 4 },
  inputSection: { marginTop: 20 },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginBottom: 10 },
  inputDark: { backgroundColor: '#333', color: '#fff', borderColor: '#444' },
  btn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  listItem: { padding: 10, backgroundColor: '#fff', marginBottom: 5, borderRadius: 5 },
  notesArea: { backgroundColor: '#fff', padding: 15, borderRadius: 8, textAlignVertical: 'top', minHeight: 100 }
});
    
