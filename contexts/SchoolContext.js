import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

export const SchoolContext = createContext();

export const SchoolProvider = ({ children }) => {
  const [schedule, setSchedule] = useState([]);
  const [homework, setHomework] = useState([]);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubject, setNewSubject] = useState({ day: 'Monday', subject: '', time: '', teacher: '', room: '' });
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => { loadSchedule(); loadHomework(); }, []);

  const loadSchedule = async () => {
    try {
      const saved = await AsyncStorage.getItem('@school_schedule');
      if (saved) setSchedule(JSON.parse(saved));
      else {
        const defaultSchedule = [
          { id: '1', day: 'Monday', subject: 'Mathematics', time: '08:00-09:30', teacher: 'Mr. Ahmed', room: '101' },
          { id: '2', day: 'Monday', subject: 'Physics', time: '10:00-11:30', teacher: 'Ms. Fatima', room: '202' },
          { id: '3', day: 'Tuesday', subject: 'Chemistry', time: '08:00-09:30', teacher: 'Dr. Omar', room: '103' },
          { id: '4', day: 'Tuesday', subject: 'English', time: '10:00-11:30', teacher: 'Ms. Aisha', room: '204' },
          { id: '5', day: 'Wednesday', subject: 'Biology', time: '08:00-09:30', teacher: 'Dr. Hassan', room: '105' },
          { id: '6', day: 'Wednesday', subject: 'History', time: '10:00-11:30', teacher: 'Mr. Khalid', room: '206' },
        ];
        setSchedule(defaultSchedule);
        await AsyncStorage.setItem('@school_schedule', JSON.stringify(defaultSchedule));
      }
    } catch (error) {}
  };

  const loadHomework = async () => {
    try {
      const saved = await AsyncStorage.getItem('@homework');
      if (saved) setHomework(JSON.parse(saved));
    } catch (error) {}
  };

  const saveHomework = async (newHomework) => {
    await AsyncStorage.setItem('@homework', JSON.stringify(newHomework));
    setHomework(newHomework);
  };

  const addHomework = (subject, description, dueDate) => {
    const newHomework = { id: Date.now().toString(), subject, description, dueDate, completed: false };
    saveHomework([...homework, newHomework]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const toggleHomework = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    saveHomework(homework.map(h => h.id === id ? { ...h, completed: !h.completed } : h));
  };

  const deleteHomework = (id) => {
    saveHomework(homework.filter(h => h.id !== id));
  };

  const addCustomSubject = async (subject) => {
    const newSubjectItem = { id: Date.now().toString(), ...subject, isCustom: true };
    const updatedSchedule = [...schedule, newSubjectItem];
    setSchedule(updatedSchedule);
    await AsyncStorage.setItem('@school_schedule', JSON.stringify(updatedSchedule));
    Alert.alert('Success', 'Subject added!');
  };

  const deleteCustomSubject = async (id) => {
    const updatedSchedule = schedule.filter(s => s.id !== id);
    setSchedule(updatedSchedule);
    await AsyncStorage.setItem('@school_schedule', JSON.stringify(updatedSchedule));
  };

  return (
    <SchoolContext.Provider value={{
      schedule, homework, addHomework, toggleHomework, deleteHomework,
      addCustomSubject, deleteCustomSubject, showAddSubject, setShowAddSubject,
      newSubject, setNewSubject, weekDays
    }}>
      {children}
    </SchoolContext.Provider>
  );
};
