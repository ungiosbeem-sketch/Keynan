import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Feather } from '@expo/vector-icons';

export default function CalendarScreen({ tasks }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const getMarkedDates = () => {
    const marked = {};
    tasks.forEach(task => {
      if (task.date) {
        marked[task.date] = { marked: true, dotColor: '#FF4FA3' };
      }
    });
    marked[selectedDate] = { selected: true, selectedColor: '#FF4FA3' };
    return marked;
  };

  const tasksForSelectedDate = tasks.filter(task => task.date === selectedDate);

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={getMarkedDates()}
        theme={{
          calendarBackground: '#121212',
          textSectionTitleColor: '#8E8E93',
          dayTextColor: '#FFFFFF',
          todayTextColor: '#FF4FA3',
          selectedDayBackgroundColor: '#FF4FA3',
          arrowColor: '#FF4FA3',
        }}
      />
      <ScrollView style={styles.tasksList}>
        <Text style={styles.sectionTitle}>Tasks for {selectedDate}</Text>
        {tasksForSelectedDate.map(task => (
          <View key={task.id} style={styles.taskItem}>
            <Feather name={task.completed ? 'check-circle' : 'circle'} size={20} color="#FF4FA3" />
            <Text style={[styles.taskText, task.completed && styles.completed]}>{task.title}</Text>
          </View>
        ))}
        {tasksForSelectedDate.length === 0 && (
          <Text style={styles.emptyText}>No tasks for this day</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  tasksList: { padding: 20 },
  sectionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  taskItem: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#121212', borderRadius: 12, marginBottom: 10, gap: 10 },
  taskText: { color: '#FFFFFF', flex: 1 },
  completed: { textDecorationLine: 'line-through', color: '#8E8E93' },
  emptyText: { color: '#8E8E93', textAlign: 'center', marginTop: 20 },
});
