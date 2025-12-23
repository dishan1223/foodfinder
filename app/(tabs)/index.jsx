import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';

// Geoapify API Key
const GEOAPIFY_API_KEY = process.env.EXPO_PUBLIC_API_KEY;

// Food emoji mapping for different cuisines
const getFoodEmoji = (cuisineString) => {
  if (!cuisineString) return '🍽️';
  
  const cuisine = cuisineString.toLowerCase();
  
  // Pizza related
  if (cuisine.includes('pizza') || cuisine.includes('italian')) return '🍕';
  
  // Burger related
  if (cuisine.includes('burger') || cuisine.includes('american')) return '🍔';
  
  // Asian cuisines
  if (cuisine.includes('sushi') || cuisine.includes('japanese')) return '🍱';
  if (cuisine.includes('chinese') || cuisine.includes('noodle') || cuisine.includes('ramen')) return '🍜';
  if (cuisine.includes('thai')) return '🍛';
  if (cuisine.includes('korean')) return '🍲';
  if (cuisine.includes('indian')) return '🍛';
  
  // Mexican
  if (cuisine.includes('taco') || cuisine.includes('mexican') || cuisine.includes('burrito')) return '🌮';
  
  // Chicken
  if (cuisine.includes('chicken') || cuisine.includes('wings')) return '🍗';
  
  // Steak/Meat
  if (cuisine.includes('steak') || cuisine.includes('bbq') || cuisine.includes('grill')) return '🥩';
  
  // Sandwich
  if (cuisine.includes('sandwich') || cuisine.includes('deli')) return '🥪';
  
  // Hot dog
  if (cuisine.includes('hot_dog') || cuisine.includes('hotdog')) return '🌭';
  
  // Fish
  if (cuisine.includes('fish') || cuisine.includes('seafood')) return '🐟';
  
  // Coffee/Cafe
  if (cuisine.includes('coffee') || cuisine.includes('cafe')) return '☕';
  
  // Dessert/Sweets
  if (cuisine.includes('dessert') || cuisine.includes('cake') || cuisine.includes('ice_cream') || cuisine.includes('bakery')) return '🍰';
  if (cuisine.includes('donut') || cuisine.includes('doughnut')) return '🍩';
  
  // Breakfast
  if (cuisine.includes('breakfast') || cuisine.includes('pancake')) return '🥞';
  
  // Kebab
  if (cuisine.includes('kebab')) return '🥙';
  
  // Salad
  if (cuisine.includes('salad') || cuisine.includes('healthy')) return '🥗';
  
  // Juice/Smoothie
  if (cuisine.includes('juice') || cuisine.includes('smoothie')) return '🧃';
  
  // French
  if (cuisine.includes('french')) return '🥐';
  
  // Mediterranean
  if (cuisine.includes('mediterranean') || cuisine.includes('falafel')) return '🧆';
  
  // Default
  return '🍽️';
};

// Calculate bounding box around coordinates (approximately 5km radius)
const calculateBoundingBox = (lat, lon, radiusInKm = 5) => {
  const latDelta = radiusInKm / 111; // 1 degree latitude ≈ 111 km
  const lonDelta = radiusInKm / (111 * Math.cos(lat * (Math.PI / 180)));

  return {
    minLon: lon - lonDelta,
    minLat: lat - latDelta,
    maxLon: lon + lonDelta,
    maxLat: lat + latDelta,
  };
};

// Calculate distance between two coordinates in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Parse cuisine/food items from API response
const parseFoodItems = (cuisineString) => {
  if (!cuisineString) return [];
  
  const items = cuisineString.split(';').slice(0, 3); // Get first 3 items
  return items.map(item => 
    item.replace(/_/g, ' ')
       .replace(/\b\w/g, l => l.toUpperCase())
  );
};

// Geocode zip code to coordinates
const geocodeZipCode = async (zipCode) => {
  try {
    const url = `https://api.geoapify.com/v1/geocode/search?postcode=${zipCode}&format=json&apiKey=${GEOAPIFY_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return {
        latitude: data.results[0].lat,
        longitude: data.results[0].lon,
        city: data.results[0].city || data.results[0].county || 'Unknown',
        state: data.results[0].state || data.results[0].country || 'Unknown',
      };
    }
    return null;
  } catch (error) {
    console.error('Error geocoding zip code:', error);
    return null;
  }
};

// --- Location Header Component ---
const LocationHeader = ({
  city,
  state,
  locationEnabled,
  onToggleLocation,
  zipCode,
  onZipCodeChange,
  isLoadingLocation,
  locationError,
  onRetryLocation,
  onSearchByZipCode,
  isSearchingZip,
  hasRestaurants,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Auto-collapse when restaurants are loaded and location is successful
  const shouldShowMinimal = hasRestaurants && locationEnabled && city && state && !locationError;

  if (shouldShowMinimal && !isExpanded) {
    // Minimal collapsed view
    return (
      <View className="bg-white dark:bg-gray-900 mx-4 mt-3 mb-4 rounded-2xl shadow-sm overflow-hidden">
        <TouchableOpacity
          onPress={() => setIsExpanded(true)}
          className="flex-row items-center justify-between px-4 py-3"
          activeOpacity={0.7}
        >
          <View className="flex-row items-center flex-1">
            <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
            <Text className="text-base font-semibold text-black dark:text-white">
              {city}, {state}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-xs text-gray-500 dark:text-gray-400 mr-2">Change</Text>
            <Text className="text-gray-400">⌄</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="bg-white dark:bg-gray-900 mx-4 mt-3 mb-4 p-4 rounded-2xl shadow-sm">
      {/* Collapse button when expanded and has restaurants */}
      {shouldShowMinimal && (
        <TouchableOpacity
          onPress={() => setIsExpanded(false)}
          className="absolute top-3 right-3 z-10 p-1"
          activeOpacity={0.7}
        >
          <Text className="text-gray-400">⌃</Text>
        </TouchableOpacity>
      )}

      {/* Location Status Row */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1">
          <View className="flex-row items-center">
            <View
              className={`w-2 h-2 rounded-full ${
                locationEnabled && !locationError ? 'bg-green-500' : 'bg-gray-400'
              } mr-2`}
            />
            <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Current Location
            </Text>
          </View>
          {isLoadingLocation ? (
            <View className="flex-row items-center mt-1">
              <ActivityIndicator size="small" color="#10b981" />
              <Text className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                Getting location...
              </Text>
            </View>
          ) : locationError ? (
            <View className="mt-1">
              <Text className="text-sm text-red-500 dark:text-red-400 mb-1">
                {locationError}
              </Text>
              <TouchableOpacity onPress={onRetryLocation} className="mt-1" activeOpacity={0.7}>
                <Text className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          ) : locationEnabled && city && state ? (
            <Text className="text-lg font-semibold text-black dark:text-white mt-1">
              {city}, {state}
            </Text>
          ) : (
            <Text className="text-sm text-gray-400 dark:text-gray-600 mt-1">
              {locationEnabled ? 'Tap retry or use zip code' : 'Location Off'}
            </Text>
          )}
        </View>
        <Switch
          value={locationEnabled}
          onValueChange={onToggleLocation}
          trackColor={{ false: '#d1d5db', true: '#10b981' }}
          thumbColor="#ffffff"
          ios_backgroundColor="#d1d5db"
        />
      </View>

      {/* Zip Code Search - Always Visible, Compact Design */}
      <View className="mt-2 pt-3 border-t border-gray-100 dark:border-gray-800">
        <Text className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Or search by zip code
        </Text>
        <View className="flex-row items-center">
          <TextInput
            value={zipCode}
            onChangeText={onZipCodeChange}
            placeholder="Zip code"
            placeholderTextColor="#9ca3af"
            keyboardType="number-pad"
            maxLength={10}
            className="flex-1 bg-gray-50 dark:bg-gray-800 text-black dark:text-white px-3 py-2 rounded-lg text-sm border border-gray-200 dark:border-gray-700"
          />
          <TouchableOpacity
            onPress={onSearchByZipCode}
            disabled={zipCode.length < 3 || isSearchingZip}
            className={`ml-2 px-3 py-2 rounded-lg ${
              zipCode.length >= 3 && !isSearchingZip
                ? 'bg-blue-600'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
            activeOpacity={0.7}
          >
            {isSearchingZip ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className={`font-medium text-sm ${
                zipCode.length >= 3 && !isSearchingZip 
                  ? 'text-white' 
                  : 'text-gray-400 dark:text-gray-500'
              }`}>
                Go
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// --- Enhanced Restaurant Card with Food Emoji ---
const RestaurantCard = ({ item, onPress }) => {
  const [pressed, setPressed] = useState(false);

  return (
    <TouchableOpacity
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      activeOpacity={0.95}
      className={`
        bg-white dark:bg-gray-900 
        p-4 mb-3 
        rounded-2xl 
        shadow-sm
        border border-gray-100 dark:border-gray-800
        ${pressed ? 'opacity-70' : 'opacity-100'}
      `}
    >
      <View className="flex-row items-start justify-between">
        {/* Food Emoji Icon */}
        <View className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 w-16 h-16 rounded-2xl items-center justify-center mr-3">
          <Text className="text-3xl">{item.foodEmoji}</Text>
        </View>

        {/* Restaurant Info */}
        <View className="flex-1">
          <Text className="text-lg font-semibold text-black dark:text-white mb-1">
            {item.name}
          </Text>
          
          {/* Popular Food Items */}
          {item.foodItems && item.foodItems.length > 0 && (
            <View className="flex-row flex-wrap items-center mt-1">
              {item.foodItems.map((food, index) => (
                <View key={index} className="flex-row items-center">
                  <Text className="text-sm text-gray-600 dark:text-gray-400">
                    {food}
                  </Text>
                  {index < item.foodItems.length - 1 && (
                    <View className="w-1 h-1 rounded-full bg-gray-400 mx-2" />
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Opening Hours */}
          {item.openingHours && (
            <View className="mt-2">
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                🕒 {item.openingHours}
              </Text>
            </View>
          )}
        </View>
        
        {/* Highlighted Distance Badge */}
        <View className="bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg ml-2">
          <Text className="text-sm font-bold text-blue-600 dark:text-blue-400">
            {item.distance}
          </Text>
        </View>
      </View>

      {/* View Details */}
      <View className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        <Text className="text-xs font-semibold text-blue-600 dark:text-blue-400">
          View Details →
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [zipCode, setZipCode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(false);
  const [userCoordinates, setUserCoordinates] = useState(null);
  const [isSearchingZip, setIsSearchingZip] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Auto-request location on mount
  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Navigate to restaurant details
  const handleRestaurantPress = (restaurant) => {
    router.push({
      pathname: '/RestaurantDetails',
      params: {
        name: restaurant.name,
        foodEmoji: restaurant.foodEmoji,
        foodItems: JSON.stringify(restaurant.foodItems),
        distance: restaurant.distance,
        openingHours: restaurant.openingHours || 'Not available',
        address: restaurant.address,
        phone: restaurant.phone || '',
        website: restaurant.website || '',
        latitude: restaurant.coordinates[1],
        longitude: restaurant.coordinates[0],
      },
    });
  };

  // Fetch restaurants from Geoapify API
  const fetchRestaurants = async (latitude, longitude) => {
    try {
      setIsLoadingRestaurants(true);

      const bbox = calculateBoundingBox(latitude, longitude, 5);
      
      const url = `https://api.geoapify.com/v2/places?categories=catering.restaurant&filter=rect:${bbox.minLon},${bbox.minLat},${bbox.maxLon},${bbox.maxLat}&limit=20&apiKey=${GEOAPIFY_API_KEY}`;

      console.log('Fetching from URL:', url);

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      const data = await response.json();

      console.log('Number of results:', data.features?.length || 0);

      if (data.features && data.features.length > 0) {
        const formattedRestaurants = data.features.map((feature, index) => {
          const props = feature.properties;
          const distance = calculateDistance(
            latitude,
            longitude,
            feature.geometry.coordinates[1],
            feature.geometry.coordinates[0]
          );

          const cuisineString = props.catering?.cuisine || '';

          return {
            id: props.place_id || `restaurant-${index}`,
            name: props.name || 'Unnamed Restaurant',
            foodItems: parseFoodItems(cuisineString),
            foodEmoji: getFoodEmoji(cuisineString),
            distance: distance < 1 ? `${(distance * 1000).toFixed(0)} m` : `${distance.toFixed(1)} km`,
            distanceValue: distance,
            openingHours: props.opening_hours || null,
            coordinates: feature.geometry.coordinates,
            address: props.formatted || props.address_line1 || 'Address not available',
            phone: props.contact?.phone || props.datasource?.raw?.phone || null,
            website: props.website || props.datasource?.raw?.website || null,
          };
        });

        // Sort by distance
        formattedRestaurants.sort((a, b) => a.distanceValue - b.distanceValue);
        setRestaurants(formattedRestaurants);
        console.log(`Successfully loaded ${formattedRestaurants.length} restaurants`);
      } else {
        console.log('No restaurants in response');
        Alert.alert(
          'No Restaurants Found',
          'No restaurants found in this area.'
        );
        setRestaurants([]);
      }

      setIsLoadingRestaurants(false);
      setIsInitialLoad(false);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      Alert.alert('Error', `Failed to fetch restaurants: ${error.message}`);
      setIsLoadingRestaurants(false);
      setRestaurants([]);
      setIsInitialLoad(false);
    }
  };

  // Search by zip code
  const handleSearchByZipCode = async () => {
    if (zipCode.length < 3) {
      Alert.alert('Invalid Zip Code', 'Please enter a valid zip code.');
      return;
    }

    try {
      setIsSearchingZip(true);
      setLocationError('');

      console.log('Searching for zip code:', zipCode);

      const location = await geocodeZipCode(zipCode);

      if (location) {
        console.log('Zip code location:', location);
        
        setCity(location.city);
        setState(location.state);
        setUserCoordinates({ latitude: location.latitude, longitude: location.longitude });
        setLocationEnabled(true);

        // Fetch restaurants for this location
        await fetchRestaurants(location.latitude, location.longitude);
      } else {
        Alert.alert(
          'Zip Code Not Found',
          'Could not find the location for this zip code. Please try another one.'
        );
      }

      setIsSearchingZip(false);
    } catch (error) {
      console.error('Error searching by zip code:', error);
      Alert.alert('Error', 'Failed to search by zip code. Please try again.');
      setIsSearchingZip(false);
    }
  };

  // Check if location services are enabled
  const checkLocationServices = async () => {
    try {
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        return {
          enabled: false,
          message: 'Location services are disabled',
        };
      }
      return { enabled: true };
    } catch (error) {
      return {
        enabled: false,
        message: 'Unable to check location services',
      };
    }
  };

  // Request location permission and get location
  const requestLocationPermission = async () => {
    try {
      setIsLoadingLocation(true);
      setLocationError('');

      const servicesCheck = await checkLocationServices();
      if (!servicesCheck.enabled) {
        Alert.alert(
          'Turn On Location Services',
          'Please turn on location services in your device settings to find restaurants near you.',
          [
            { 
              text: 'Use Zip Code', 
              style: 'cancel',
              onPress: () => {
                setIsInitialLoad(false);
              }
            },
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
                setIsInitialLoad(false);
              },
            },
          ]
        );
        setLocationError(servicesCheck.message);
        setLocationEnabled(false);
        setIsLoadingLocation(false);
        setIsInitialLoad(false);
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied', 
          'Location permission is required to show nearby restaurants. You can use the zip code search instead.',
          [{ 
            text: 'OK',
            onPress: () => {
              setIsInitialLoad(false);
            }
          }]
        );
        setLocationError('Permission denied');
        setLocationEnabled(false);
        setIsLoadingLocation(false);
        setIsInitialLoad(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;

      console.log('User location:', { latitude, longitude });

      setUserCoordinates({ latitude, longitude });

      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (address) {
        setCity(address.city || address.subregion || 'Unknown City');
        setState(address.region || address.isoCountryCode || 'Unknown');
        setLocationEnabled(true);
        setLocationError('');

        await fetchRestaurants(latitude, longitude);
      } else {
        setLocationError('Unable to determine location');
      }

      setIsLoadingLocation(false);
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Unable to get location');
      setLocationEnabled(false);
      setIsLoadingLocation(false);
      setIsInitialLoad(false);
    }
  };

  // Handle location toggle
  const handleToggleLocation = async (value) => {
    if (value) {
      await requestLocationPermission();
    } else {
      setLocationEnabled(false);
      setCity('');
      setState('');
      setLocationError('');
      setUserCoordinates(null);
      setRestaurants([]);
    }
  };

  // Retry location
  const handleRetryLocation = async () => {
    await requestLocationPermission();
  };

  // Render loading state
  const renderLoadingState = () => (
    <View className="flex-1 items-center justify-center py-20">
      <ActivityIndicator size="large" color="#10b981" />
      <Text className="text-gray-500 dark:text-gray-400 mt-4">Searching for restaurants...</Text>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Text className="text-6xl mb-4">🍽️</Text>
      <Text className="text-lg font-semibold text-black dark:text-white mb-2">
        No Restaurants Found
      </Text>
      <Text className="text-sm text-gray-500 dark:text-gray-400 text-center px-8">
        Enable location or search by zip code to find restaurants near you
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-black">
      <View className="px-4 pt-2 pb-1">
        <Text className="text-3xl font-bold text-black dark:text-white">Restaurants</Text>
      </View>

      <FlatList
        data={restaurants}
        renderItem={({ item }) => (
          <RestaurantCard item={item} onPress={() => handleRestaurantPress(item)} />
        )}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <LocationHeader
            city={city}
            state={state}
            locationEnabled={locationEnabled}
            onToggleLocation={handleToggleLocation}
            zipCode={zipCode}
            onZipCodeChange={setZipCode}
            isLoadingLocation={isLoadingLocation}
            locationError={locationError}
            onRetryLocation={handleRetryLocation}
            onSearchByZipCode={handleSearchByZipCode}
            isSearchingZip={isSearchingZip}
            hasRestaurants={restaurants.length > 0}
          />
        }
        ListEmptyComponent={(isLoadingRestaurants || isInitialLoad) ? renderLoadingState() : renderEmptyState()}
        contentContainerClassName="px-4 pb-4"
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
