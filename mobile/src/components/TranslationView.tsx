import React from 'react';
import { ScrollView, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useStore } from '../store/useStore';
import { deTransliterate } from '../lib/sefaria';

export const TranslationView = () => {
  const { data, activeSegmentIndex, isLoading } = useStore();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D97706" />
      </View>
    );
  }

  if (!data || !data.text[activeSegmentIndex]) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No translation available for this segment.</Text>
      </View>
    );
  }

  const translation = data.text[activeSegmentIndex];
  const processedText = deTransliterate(translation);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.label}>Segment {activeSegmentIndex + 1} Translation</Text>
        <Text style={styles.translationText}>
          {processedText.replace(/<[^>]*>/g, '')}
        </Text>
      </View>
      
      <View style={styles.aiInsightsPlaceholder}>
        <Text style={styles.aiTitle}>✨ AI Insights (Coming Soon)</Text>
        <View style={styles.aiContent}>
          <Markdown
            style={{
              body: { color: '#065F46', fontSize: 14, lineHeight: 20 },
              strong: { fontWeight: 'bold' },
            }}
          >
            Deep analysis and logical structure of this segment will appear here.
          </Markdown>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  translationText: {
    fontSize: 18,
    lineHeight: 28,
    color: '#374151',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
  },
  aiInsightsPlaceholder: {
    backgroundColor: '#ECFDF5',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#065F46',
    marginBottom: 8,
  },
  aiContent: {
    marginTop: 4,
  }
});
