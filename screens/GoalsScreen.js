import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function GoalsScreen() {
  const [goals, setGoals] = useState([]);
  const [goalText, setGoalText] = useState('');

  const addGoal = () => {
    if (goalText.trim()) {
      setGoals([...goals, { id: Date.now(), text: goalText, completed: false }]);
      setGoalText('');
    }
  };

  const toggleGoal = (id) => {
    setGoals(goals.map(goal => 
      goal.id === id ? { ...goal, completed: !goal.completed } : goal
    ));
  };

  const deleteGoal = (id) => {
    setGoals(goals.filter(goal => goal.id !== id));
  };

  const completedCount = goals.filter(g => g.completed).length;
  const progress = goals.length > 0 ? Math.round((completedCount / goals.length) * 100) : 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Goals</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{completedCount}/{goals.length} completed</Text>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a new goal..."
          placeholderTextColor="#8E8E93"
          value={goalText}
          onChangeText={setGoalText}
        />
        <TouchableOpacity style={styles.addButton} onPress={addGoal}>
          <Feather name="plus" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {goals.map(goal => (
        <View key={goal.id} style={styles.goalItem}>
          <TouchableOpacity onPress={() => toggleGoal(goal.id)} style={styles.checkbox}>
            <Feather name={goal.completed ? 'check-circle' : 'circle'} size={22} color="#FF4FA3" />
          </TouchableOpacity>
          <Text style={[styles.goalText, goal.completed && styles.completedGoal]}>{goal.text}</Text>
          <TouchableOpacity onPress={() => deleteGoal(goal.id)}>
            <Feather name="trash-2" size={18} color="#8E8E93" />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505', padding: 20 },
  header: { marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 15 },
  progressContainer: { backgroundColor: '#121212', padding: 15, borderRadius: 12 },
  progressBar: { height: 8, backgroundColor: '#1C1C1E', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FF4FA3', borderRadius: 4 },
  progressText: { color: '#8E8E93', marginTop: 10, fontSize: 12 },
  inputContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  input: { flex: 1, backgroundColor: '#121212', borderRadius: 12, padding: 14, color: '#FFFFFF' },
  addButton: { backgroundColor: '#FF4FA3', width: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  goalItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#121212', padding: 15, borderRadius: 12, marginBottom: 10, gap: 12 },
  goalText: { flex: 1, color: '#FFFFFF', fontSize: 16 },
  completedGoal: { textDecorationLine: 'line-through', color: '#8E8E93' },
  checkbox: { padding: 2 },
});
