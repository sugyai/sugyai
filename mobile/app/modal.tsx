import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useStore } from '../src/store/useStore';
import { getHebrewBooksUrl } from '../src/lib/sefaria';

export default function ModalScreen() {
  const { currentRef } = useStore();
  const url = getHebrewBooksUrl(currentRef);

  if (!url) return null;

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: url }}
        style={styles.webview}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#D97706" />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
