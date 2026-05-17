// screens/RoutineScreen.js
import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { RoutineContext } from '../contexts/RoutineContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { COLORS, LIGHT_COLORS } from '../utils/colors';

export default function RoutineScreen() {
  const { routine, routineProgress, toggleRoutine, resetRoutine } = useContext(RoutineContext);
  const { darkMode } = useContext(ThemeContext);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? COLORS.background : LIGHT_COLORS.background }]}>
      <ScrollView>
        <Text style={[styles.pageTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>Daily Routine</Text>

        <View style={[styles.routineProgressCard, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
          <Text style={[styles.routineProgressTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>Today's Progress</Text>
          <View style={styles.routineProgressBarContainer}>
            <View style={[styles.routineProgressBar, { width: `${routineProgress}%`, backgroundColor: COLORS.routine }]} />
          </View>
          <Text style={[styles.routineProgressText, { color: COLORS.gray }]}>{routineProgress}% Complete</Text>
        </View>

        {routine.map((item) => (
          <View key={item.id} style={[styles.routineItem, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
            <TouchableOpacity onPress={() => toggleRoutine(item.id)} style={styles.routineCheckbox}>
              <Feather name={item.completed ? 'check-circle' : 'circle'} size={24} color={item.completed ? COLORS.routine : COLORS.gray} />
            </TouchableOpacity>
            <View style={styles.routineContent}>
              <Text style={[styles.routineTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }, item.completed && styles.completedTask]}>{item.title}</Text>
              <Text style={[styles.routineTime, { color: COLORS.gray }]}>{item.time}</Text>
            </View>
            <FontAwesome5 name={item.icon} size={20} color={item.completed ? COLORS.routine : COLORS.gray} />
          </View>
        ))}

        <TouchableOpacity style={[styles.routineResetBtn, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]} onPress={resetRoutine}>
          <Feather name="refresh-cw" size={18} color={COLORS.danger} />
          <Text style={[styles.routineResetText, { color: COLORS.danger }]}>Reset Daily Routine</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  pageTitle: { fontSize: 28, fontWeight: 'bold', marginVertical: 16 },
  routineProgressCard: { borderRadius: 20, padding: 16, marginBottom: 20 },
  routineProgressTitle: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  routineProgressBarContainer: { height: 8, backgroundColor: COLORS.dark, borderRadius: 4, overflow: 'hidden' },
  routineProgressBar: { height: '100%', borderRadius: 4 },
  routineProgressText: { fontSize: 12, marginTop: 8, textAlign: 'right' },
  routineItem: { borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  routineCheckbox: { marginRight: 12 },
  routineContent: { flex: 1 },
  routineTitle: { fontSize: 16, fontWeight: '500' },
  routineTime: { fontSize: 12, marginTop: 2 },
  completedTask: { textDecorationLine: 'line-through', color: COLORS.gray },
  routineResetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, marginTop: 20 },
  routineResetText: { fontWeight: '500' },
});
