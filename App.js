import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
  Alert,
  Keyboard,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const STORAGE_KEY = '@keynan_tasks_v2';

// Qaybaha (Categories)
const CATEGORIES = [
  { id: 'work', name: 'Shaqo', icon: 'briefcase', color: '#3498db' },
  { id: 'home', name: 'Guriga', icon: 'home', color: '#2ecc71' },
  { id: 'study', name: 'Dugsiga', icon: 'book', color: '#e67e22' },
  { id: 'health', name: 'Caafimaad', icon: 'heart', color: '#e74c3c' },
  { id: 'other', name: 'Kale', icon: 'star', color: '#95a5a6' },
];

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [taskText, setTaskText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('work');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'completed'
  const [darkMode, setDarkMode] = useState(false);
  
  // Modal for editing
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editText, setEditText] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDate, setEditDate] = useState(new Date());

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  const loadTasks = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setTasks(JSON.parse(stored));
      const savedDarkMode = await AsyncStorage.getItem('@dark_mode');
      if (savedDarkMode !== null) setDarkMode(JSON.parse(savedDarkMode));
    } catch (error) {
      Alert.alert('Error', 'Ku guuldareystay soo saarista');
    }
  };

  const saveTasks = async (newTasks) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
    } catch (error) {
      Alert.alert('Error', 'Ku guuldareystay kaydinta');
    }
  };

  const toggleDarkMode = async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    await AsyncStorage.setItem('@dark_mode', JSON.stringify(newMode));
  };

  const addTask = () => {
    if (taskText.trim().length === 0) {
      Alert.alert('Fadlan qor hawsha', 'Hawsha ma noqon karto mid madhan');
      return;
    }
    const newTask = {
      id: Date.now().toString(),
      text: taskText,
      category: selectedCategory,
      date: selectedDate.toISOString(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks([...tasks, newTask]);
    setTaskText('');
    setSelectedCategory('work');
    setSelectedDate(new Date());
    Keyboard.dismiss();
  };

  const toggleComplete = (id) => {
    const updated = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updated);
  };

  const deleteTask = (id) => {
    Alert.alert(
      'Tirtir hawsha',
      'Ma hubtaa inaad rabto inaad tirtirto hawshan?',
      [
        { text: 'Kansal', style: 'cancel' },
        {
          text: 'Tirtir',
          style: 'destructive',
          onPress: () => {
            const remaining = tasks.filter((task) => task.id !== id);
            setTasks(remaining);
          },
        },
      ]
    );
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setEditText(task.text);
    setEditCategory(task.category);
    setEditDate(new Date(task.date));
    setEditModalVisible(true);
  };

  const saveEdit = () => {
    if (editText.trim().length === 0) {
      Alert.alert('Fadlan qor hawsha', 'Hawsha ma noqon karto mid madhan');
      return;
    }
    const updatedTasks = tasks.map((task) =>
      task.id === editingTask.id
        ? {
            ...task,
            text: editText,
            category: editCategory,
            date: editDate.toISOString(),
          }
        : task
    );
    setTasks(updatedTasks);
    setEditModalVisible(false);
    setEditingTask(null);
  };

  const getFilteredTasks = () => {
    if (filter === 'pending') return tasks.filter((t) => !t.completed);
    if (filter === 'completed') return tasks.filter((t) => t.completed);
    return tasks;
  };

  const getCategoryIcon = (categoryId) => {
    const cat = CATEGORIES.find((c) => c.id === categoryId);
    return cat ? cat.icon : 'star';
  };

  const getCategoryColor = (categoryId) => {
    const cat = CATEGORIES.find((c) => c.id === categoryId);
    return cat ? cat.color : '#95a5a6';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('so-SO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderItem = ({ item }) => (
    <View style={[styles.taskCard, darkMode && styles.taskCardDark]}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => toggleComplete(item.id)}
      >
        <Feather
          name={item.completed ? 'check-square' : 'square'}
          size={24}
          color={item.completed ? '#4caf50' : '#888'}
        />
      </TouchableOpacity>
      
      <View style={styles.taskContent}>
        <View style={styles.taskHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
            <Feather name={getCategoryIcon(item.category)} size={12} color={getCategoryColor(item.category)} />
            <Text style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>
              {CATEGORIES.find(c => c.id === item.category)?.name}
            </Text>
          </View>
          <Text style={[styles.dateText, darkMode && styles.dateTextDark]}>
            <Feather name="calendar" size={12} /> {formatDate(item.date)}
          </Text>
        </View>
        
        <Text
          style={[
            styles.taskText,
            item.completed && styles.completedText,
            darkMode && styles.taskTextDark,
          ]}
        >
          {item.text}
        </Text>
      </View>
      
      <View style={styles.taskActions}>
        <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionButton}>
          <Feather name="edit-2" size={20} color="#3498db" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteTask(item.id)} style={styles.actionButton}>
          <Feather name="trash-2" size={20} color="#f44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const filteredTasks = getFilteredTasks();
  const pendingCount = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="calendar" size={32} color={darkMode ? '#fff' : '#2c3e50'} />
          <Text style={[styles.title, darkMode && styles.titleDark]}>Keynan Planner</Text>
        </View>
        <View style={styles.headerRight}>
          <Feather name="moon" size={20} color={darkMode ? '#fff' : '#2c3e50'} />
          <Switch value={darkMode} onValueChange={toggleDarkMode} />
        </View>
      </View>

      {/* Add Task Section */}
      <View style={styles.inputSection}>
        <TextInput
          style={[styles.input, darkMode && styles.inputDark]}
          placeholder="Hawsha cusub..."
          placeholderTextColor={darkMode ? '#aaa' : '#999'}
          value={taskText}
          onChangeText={setTaskText}
        />
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedCategory === cat.id && styles.categoryChipSelected,
                { borderColor: cat.color },
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Feather name={cat.icon} size={16} color={selectedCategory === cat.id ? '#fff' : cat.color} />
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat.id && styles.categoryChipTextSelected,
                  { color: selectedCategory === cat.id ? '#fff' : cat.color },
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Feather name="calendar" size={20} color={darkMode ? '#fff' : '#2c3e50'} />
            <Text style={[styles.dateButtonText, darkMode && styles.dateButtonTextDark]}>
              {formatDate(selectedDate)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={addTask}>
            <Feather name="plus" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setSelectedDate(date);
          }}
        />
      )}

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>Dhammaan ({tasks.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>Qabso ({pendingCount})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'completed' && styles.filterTabActive]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>Dhammaystay ({completedCount})</Text>
        </TouchableOpacity>
      </View>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="clipboard" size={64} color={darkMode ? '#555' : '#ccc'} />
          <Text style={[styles.emptyText, darkMode && styles.emptyTextDark]}>Weli hawlo ma jiraan</Text>
          <Text style={[styles.emptySubText, darkMode && styles.emptySubTextDark]}>Ku dar hawsha koowaad</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Edit Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, darkMode && styles.modalContentDark]}>
            <Text style={[styles.modalTitle, darkMode && styles.modalTitleDark]}>Wax ka beddel</Text>
            
            <TextInput
              style={[styles.modalInput, darkMode && styles.modalInputDark]}
              value={editText}
              onChangeText={setEditText}
              placeholder="Hawsha..."
              placeholderTextColor={darkMode ? '#aaa' : '#999'}
            />
            
            <Text style={[styles.modalLabel, darkMode && styles.modalLabelDark]}>Qaybta</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalCategories}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.modalCategoryChip,
                    editCategory === cat.id && styles.modalCategoryChipSelected,
                  ]}
                  onPress={() => setEditCategory(cat.id)}
                >
                  <Feather name={cat.icon} size={16} color={editCategory === cat.id ? '#fff' : cat.color} />
                  <Text style={[styles.modalCategoryText, editCategory === cat.id && { color: '#fff' }]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity style={styles.modalDateButton} onPress={() => setShowDatePicker(true)}>
              <Feather name="calendar" size={20} color={darkMode ? '#fff' : '#2c3e50'} />
              <Text style={[styles.modalDateText, darkMode && styles.modalDateTextDark]}>
                {formatDate(editDate)}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalCancelText}>Kansal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} onPress={saveEdit}>
                <Text style={styles.modalSaveText}>Kaydi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 12,
  },
  titleDark: {
    color: '#fff',
  },
  inputSection: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
  },
  inputDark: {
    backgroundColor: '#1e1e1e',
    borderColor: '#333',
    color: '#fff',
  },
  categoriesScroll: {
    marginBottom: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    backgroundColor: 'transparent',
  },
  categoryChipSelected: {
    backgroundColor: '#2c3e50',
    borderColor: '#2c3e50',
  },
  categoryChipText: {
    fontSize: 14,
    marginLeft: 6,
  },
  categoryChipTextSelected: {
    color: '#fff',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    gap: 8,
  },
  dateButtonText: {
    color: '#2c3e50',
  },
  dateButtonTextDark: {
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#2c3e50',
    borderRadius: 12,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: '#2c3e50',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  list: {
    paddingBottom: 20,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  taskCardDark: {
    backgroundColor: '#1e1e1e',
  },
  checkbox: {
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    color: '#888',
  },
  dateTextDark: {
    color: '#aaa',
  },
  taskText: {
    fontSize: 16,
    color: '#333',
  },
  taskTextDark: {
    color: '#fff',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  taskActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#aaa',
    marginTop: 12,
  },
  emptyTextDark: {
    color: '#666',
  },
  emptySubText: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 6,
  },
  emptySubTextDark: {
    color: '#444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  modalContentDark: {
    backgroundColor: '#1e1e1e',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  modalTitleDark: {
    color: '#fff',
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalInputDark: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  modalLabelDark: {
    color: '#aaa',
  },
  modalCategories: {
    marginBottom: 16,
  },
  modalCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  modalCategoryChipSelected: {
    backgroundColor: '#2c3e50',
    borderColor: '#2c3e50',
  },
  modalCategoryText: {
    fontSize: 14,
    marginLeft: 6,
    color: '#333',
  },
  modalDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  modalDateText: {
    color: '#2c3e50',
  },
  modalDateTextDark: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
  modalCancelText: {
    color: '#666',
    fontWeight: '500',
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#2c3e50',
    borderRadius: 8,
},
modalSaveText: { 
  color: '#fff',
  fontWeight: 'bold',
   },
 });
