import React, { useState, useEffect } from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet, View, ActivityIndicator, Alert } from 'react-native';
import { useStore } from '../store/useStore';
import { extractDivreiHamaschil } from '../lib/sefaria';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react-native';

export const CommentariesView = () => {
  const { data, activeSegmentIndex, isLoading, currentRef, handleAiTranslate, aiTranslations, translatingRefs, error, clearError } = useStore();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D97706" />
      </View>
    );
  }

  if (!data || !data.commentary) return null;

  // Filter commentaries that belong to the active segment
  const segmentRef = `${currentRef}:${activeSegmentIndex + 1}`;
  const filteredCommentaries = data.commentary.filter(c => 
    c.anchorRef === segmentRef || (c.anchorRefExpanded && c.anchorRefExpanded.includes(segmentRef))
  );

  if (filteredCommentaries.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No commentaries found for this segment.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {filteredCommentaries.map((commentary, index) => {
        const isExpanded = expandedIndex === index;
        const dh = extractDivreiHamaschil(commentary.he);
        const body = commentary.he.replace(/<[^>]*>/g, '').replace(dh, '').trim();
        const translation = aiTranslations[commentary.ref] || commentary.text;
        const isTranslating = translatingRefs[commentary.ref];

        return (
          <View key={index} style={styles.card}>
            <TouchableOpacity 
              style={styles.cardHeader} 
              onPress={() => setExpandedIndex(isExpanded ? null : index)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.author}>
                  {typeof commentary.collectiveTitle === 'object' 
                    ? commentary.collectiveTitle.en 
                    : (commentary.collectiveTitle || commentary.index_title)}
                </Text>
                {dh ? <Text style={styles.dh} numberOfLines={isExpanded ? undefined : 1}>{dh}</Text> : null}
              </View>
              {isExpanded ? <ChevronUp size={20} color="#6B7280" /> : <ChevronDown size={20} color="#6B7280" />}
            </TouchableOpacity>

            {isExpanded && (
              <View style={styles.cardBody}>
                <Text style={styles.bodyText}>{body}</Text>
                
                {translation ? (
                  <View style={styles.translationContainer}>
                    <Text style={styles.translationText}>{translation}</Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={[styles.aiButton, isTranslating && styles.disabledButton]}
                    onPress={() => handleAiTranslate(commentary.ref, commentary.he, commentary.index_title)}
                    disabled={isTranslating}
                  >
                    {isTranslating ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Sparkles size={16} color="#FFF" />
                    )}
                    <Text style={styles.aiButtonText}>
                      {isTranslating ? 'Translating...' : 'AI Translate'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  author: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  dh: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'right',
  },
  cardBody: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    textAlign: 'right',
    marginTop: 12,
  },
  translationContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  translationText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  disabledButton: {
    opacity: 0.7,
  },
  aiButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
  },
});
