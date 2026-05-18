import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useStore } from '../src/store/useStore';

export default function RootLayout() {
  const { loadPage, currentRef } = useStore();

  useEffect(() => {
    loadPage(currentRef);
  }, []);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Vilna Layout' }} />
    </Stack>
  );
}
