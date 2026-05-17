// contexts/RoutineContext.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const routineItems = [
  { id: 'wake', title: '🌅 Wake Up', time: '06:00', icon: 'sunrise', completed: false },
  { id: 'pray', title: '🕌 Morning Prayer', time: '06:30', icon: 'pray', completed: false },
  { id: 'study', title: '📚 Study Session', time: '08:00', icon: 'book', completed: false },
  { id: 'school', title: '🏫 Go to School', time: '09:00', icon: 'school', completed: false },
  { id: 'lunch', title: '🍽️ Lunch Break', time: '12:00', icon: 'food', completed: false },
  { id: 'homework', title: '✏️ Homework', time: '15:00', icon: 'edit', completed: false },
  { id: 'read', title: '📖 Reading', time: '18:00', icon: 'book-open', completed: false },
  { id: 'dinner', title: '🍲 Dinner', time: '19:30', icon: 'food', completed: false },
  { id: 'review', title: '📝 Review Day', time: '20:30', icon: 'clipboard', completed: false },
  { id: 'sleep', title: '🌙 Sleep', time: '22:00', icon: 'moon', completed: false },
];

export const RoutineContext = createContext();

export const RoutineProvider = ({ children }) => {
  const [routine, setRoutine] = useState(routineItems);
  const [routineProgress, setRoutineProgress] = useState(0);

  useEffect(() => { loadRoutine(); }, []);
  useEffect(() => {
    const completed = routine.filter(r => r.completed).length;
    setRoutineProgress(Math.round((completed / routine.length) * 100));
    saveRoutine();
  }, [routine]);

  const loadRoutine = async () => {
    try {
      const saved = await AsyncStorage.getItem('@daily_routine');
      if (saved) setRoutine(JSON.parse(saved));
    } catch (error) {}
  };

  const saveRoutine = async () => {
    await AsyncStorage.setItem('@daily_routine', JSON.stringify(routine));
  };

  const toggleRoutine = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRoutine(routine.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const resetRoutine = () => {
    setRoutine(routine.map(item => ({ ...item, completed: false })));
  };

  return (
    <RoutineContext.Provider value={{ routine, routineProgress, toggleRoutine, resetRoutine }}>
      {children}
    </RoutineContext.Provider>
  );
};
