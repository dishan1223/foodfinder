import { Stack } from "expo-router";
import { useColorScheme } from 'react-native';
import "./globals.css"

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7',
        },
        headerTintColor: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
        headerShadowVisible: colorScheme === 'light',
      }}
    >
      {/* Tabs group - contains index.jsx and Hotels.jsx */}
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false, // Hide Stack header, Tabs will show their own
        }}
      />
      
      {/* Restaurant Details */}
      <Stack.Screen
        name="RestaurantDetails"
        options={{
          presentation: 'card',
          title: 'Restaurant Details',
          headerBackTitle: 'Back',
        }}
      />

      {/* Hotel Details */}
      <Stack.Screen
        name="HotelDetails"
        options={{
          presentation: 'card',
          title: 'Hotel Details',
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
}
