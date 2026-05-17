import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, SafeAreaView, Modal, TextInput } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { ReadingContext } from '../contexts/ReadingContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { COLORS, LIGHT_COLORS } from '../utils/colors';

export default function ReadingScreen() {
  const { readingList, pdfBooks, addBook, addPdfBook, updateProgress, deleteBook, deletePdfBook, openPdf } = useContext(ReadingContext);
  const { darkMode } = useContext(ThemeContext);
  const [showAddBook, setShowAddBook] = useState(false);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookPages, setBookPages] = useState('');
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [pagesRead, setPagesRead] = useState('');

  const handleAddBook = () => {
    if (!bookTitle || !bookAuthor || !bookPages) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    addBook(bookTitle, bookAuthor, bookPages);
    setShowAddBook(false);
    setBookTitle('');
    setBookAuthor('');
    setBookPages('');
  };

  const handleUpdateProgress = () => {
    if (!pagesRead || parseInt(pagesRead) <= 0) {
      Alert.alert('Error', 'Enter valid pages');
      return;
    }
    updateProgress(selectedBook.id, parseInt(pagesRead));
    setShowProgressModal(false);
    setPagesRead('');
    setSelectedBook(null);
  };

  const pickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (result.canceled === false) {
        const pdf = result.assets[0];
        await addPdfBook(pdf.uri, pdf.name, pdf.size);
      }
    } catch (error) { Alert.alert('Error', 'Failed to load PDF'); }
  };

  const totalPages = readingList.reduce((sum, book) => sum + book.totalPages, 0);
  const totalRead = readingList.reduce((sum, book) => sum + book.currentPage, 0);
  const readingProgress = totalPages > 0 ? Math.round((totalRead / totalPages) * 100) : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? COLORS.background : LIGHT_COLORS.background }]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
      <ScrollView>
        <Text style={[styles.pageTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>Reading List</Text>

        <View style={[styles.readingStatsCard, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
          <View style={styles.readingStatsRow}>
            <View style={styles.readingStatItem}><Text style={[styles.readingStatNumber, { color: COLORS.reading }]}>{readingList.length + pdfBooks.length}</Text><Text style={[styles.readingStatLabel, { color: COLORS.gray }]}>Books</Text></View>
            <View style={styles.readingStatItem}><Text style={[styles.readingStatNumber, { color: COLORS.reading }]}>{totalRead}</Text><Text style={[styles.readingStatLabel, { color: COLORS.gray }]}>Pages Read</Text></View>
            <View style={styles.readingStatItem}><Text style={[styles.readingStatNumber, { color: COLORS.reading }]}>{readingProgress}%</Text><Text style={[styles.readingStatLabel, { color: COLORS.gray }]}>Progress</Text></View>
          </View>
          <View style={styles.readingProgressBarContainer}><View style={[styles.readingProgressBar, { width: `${readingProgress}%`, backgroundColor: COLORS.reading }]} /></View>
        </View>

        <TouchableOpacity style={[styles.addBookBtn, { backgroundColor: COLORS.reading }]} onPress={() => setShowAddBook(true)}><Feather name="plus" size={20} color="#000" /><Text style={styles.addBookBtnText}>Add New Book</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.addPdfBtn, { backgroundColor: COLORS.reading + '80' }]} onPress={pickPdf}><Feather name="file-text" size={20} color="#000" /><Text style={styles.addPdfBtnText}>Upload PDF Book</Text></TouchableOpacity>

        {readingList.map(book => {
          const bookProgress = Math.round((book.currentPage / book.totalPages) * 100);
          return (
            <View key={book.id} style={[styles.bookCard, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
              <View style={styles.bookHeader}>
                <View style={styles.bookIcon}><FontAwesome5 name="book" size={24} color={COLORS.reading} /></View>
                <View style={styles.bookInfo}><Text style={[styles.bookTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>{book.title}</Text><Text style={[styles.bookAuthor, { color: COLORS.gray }]}>by {book.author}</Text></View>
                <TouchableOpacity onPress={() => deleteBook(book.id)}><Feather name="trash-2" size={18} color={COLORS.gray} /></TouchableOpacity>
              </View>
              <View style={styles.bookProgressContainer}>
                <View style={styles.bookProgressBarBg}><View style={[styles.bookProgressBar, { width: `${bookProgress}%`, backgroundColor: COLORS.reading }]} /></View>
                <Text style={[styles.bookProgressText, { color: COLORS.gray }]}>{book.currentPage}/{book.totalPages} pages ({bookProgress}%)</Text>
              </View>
              {!book.completed && (
                <TouchableOpacity style={[styles.updateProgressBtn, { borderColor: COLORS.reading }]} onPress={() => { setSelectedBook(book); setShowProgressModal(true); }}>
                  <Text style={[styles.updateProgressText, { color: COLORS.reading }]}>Update Progress</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {pdfBooks.map(book => (
          <View key={book.id} style={[styles.bookCard, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
            <View style={styles.bookHeader}>
              <View style={[styles.bookIcon, { backgroundColor: COLORS.reading + '20' }]}><Feather name="file-text" size={24} color={COLORS.reading} /></View>
              <View style={styles.bookInfo}><Text style={[styles.bookTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>{book.title}</Text><Text style={[styles.bookAuthor, { color: COLORS.gray }]}>PDF Document</Text></View>
              <TouchableOpacity onPress={() => deletePdfBook(book.id)}><Feather name="trash-2" size={18} color={COLORS.gray} /></TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.openPdfBtn, { backgroundColor: COLORS.reading + '15' }]} onPress={() => openPdf(book.uri)}>
              <Feather name="eye" size={16} color={COLORS.reading} />
              <Text style={[styles.openPdfText, { color: COLORS.reading }]}>Open PDF</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal visible={showAddBook} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
            <Text style={[styles.modalTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>Add New Book</Text>
            <TextInput placeholder="Book Title" style={[styles.modalInput, { backgroundColor: darkMode ? COLORS.cardLight : LIGHT_COLORS.border, color: darkMode ? COLORS.white : LIGHT_COLORS.text }]} value={bookTitle} onChangeText={setBookTitle} />
            <TextInput placeholder="Author" style={[styles.modalInput, { backgroundColor: darkMode ? COLORS.cardLight : LIGHT_COLORS.border, color: darkMode ? COLORS.white : LIGHT_COLORS.text }]} value={bookAuthor} onChangeText={setBookAuthor} />
            <TextInput placeholder="Total Pages" style={[styles.modalInput, { backgroundColor: darkMode ? COLORS.cardLight : LIGHT_COLORS.border, color: darkMode ? COLORS.white : LIGHT_COLORS.text }]} value={bookPages} onChangeText={setBookPages} keyboardType="numeric" />
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: COLORS.reading }]} onPress={handleAddBook}><Text style={styles.modalButtonText}>Add Book</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.modalCancel, { borderColor: COLORS.gray }]} onPress={() => setShowAddBook(false)}><Text style={[styles.modalCancelText, { color: COLORS.gray }]}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showProgressModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: darkMode ? COLORS.card : LIGHT_COLORS.card }]}>
            <Text style={[styles.modalTitle, { color: darkMode ? COLORS.white : LIGHT_COLORS.text }]}>Update Reading Progress</Text>
            <Text style={[styles.modalSubtitle, { color: COLORS.gray }]}>{selectedBook?.title}</Text>
            <TextInput placeholder="Pages read" style={[styles.modalInput, { backgroundColor: darkMode ? COLORS.cardLight : LIGHT_COLORS.border, color: darkMode ? COLORS.white : LIGHT_COLORS.text }]} value={pagesRead} onChangeText={setPagesRead} keyboardType="numeric" />
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: COLORS.reading }]} onPress={handleUpdateProgress}><Text style={styles.modalButtonText}>Update</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.modalCancel, { borderColor: COLORS.gray }]} onPress={() => { setShowProgressModal(false); setPagesRead(''); }}><Text style={[styles.modalCancelText, { color: COLORS.gray }]}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  pageTitle: { fontSize: 28, fontWeight: 'bold', marginVertical: 16 },
  readingStatsCard: { borderRadius: 20, padding: 16, marginBottom: 20 },
  readingStatsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  readingStatItem: { alignItems: 'center' },
  readingStatNumber: { fontSize: 28, fontWeight: 'bold' },
  readingStatLabel: { fontSize: 12, marginTop: 4 },
  readingProgressBarContainer: { height: 8, backgroundColor: COLORS.dark, borderRadius: 4, overflow: 'hidden' },
  readingProgressBar: { height: '100%', borderRadius: 4 },
  addBookBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, marginBottom: 12 },
  addBookBtnText: { color: '#000', fontWeight: '600' },
  addPdfBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, marginBottom: 12 },
  addPdfBtnText: { color: '#000', fontWeight: '600' },
  bookCard: { borderRadius: 16, padding: 16, marginBottom: 12 },
  bookHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  bookIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.reading + '20', justifyContent: 'center', alignItems: 'center' },
  bookInfo: { flex: 1, marginLeft: 12 },
  bookTitle: { fontSize: 16, fontWeight: '600' },
  bookAuthor: { fontSize: 12, marginTop: 2 },
  bookProgressContainer: { marginBottom: 12 },
  bookProgressBarBg: { height: 6, backgroundColor: COLORS.dark, borderRadius: 3, overflow: 'hidden' },
  bookProgressBar: { height: '100%', borderRadius: 3 },
  bookProgressText: { fontSize: 10, marginTop: 6, textAlign: 'right' },
  updateProgressBtn: { borderWidth: 1, padding: 8, borderRadius: 8, alignItems: 'center' },
  updateProgressText: { fontSize: 12, fontWeight: '500' },
  openPdfBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 8 },
  openPdfText: { fontSize: 14, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', borderRadius: 24, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 16 },
  modalInput: { borderRadius: 12, padding: 14, marginBottom: 12 },
  modalButton: { padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  modalButtonText: { color: '#000', fontWeight: '600' },
  modalCancel: { padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  modalCancelText: { fontWeight: '500' },
});
