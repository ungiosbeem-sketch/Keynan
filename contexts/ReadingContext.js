import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Haptics from 'expo-haptics';

export const ReadingContext = createContext();

export const ReadingProvider = ({ children }) => {
  const [readingList, setReadingList] = useState([]);
  const [pdfBooks, setPdfBooks] = useState([]);

  useEffect(() => { loadReadingList(); loadPdfBooks(); }, []);

  const loadReadingList = async () => {
    try {
      const saved = await AsyncStorage.getItem('@reading_list');
      if (saved) setReadingList(JSON.parse(saved));
    } catch (error) {}
  };

  const loadPdfBooks = async () => {
    try {
      const saved = await AsyncStorage.getItem('@pdf_books');
      if (saved) setPdfBooks(JSON.parse(saved));
    } catch (error) {}
  };

  const saveReadingList = async (newList) => {
    await AsyncStorage.setItem('@reading_list', JSON.stringify(newList));
    setReadingList(newList);
  };

  const addBook = (title, author, totalPages) => {
    const newBook = { id: Date.now().toString(), title, author, totalPages: parseInt(totalPages), currentPage: 0, completed: false, type: 'book' };
    saveReadingList([...readingList, newBook]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const addPdfBook = async (pdfUri, fileName, fileSize) => {
    try {
      const newPdfBook = {
        id: Date.now().toString(),
        title: fileName.replace('.pdf', ''),
        type: 'pdf',
        uri: pdfUri,
        fileSize: fileSize,
        completed: false,
        addedDate: new Date().toISOString(),
      };
      const updatedList = [...pdfBooks, newPdfBook];
      setPdfBooks(updatedList);
      await AsyncStorage.setItem('@pdf_books', JSON.stringify(updatedList));
      Alert.alert('Success', 'PDF added!');
      return true;
    } catch (error) {
      Alert.alert('Error', 'Failed to add PDF');
      return false;
    }
  };

  const updateProgress = (id, pages) => {
    const updated = readingList.map(book => {
      if (book.id === id) {
        const newPage = Math.min(book.currentPage + pages, book.totalPages);
        const completed = newPage === book.totalPages;
        return { ...book, currentPage: newPage, completed };
      }
      return book;
    });
    saveReadingList(updated);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const deleteBook = (id) => {
    saveReadingList(readingList.filter(book => book.id !== id));
  };

  const deletePdfBook = async (id) => {
    const updatedList = pdfBooks.filter(book => book.id !== id);
    setPdfBooks(updatedList);
    await AsyncStorage.setItem('@pdf_books', JSON.stringify(updatedList));
  };

  const openPdf = async (pdfUri) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(pdfUri);
      if (!fileInfo.exists) {
        Alert.alert('Error', 'PDF file not found');
        return;
      }
      const { uri } = await FileSystem.getContentUriAsync(pdfUri);
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: uri,
        flags: 1,
        type: 'application/pdf',
      });
    } catch (error) {
      Alert.alert('Error', 'Cannot open PDF. Please install a PDF reader app.');
    }
  };

  return (
    <ReadingContext.Provider value={{
      readingList, pdfBooks, addBook, addPdfBook, updateProgress,
      deleteBook, deletePdfBook, openPdf
    }}>
      {children}
    </ReadingContext.Provider>
  );
};
