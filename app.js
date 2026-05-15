import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TextInput, 
  TouchableOpacity, SafeAreaView, Switch, FlatList, Dimensions 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function App() {
  // --- STATE MANAGEMENT ---
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [notes, setNotes] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [goalTitle, setGoalTitle] = useState("");

  // --- DATA PERSISTENCE (AsyncStorage) ---
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const t = await AsyncStorage.getItem('tasks');
      const g = await AsyncStorage.getItem('goals');
      const n = await AsyncStorage.getItem('notes');
      const theme = await AsyncStorage.getItem('theme');

      if (t) setTasks(JSON.parse(t));
      if (g) setGoals(JSON.parse(g));
      if (n) setNotes(n);
      if (theme) setIsDarkMode(theme === 'dark');
    } catch (e) { console.error(e); }
  };

  const saveData = async (key, val) => {
    try {
      const valueToStore = typeof val === 'string' ? val : JSON.stringify(val);
      await AsyncStorage.setItem(key, valueToStore);
    } catch (e) { console.error(e); }
  };

  // --- LOGIC FUNCTIONS ---
  const addTask = () => {
    if (!taskTitle) return;
    const newTask = {
      id: Date.now().toString(),
      title: taskTitle,
      done: false,
      day: days[Math.floor(Math.random() * days.length)],
    };
    const newTasks = [...tasks, newTask];
    setTasks(newTasks);
    saveData('tasks', newTasks);
    setTaskTitle("");
  };

  const addGoal = () => {
    if (!goalTitle) return;
    const newGoals = [...goals, { id: Date.now().toString(), title: goalTitle }];
    setGoals(newGoals);
    saveData('goals', newGoals);
    setGoalTitle("");
  };

  const toggleTask = (id) => {
    const updated = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setTasks(updated);
    saveData('tasks', updated);
  };

  const completedCount = tasks.filter(t => t.done).length;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  // --- UI RENDER ---
  const themeStyles = isDarkMode ? darkTheme : lightTheme;

  return (
    <SafeAreaView style={[styles.safeArea, themeStyles.bg]}>
      <ScrollView stickyHeaderIndices={[0]} showsVerticalScrollIndicator={false}>
        
        {/* 1. TOPBAR */}
        <View style={[styles.topbar, themeStyles.card]}>
          <View style={styles.brand}>
            <View style={styles.brandDot} />
            <Text style={[styles.brandText, themeStyles.text]}>keynan</Text>
          </View>
          <Switch 
            value={isDarkMode} 
            onValueChange={(val) => {
              setIsDarkMode(val);
              saveData('theme', val ? 'dark' : 'light');
            }} 
          />
        </View>

        <View style={styles.content}>
          {/* 2. HERO / ANALYTICS */}
          <View style={[styles.heroCard, themeStyles.card]}>
            <Text style={styles.eyebrow}>Today</Text>
            <Text style={[styles.h2, themeStyles.text]}>Design your best day.</Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}><Text style={[styles.statNum, themeStyles.text]}>{completedCount}</Text><Text style={styles.statLabel}>Done</Text></View>
              <View style={styles.stat}><Text style={[styles.statNum, themeStyles.text]}>3</Text><Text style={styles.statLabel}>Streak</Text></View>
              <View style={styles.stat}><Text style={[styles.statNum, themeStyles.text]}>{progress}%</Text><Text style={styles.statLabel}>Progress</Text></View>
            </View>
          </View>

          {/* 3. DAILY TASKS */}
          <View style={[styles.sectionCard, themeStyles.card]}>
            <Text style={[styles.h3, themeStyles.text]}>Daily Tasks</Text>
            <View style={styles.inputRow}>
              <TextInput 
                style={[styles.input, themeStyles.text]} 
                placeholder="New task..." 
                placeholderTextColor="#999"
                value={taskTitle}
                onChangeText={setTaskTitle}
              />
              <TouchableOpacity style={styles.addBtn} onPress={addTask}>
                <Text style={{color:'#fff', fontWeight:'bold'}}>Add</Text>
              </TouchableOpacity>
            </View>
            {tasks.map(t => (
              <TouchableOpacity key={t.id} style={styles.taskItem} onPress={() => toggleTask(t.id)}>
                <View style={[styles.checkbox, t.done && styles.checked]} />
                <Text style={[themeStyles.text, t.done && styles.strike]}>{t.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 4. WEEKLY BOARD (Horizontal Scroll) */}
          <Text style={[styles.sectionTitle, themeStyles.text]}>Weekly Planning</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 20}}>
            {days.map(day => (
              <View key={day} style={[styles.dayColumn, themeStyles.card]}>
                <Text style={[styles.dayName, themeStyles.text]}>{day}</Text>
                {tasks.filter(t => t.day === day).map(t => (
                  <View key={t.id} style={styles.miniTask}><Text style={{fontSize:11}} numberOfLines={1}>{t.title}</Text></View>
                ))}
              </View>
            ))}
          </ScrollView>

          {/* 5. CALENDAR GRID */}
          <View style={[styles.sectionCard, themeStyles.card]}>
            <Text style={[styles.h3, themeStyles.text]}>Calendar</Text>
            <View style={styles.calendar}>
              {[...Array(31)].map((_, i) => (
                <View key={i} style={styles.calCell}><Text style={{fontSize:10}}>{i+1}</Text></View>
              ))}
            </View>
          </View>

          {/* 6. GOALS & NOTES */}
          <View style={styles.grid2}>
            <View style={[styles.sectionCard, themeStyles.card, {flex:1}]}>
              <Text style={[styles.h3, themeStyles.text]}>Goals</Text>
              <TextInput 
                style={[styles.input, themeStyles.text]} 
                placeholder="Add Goal" 
                value={goalTitle}
                onChangeText={setGoalTitle}
                onSubmitEditing={addGoal}
              />
              {goals.map(g => <Text key={g.id} style={[themeStyles.text, {marginTop:5}]}>• {g.title}</Text>)}
            </View>
            
            <View style={[styles.sectionCard, themeStyles.card, {flex:1, marginLeft:10}]}>
              <Text style={[styles.h3, themeStyles.text]}>Notes</Text>
              <TextInput 
                multiline 
                style={[styles.notesInput, themeStyles.text]} 
                placeholder="Ideas..." 
                value={notes}
                onChangeText={(txt) => { setNotes(txt); saveData('notes', txt); }}
              />
            </View>
          </View>

        </View>
        <View style={{height: 100}} />
      </ScrollView>
    </SafeAreaView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', borderBottomWidth: 0.5, borderColor: '#eee' },
  brand: { flexDirection: 'row', alignItems: 'center' },
  brandDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#007AFF', marginRight: 6 },
  brandText: { fontSize: 18, fontWeight: '800' },
  content: { padding: 15 },
  heroCard: { padding: 20, borderRadius: 15, marginBottom: 15 },
  eyebrow: { color: '#007AFF', fontWeight: 'bold', fontSize: 12, marginBottom: 5 },
  h2: { fontSize: 24, fontWeight: '800', marginBottom: 15 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { fontSize: 10, color: '#888', marginTop: 2 },
  sectionCard: { padding: 15, borderRadius: 12, marginBottom: 15 },
  h3: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  inputRow: { flexDirection: 'row', marginBottom: 15 },
  input: { flex: 1, borderBottomWidth: 1, borderColor: '#ddd', padding: 8 },
  addBtn: { backgroundColor: '#000', padding: 10, borderRadius: 8, marginLeft: 10 },
  taskItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: '#007AFF', marginRight: 10 },
  checked: { backgroundColor: '#007AFF' },
  strike: { textDecorationLine: 'line-through', color: '#aaa' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  dayColumn: { width: 100, padding: 10, borderRadius: 10, marginRight: 10, minHeight: 120 },
  dayName: { fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  miniTask: { backgroundColor: '#f0f0f0', padding: 4, borderRadius: 4, marginBottom: 4 },
  calendar: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  calCell: { width: 30, height: 30, backgroundColor: '#eee', margin: 2, alignItems: 'center', justifyContent: 'center', borderRadius: 4 },
  grid2: { flexDirection: 'row' },
  notesInput: { fontSize: 12, textAlignVertical: 'top', minHeight: 60 }
});

const lightTheme = {
  bg: { backgroundColor: '#f9f9f9' },
  card: { backgroundColor: '#ffffff' },
  text: { color: '#000000' }
};

const darkTheme = {
  bg: { backgroundColor: '#121212' },
  card: { backgroundColor: '#1e1e1e' },
  text: { color: '#ffffff' }
};
                              
