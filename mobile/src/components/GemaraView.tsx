import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet, View, ActivityIndicator, Platform } from 'react-native';
import { useStore } from '../store/useStore';

export const GemaraView = () => {
  const { data, activeSegmentIndex, setActiveSegmentIndex, isLoading } = useStore();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D97706" />
      </View>
    );
  }

  if (!data) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {data.he.map((segment, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => setActiveSegmentIndex(index)}
          style={[
            styles.segment,
            activeSegmentIndex === index && styles.activeSegment
          ]}
        >
          <Text style={[
            styles.hebrewText,
            activeSegmentIndex === index && styles.activeText
          ]}>
            {segment.replace(/<[^>]*>/g, '')}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  content: {
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segment: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  activeSegment: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
  },
  hebrewText: {
    fontSize: 22,
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
    lineHeight: 32,
    color: '#1F2937',
  },
  activeText: {
    color: '#92400E',
    fontWeight: 'bold',
  },
});

