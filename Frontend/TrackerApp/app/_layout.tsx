import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

// Fonts
import { useFonts } from 'expo-font';
import {
  PixelifySans_400Regular,
  PixelifySans_500Medium,
  PixelifySans_700Bold,
} from '@expo-google-fonts/pixelify-sans';
import { Jersey10_400Regular } from '@expo-google-fonts/jersey-10';
import {
  RobotoSlab_400Regular,
  RobotoSlab_700Bold,
} from '@expo-google-fonts/roboto-slab';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    PixelifySans_400Regular,
    PixelifySans_500Medium,
    PixelifySans_700Bold,
    Jersey10_400Regular,
    RobotoSlab_400Regular,
    RobotoSlab_700Bold,
  });

  if (!fontsLoaded) {
    // Optional: return a loading screen here
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: 'modal', title: 'Modal' }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
