import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, SafeAreaView, Modal, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SchoolContext } from '../contexts/SchoolContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { COLORS, LIGHT_COLORS } from '../utils/colors';

export default function SchoolScreen() {
  const { schedule, homework, addHomework, toggleHomework, deleteHomework } = useContext(SchoolContext);
  const { darkMode } = useContext(ThemeContext);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [showAddHomework, setShowAddHomework] = useState(false);
  const [homeworkSubject, setHomeworkSubject] = useState('');
  const [homeworkDesc, setHomeworkDesc] = useState('');
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const filteredSchedule = schedule.filter(s => s.day === selectedDay);
  const todayHomework = homework.filter(h => !h.completed);

  const handleAddHomework = () => {
    if (!homeworkSubject || !homeworkDesc) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    addHomework(homeworkSubject, homeworkDesc, new Date().toLocaleDateString());
    setShowAddHomework(false);
    setHomeworkSubject('');
    setHomeworkDesc('');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? COLORS.background : LIGHT_COLORS.background }]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
      <ScrollView>
        <Text style={[styles.pageTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>School Schedule</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelector}>
          {weekDays.map(day => (
            <TouchableOpacity key={day} style={[styles.dayChip, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }, selectedDay === day && { backgroundColor: COLORS.school }]} onPress={() => setSelectedDay(day)}>
              <Text style={[styles.dayChipText, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }, selectedDay === day && styles.dayChipTextActive]}>{day.slice(0, 3)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={[styles.scheduleSection, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
          <Text style={[styles.sectionTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>📅 {selectedDay}'s Classes</Text>
          {filteredSchedule.map(cls => (
            <View key={cls.id} style={styles.scheduleItem}>
              <View style={styles.scheduleTimeBox}><Text style={[styles.scheduleTime, { color: COLORS.school }]}>{cls.time}</Text></View>
              <View style={styles.scheduleInfo}>
                <Text style={[styles.scheduleSubject, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>{cls.subject}</Text>
                <Text style={[styles.scheduleDetail, { color: COLORS.gray }]}>{cls.teacher || 'Teacher'} • Room {cls.room || 'N/A'}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.homeworkSection, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
          <View style={styles.homeworkHeader}>
            <Text style={[styles.sectionTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>📝 Homework</Text>
            <TouchableOpacity style={styles.addHomeworkBtn} onPress={() => setShowAddHomework(true)}><Feather name="plus" size={20} color={COLORS.white} /></TouchableOpacity>
          </View>

          {todayHomework.map(hw => (
            <View key={hw.id} style={styles.homeworkItem}>
              <TouchableOpacity onPress={() => toggleHomework(hw.id)}><Feather name={hw.completed ? 'check-circle' : 'circle'} size={20} color={hw.completed ? COLORS.success : COLORS.school} /></TouchableOpacity>
              <View style={styles.homeworkContent}>
                <Text style={[styles.homeworkSubject, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>{hw.subject}</Text>
                <Text style={[styles.homeworkDesc, { color: COLORS.gray }]}>{hw.description}</Text>
                <Text style={[styles.homeworkDue, { color: COLORS.warning }]}>Due: {hw.dueDate}</Text>
              </View>
              <TouchableOpacity onPress={() => deleteHomework(hw.id)}><Feather name="trash-2" size={16} color={COLORS.gray} /></TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={showAddHomework} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
            <Text style={[styles.modalTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>Add Homework</Text>
            <TextInput placeholder="Subject" style={[styles.modalInput, { backgroundColor: darkMode ? COLORS.cardLight : LIGHT_COLORS.border, color: darkMode ? COLORS.white : LIGHT_COLORS.text }]} value={homeworkSubject} onChangeText={setHomeworkSubject} />
            <TextInput placeholder="Description" style={[styles.modalInput, { backgroundColor: darkMode ? COLORS.cardLight : LIGHT_COLORS.border, color: darkMode ? COLORS.white : LIGHT_COLORS.text }]} value={homeworkDesc} onChangeText={setHomeworkDesc} multiline />
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: COLORS.school }]} onPress={handleAddHomework}><Text style={styles.modalButtonText}>Add Homework</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.modalCancel, { borderColor: COLORS.gray }]} onPress={() => setShowAddHomework(false)}><Text style={[styles.modalCancelText, { color: COLORS.gray }]}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  pageTitle: { fontSize: 28, fontWeight: 'bold', marginVertical: 16 },
  daySelector: { flexDirection: 'row', marginBottom: 20 },
  dayChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  dayChipText: { fontSize: 14, fontWeight: '500' },
  dayChipTextActive: { color: '#000', fontWeight: '600' },
  scheduleSection: { borderRadius: 20, padding: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  scheduleItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.dark },
  scheduleTimeBox: { width: 80 },
  scheduleTime: { fontSize: 12, fontWeight: '600' },
  scheduleInfo: { flex: 1, marginLeft: 12 },
  scheduleSubject: { fontSize: 14, fontWeight: '500' },
  scheduleDetail: { fontSize: 10, marginTop: 2 },
  homeworkSection: { borderRadius: 20, padding: 16, marginBottom: 20 },
  homeworkHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addHomeworkBtn: { backgroundColor: COLORS.school, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  homeworkItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, gap: 10 },
  homeworkContent: { flex: 1 },
  homeworkSubject: { fontSize: 14, fontWeight: '500' },
  homeworkDesc: { fontSize: 12, marginTop: 2 },
  homeworkDue: { fontSize: 10, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', borderRadius: 24, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalInput: { borderRadius: 12, padding: 14, marginBottom: 12 },
  modalButton: { padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  modalButtonText: { color: '#000', fontWeight: '600' },
  modalCancel: { padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  modalCancelText: { fontWeight: '500' },
});
