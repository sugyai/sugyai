import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Button, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { ChevronLeft, ChevronRight, BookOpen, ExternalLink } from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { router } from 'expo-router';

const TRACTATES = [
  'Berakhot', 'Shabbat', 'Eruvin', 'Pesachim', 'Shekalim', 'Yoma', 'Sukkah', 'Beitzah', 'Rosh_Hashanah', 'Taanit', 'Megillah', 'Moed_Katan', 'Chagigah', 'Yevamot', 'Ketubot', 'Nedarim', 'Nazir', 'Sotah', 'Gittin', 'Kiddushin', 'Bava_Kamma', 'Bava_Metzia', 'Bava_Batra', 'Sanhedrin', 'Makkot', 'Shevuot', 'Avodah_Zarah', 'Horayot', 'Zevachim', 'Menachot', 'Chullin', 'Bekhorot', 'Arakhin', 'Temurah', 'Keritot', 'Meilah', 'Tamid', 'Middot', 'Kinnim', 'Niddah'
];

export const StudyHeader = () => {
  const { currentRef, loadPage } = useStore();
  const [modalVisible, setModalVisible] = useState(false);
  
  // Parse currentRef: "Berakhot 2a"
  const match = currentRef.match(/^(.*?)\s(\d+)([ab])$/);
  const currentTractate = match ? match[1] : 'Berakhot';
  const currentDaf = match ? match[2] : '2';
  const currentSide = match ? match[3] : 'a';

  const [tempTractate, setTempTractate] = useState(currentTractate);
  const [tempDaf, setTempDaf] = useState(currentDaf);
  const [tempSide, setTempSide] = useState(currentSide);

  const handleApply = () => {
    const newRef = `${tempTractate} ${tempDaf}${tempSide}`;
    loadPage(newRef);
    setModalVisible(false);
  };

  const navigateDaf = (delta: number) => {
    let daf = parseInt(currentDaf);
    let side = currentSide;

    if (delta > 0) {
      if (side === 'a') side = 'b';
      else {
        side = 'a';
        daf++;
      }
    } else {
      if (side === 'b') side = 'a';
      else {
        side = 'b';
        daf--;
      }
    }

    if (daf < 2) return;
    loadPage(`${currentTractate} ${daf}${side}`);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigateDaf(-1)} style={styles.navButton}>
        <ChevronLeft size={24} color="#D97706" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.pickerTrigger} onPress={() => {
        setTempTractate(currentTractate);
        setTempDaf(currentDaf);
        setTempSide(currentSide);
        setModalVisible(true);
      }}>
        <Text style={styles.refText}>{currentRef}</Text>
        <BookOpen size={18} color="#4B5563" style={{ marginLeft: 8 }} />
      </TouchableOpacity>

      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity onPress={() => router.push('/modal')} style={styles.navButton}>
          <ExternalLink size={20} color="#4B5563" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigateDaf(1)} style={styles.navButton}>
          <ChevronRight size={24} color="#D97706" />
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.pickerRow}>
              <Picker
                selectedValue={tempTractate}
                style={{ flex: 2 }}
                onValueChange={(itemValue) => setTempTractate(itemValue)}
              >
                {TRACTATES.map(t => <Picker.Item key={t} label={t.replace(/_/g, ' ')} value={t} />)}
              </Picker>
              <Picker
                selectedValue={tempDaf}
                style={{ flex: 1 }}
                onValueChange={(itemValue) => setTempDaf(itemValue)}
              >
                {Array.from({ length: 175 }, (_, i) => (i + 2).toString()).map(d => (
                  <Picker.Item key={d} label={d} value={d} />
                ))}
              </Picker>
              <Picker
                selectedValue={tempSide}
                style={{ flex: 1 }}
                onValueChange={(itemValue) => setTempSide(itemValue)}
              >
                <Picker.Item label="a" value="a" />
                <Picker.Item label="b" value="b" />
              </Picker>
            </View>
            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} color="#6B7280" />
              <Button title="Apply" onPress={handleApply} color="#D97706" />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
    paddingBottom: 10,
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  refText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#92400E',
  },
  navButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  pickerRow: {
    flexDirection: 'row',
    height: 200,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingBottom: 20,
  },
});
