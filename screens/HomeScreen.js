// screens/HomeScreen.js
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ScrollView, Alert, SafeAreaView, ActivityIndicator, Animated } from 'react-native';
import { Feather, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { RoutineContext } from '../contexts/RoutineContext';
import { SchoolContext } from '../contexts/SchoolContext';
import { ReadingContext } from '../contexts/ReadingContext';
import { COLORS, LIGHT_COLORS, categories } from '../utils/colors';
import { getTasks, updateTask, deleteTask } from '../supabase';

export default function HomeScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { routine, routineProgress } = useContext(RoutineContext);
  const { homework } = useContext(SchoolContext);
  const { readingList, pdfBooks } = useContext(ReadingContext);
  const { user } = useContext(AuthContext);
  const { darkMode } = useContext(ThemeContext);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => { if (user) loadTasks(); }, [user]);
  useEffect(() => { Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start(); }, []);

  const loadTasks = async () => {
    const result = await getTasks(user.id);
    if (result.success) setTasks(result.tasks);
    setLoading(false);
  };

  const toggleComplete = async (id, currentStatus) => {
    const result = await updateTask(id, { completed: !currentStatus });
    if (result.success) {
      setTasks(tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
    } else {
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const deleteTaskItem = async (id) => {
    Alert.alert('Delete', 'Remove this task?', [
      { text: 'Cancel' },
      { text: 'Delete', onPress: async () => {
        const result = await deleteTask(id);
        if (result.success) setTasks(tasks.filter(task => task.id !== id));
      }}
    ]);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const completed = filteredTasks.filter(t => t.completed).length;
  const progress = filteredTasks.length > 0 ? Math.round((completed / filteredTasks.length) * 100) : 0;
  const pendingHomework = homework.filter(h => !h.completed).length;
  const activeBooks = readingList.filter(b => !b.completed).length;
  const routineDone = routine.filter(r => r.completed).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const renderTask = ({ item }) => (
    <Animated.View style={[styles.taskCard, { opacity: fadeAnim, backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
      <TouchableOpacity onPress={() => toggleComplete(item.id, item.completed)} style={styles.checkbox}>
        <Feather name={item.completed ? 'check-circle' : 'circle'} size={24} color={item.completed ? COLORS.primary : COLORS.gray} />
      </TouchableOpacity>
      <View style={styles.taskContent}>
        <Text style={[styles.taskTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }, item.completed && styles.completedTask]}>{item.title}</Text>
        {item.description ? <Text style={[styles.taskDescription, { color: COLORS.gray }]} numberOfLines={1}>{item.description}</Text> : null}
        <View style={styles.taskMeta}>
          <View style={styles.metaItem}><Feather name="calendar" size={12} color={COLORS.gray} /><Text style={[styles.taskTime, { color: COLORS.gray }]}>{item.date || 'No date'}</Text></View>
          {item.category && <View style={[styles.categoryBadge, { backgroundColor: categories.find(c => c.id === item.category)?.color + '20' }]}><Text style={[styles.categoryBadgeText, { color: categories.find(c => c.id === item.category)?.color }]}>{item.category}</Text></View>}
        </View>
      </View>
      <TouchableOpacity onPress={() => deleteTaskItem(item.id)}><Feather name="trash-2" size={20} color={COLORS.gray} /></TouchableOpacity>
    </Animated.View>
  );

  if (loading) return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? COLORS.background : LIGHT_COLORS.background, justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? COLORS.background : LIGHT_COLORS.background }]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeHeader}>
          <View><Text style={[styles.greetingText, { color: COLORS.gray }]}>{getGreeting()},</Text><Text style={[styles.userName, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>{user?.name || 'User'}! 👋</Text></View>
          <View style={[styles.premiumBadge, { backgroundColor: COLORS.primary + '20' }]}><FontAwesome5 name="crown" size={14} color={COLORS.gold} /><Text style={styles.premiumText}>PREMIUM</Text></View>
        </View>

        <View style={styles.quickStatsRow}>
          <View style={[styles.quickStat, { backgroundColor: COLORS.routine + '15' }]}><Feather name="sunrise" size={20} color={COLORS.routine} /><Text style={[styles.quickStatNumber, { color: COLORS.routine }]}>{routineDone}/10</Text><Text style={styles.quickStatLabel}>Routine</Text></View>
          <View style={[styles.quickStat, { backgroundColor: COLORS.school + '15' }]}><Feather name="book" size={20} color={COLORS.school} /><Text style={[styles.quickStatNumber, { color: COLORS.school }]}>{pendingHomework}</Text><Text style={styles.quickStatLabel}>Homework</Text></View>
          <View style={[styles.quickStat, { backgroundColor: COLORS.reading + '15' }]}><Feather name="book-open" size={20} color={COLORS.reading} /><Text style={[styles.quickStatNumber, { color: COLORS.reading }]}>{activeBooks + pdfBooks.length}</Text><Text style={styles.quickStatLabel}>Books</Text></View>
        </View>

        <View style={[styles.progressCard, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
          <Text style={[styles.progressTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>Today's Progress</Text>
          <View style={styles.progressBarContainer}><View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: COLORS.primary }]} /></View>
          <Text style={[styles.progressStats, { color: COLORS.gray }]}>{completed}/{filteredTasks.length} tasks • {progress}%</Text>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
          <Feather name="search" size={18} color={COLORS.gray} />
          <TextInput placeholder="Search tasks..." placeholderTextColor={COLORS.gray} style={[styles.searchInput, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]} value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          <TouchableOpacity style={[styles.categoryChip, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }, selectedCategory === 'all' && { backgroundColor: COLORS.primary }]} onPress={() => setSelectedCategory('all')}><Text style={[styles.categoryChipText, selectedCategory === 'all' && styles.categoryChipTextActive]}>All</Text></TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity key={cat.id} style={[styles.categoryChip, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }, selectedCategory === cat.id && { backgroundColor: COLORS.primary }]} onPress={() => setSelectedCategory(cat.id)}>
              <Feather name={cat.icon} size={14} color={selectedCategory === cat.id ? '#000' : cat.color} />
              <Text style={[styles.categoryChipText, selectedCategory === cat.id && styles.categoryChipTextActive]}>{cat.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <FlatList data={filteredTasks} keyExtractor={item => item.id} renderItem={renderTask} scrollEnabled={false}
          ListEmptyComponent={<View style={styles.emptyContainer}><Ionicons name="clipboard-outline" size={80} color={COLORS.gray} /><Text style={[styles.emptyText, { color: COLORS.gray }]}>No tasks yet</Text><Text style={[styles.emptySubtext, { color: COLORS.gray }]}>Tap + to add</Text></View>}
        />
      </ScrollView>
      <TouchableOpacity style={[styles.fab, { backgroundColor: COLORS.primary }]} onPress={() => navigation.navigate('AddTask', { onTaskAdded: loadTasks })}>
        <Feather name="plus" size={28} color="#000" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  welcomeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 20 },
  greetingText: { fontSize: 14 },
  userName: { fontSize: 24, fontWeight: 'bold' },
  premiumBadge: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignItems: 'center', gap: 6 },
  premiumText: { color: COLORS.gold, fontWeight: 'bold', fontSize: 12 },
  quickStatsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  quickStat: { flex: 1, borderRadius: 16, padding: 12, alignItems: 'center' },
  quickStatNumber: { fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  quickStatLabel: { fontSize: 10, marginTop: 2, color: COLORS.gray },
  progressCard: { borderRadius: 20, padding: 16, marginBottom: 20 },
  progressTitle: { fontWeight: '600', marginBottom: 10 },
  progressBarContainer: { height: 8, backgroundColor: COLORS.dark, borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 4 },
  progressStats: { fontSize: 12, marginTop: 8 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, marginBottom: 16 },
  searchInput: { flex: 1, paddingVertical: 12, marginLeft: 8 },
  categoryScroll: { flexDirection: 'row', marginBottom: 20 },
  categoryChip: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 25, marginRight: 10, gap: 6 },
  categoryChipText: { fontWeight: '500', color: COLORS.gray },
  categoryChipTextActive: { color: '#000', fontWeight: '600' },
  taskCard: { borderRadius: 16, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'flex-start' },
  checkbox: { marginRight: 12 },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: '600' },
  completedTask: { textDecorationLine: 'line-through', color: COLORS.gray },
  taskDescription: { fontSize: 13, marginTop: 4 },
  taskMeta: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  taskTime: { fontSize: 11, marginLeft: 4 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  categoryBadgeText: { fontSize: 10, fontWeight: '600' },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 18, marginTop: 15 },
  emptySubtext: { marginTop: 5 },
});
