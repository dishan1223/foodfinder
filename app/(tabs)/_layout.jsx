import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Home, Hotel } from 'lucide-react-native';

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7',
        },
        headerTintColor: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
        headerShadowVisible: colorScheme === 'light',
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7',
        },
        tabBarActiveTintColor: colorScheme === 'dark' ? '#0A84FF' : '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}
    >
      {/* Discover Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Restaurants',
          headerLargeTitle: true,
          tabBarLabel: 'Discover',
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size} />
          ),
        }}
      />
      
      {/* Hotels Tab */}
      <Tabs.Screen
        name="Hotels"
        options={{
          title: 'Hotels',
          headerLargeTitle: true,
          tabBarLabel: 'Hotels',
          tabBarIcon: ({ color, size }) => (
            <Hotel color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
