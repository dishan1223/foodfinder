import { Stack } from "expo-router";
import { useColorScheme } from 'react-native';
import "./globals.css"

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        // Set a solid background color for the header
        headerStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7', // System Grouped Background
        },
        // Set the color for the header text and buttons (back button, etc.)
        headerTintColor: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
        // Optional: Add a subtle shadow for depth in light mode
        headerShadowVisible: colorScheme === 'light',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          // Set the title that appears in the header
          title: 'Discover',
          // Enable the iOS "Large Title" style for this screen's header
          headerLargeTitle: true,
        }}
      />
    </Stack>
  );
}