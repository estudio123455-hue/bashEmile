import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { TicketProvider } from '@/context/TicketContext';

// Pre-warm the backend to reduce cold start delay
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3001'
  : 'https://backend-estudio123455-hues-projects.vercel.app';

const warmUpBackend = () => {
  fetch(`${API_BASE_URL}/health`).catch(() => {});
};

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();

  // Pre-warm backend on app load
  useEffect(() => {
    warmUpBackend();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return null;
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="event/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="ticket/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="settings/edit-profile" options={{ presentation: 'card' }} />
        <Stack.Screen name="settings/notifications" options={{ presentation: 'card' }} />
        <Stack.Screen name="settings/help" options={{ presentation: 'card' }} />
        <Stack.Screen name="settings/terms" options={{ presentation: 'card' }} />
        <Stack.Screen name="assistant" options={{ presentation: 'card' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <TicketProvider>
        <RootLayoutNav />
      </TicketProvider>
    </AuthProvider>
  );
}
