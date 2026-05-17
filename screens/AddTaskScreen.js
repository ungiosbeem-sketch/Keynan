// screens/AddTaskScreen.js
import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { COLORS, LIGHT_COLORS, categories } from '../utils/colors';
import { addTask } from '../supabase';

export default function AddTaskScreen({ navigation, route }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [reminder, setReminder] = useState(false);
  const [priority, setPriority] = useState('medium');
  const [selectedCategory, setSelectedCategory] = useState('personal');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useContext(AuthContext);
  const { darkMode } = useContext(ThemeContext);

  const saveTask = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter task title');
      return;
    }

    setIsLoading(true);

    const newTask = {
      id: Date.now().toString(),
      user_id: user.id,
      title: title.trim(),
      description: description || '',
      date: date.toLocaleDateString(),
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reminder: reminder,
      completed: false,
      priority: priority,
      category: selectedCategory,
      created_at: new Date().toISOString(),
    };

    const result = await addTask(newTask);

    if (result.success) {
      Alert.alert('Success', 'Task added successfully!');
      if (route.params?.onTaskAdded) route.params.onTaskAdded();
      navigation.goBack();
    } else {
      Alert.alert('Error', result.error || 'Failed to save task');
    }
    setIsLoading(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? COLORS.background : LIGHT_COLORS.background }]}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={28} color={darkMode ? COLORS.white : LIGHT_COLORS.text} />
        </TouchableOpacity>
        <Text style={[styles.modalTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>New Task</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView>
        <TextInput
          placeholder="Task title"
          placeholderTextColor={COLORS.gray}
          style={[styles.input, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card, color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          placeholder="Description"
          placeholderTextColor={COLORS.gray}
          style={[styles.input, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card, color: darkMode ? COLORS.white : LIGHT_COLORS.text, height: 100 }]}
          multiline
          value={description}
          onChangeText={setDescription}
        />

        <Text style={[styles.inputLabel, { color: COLORS.gray }]}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelect}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categorySelectItem, { borderColor: darkMode ? COLORS.card : LIGHT_COLORS.border }, selectedCategory === cat.id && { borderColor: cat.color, backgroundColor: cat.color + '20' }]}
              onPress={() => setSelectedCategory(cat.id)}>
              <Feather name={cat.icon} size={20} color={selectedCategory === cat.id ? cat.color : COLORS.gray} />
              <Text style={[styles.categorySelectText, { color: selectedCategory === cat.id ? cat.color : COLORS.gray }]}>{cat.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.inputLabel, { color: COLORS.gray }]}>Priority</Text>
        <View style={styles.priorityRow}>
          {['low', 'medium', 'high'].map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.priorityBtn, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }, priority === p && { backgroundColor: p === 'high' ? COLORS.high : p === 'medium' ? COLORS.medium : COLORS.low }]}
              onPress={() => setPriority(p)}>
              <Text style={styles.priorityBtnText}>{p.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.dateBtn, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]} onPress={() => setShowDate(true)}>
          <Feather name="calendar" size={20} color={COLORS.primary} />
          <Text style={[styles.dateBtnText, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>{date.toLocaleDateString()}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.dateBtn, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]} onPress={() => setShowTime(true)}>
          <Feather name="clock" size={20} color={COLORS.primary} />
          <Text style={[styles.dateBtnText, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </TouchableOpacity>

        {showDate && <DateTimePicker value={date} mode="date" onChange={(e, selected) => { setShowDate(false); if (selected) setDate(selected); }} />}
        {showTime && <DateTimePicker value={time} mode="time" onChange={(e, selected) => { setShowTime(false); if (selected) setTime(selected); }} />}

        <View style={[styles.reminderBox, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
          <Text style={[styles.reminderText, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>🔔 Set Reminder</Text>
          <Switch value={reminder} onValueChange={setReminder} trackColor={{ false: '#767577', true: COLORS.primary }} />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={saveTask} disabled={isLoading}>
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={[styles.gradientBtn, { opacity: isLoading ? 0.7 : 1 }]}>
            <Text style={styles.saveBtnText}>{isLoading ? 'Saving...' : '✨ Create Task'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  input: { borderRadius: 12, padding: 14, marginBottom: 16 },
  inputLabel: { marginBottom: 8, fontSize: 14 },
  categorySelect: { flexDirection: 'row', marginBottom: 16 },
  categorySelectItem: { alignItems: 'center', marginRight: 16, padding: 10, borderRadius: 12, borderWidth: 1 },
  categorySelectText: { fontSize: 12, marginTop: 4 },
  priorityRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  priorityBtn: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center' },
  priorityBtnText: { color: '#000', fontSize: 12, fontWeight: '600' },
  dateBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 12, gap: 10 },
  dateBtnText: { fontSize: 14 },
  reminderBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 20 },
  reminderText: { fontSize: 14 },
  saveBtn: { marginBottom: 40 },
  gradientBtn: { padding: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
});
          
