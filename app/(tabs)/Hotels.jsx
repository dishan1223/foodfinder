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
  hasHotels,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const shouldShowMinimal = hasHotels && locationEnabled && city && state && !locationError;

  if (shouldShowMinimal && !isExpanded) {
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
      {shouldShowMinimal && (
        <TouchableOpacity
          onPress={() => setIsExpanded(false)}
          className="absolute top-3 right-3 z-10 p-1"
          activeOpacity={0.7}
        >
          <Text className="text-gray-400">⌃</Text>
        </TouchableOpacity>
      )}

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

// --- Hotel Card Component ---
const HotelCard = ({ item, onPress }) => {
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
        {/* Hotel Icon */}
        <View className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 w-16 h-16 rounded-2xl items-center justify-center mr-3">
          <Text className="text-3xl">🏨</Text>
        </View>

        {/* Hotel Info */}
        <View className="flex-1">
          <Text className="text-lg font-semibold text-black dark:text-white mb-1">
            {item.name}
          </Text>
          
          {/* Hotel Category */}
          {item.category && (
            <View className="flex-row items-center mt-1">
              <View className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                <Text className="text-xs text-gray-600 dark:text-gray-400">
                  {item.category}
                </Text>
              </View>
            </View>
          )}

          {/* Star Rating */}
          {item.stars && (
            <View className="mt-2 flex-row items-center">
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {'⭐'.repeat(item.stars)}
              </Text>
            </View>
          )}
        </View>
        
        {/* Distance Badge */}
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

export default function Hotels() {
  const router = useRouter();
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [zipCode, setZipCode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [hotels, setHotels] = useState([]);
  const [isLoadingHotels, setIsLoadingHotels] = useState(false);
  const [userCoordinates, setUserCoordinates] = useState(null);
  const [isSearchingZip, setIsSearchingZip] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const handleHotelPress = (hotel) => {
    router.push({
      pathname: '/HotelDetails',
      params: {
        name: hotel.name,
        distance: hotel.distance,
        category: hotel.category || 'Hotel',
        stars: hotel.stars || 0,
        address: hotel.address,
        phone: hotel.phone || '',
        website: hotel.website || '',
        latitude: hotel.coordinates[1],
        longitude: hotel.coordinates[0],
      },
    });
  };

  const fetchHotels = async (latitude, longitude) => {
    try {
      setIsLoadingHotels(true);
      const bbox = calculateBoundingBox(latitude, longitude, 5);
      
      // Geoapify categories for hotels and accommodations
      const url = `https://api.geoapify.com/v2/places?categories=accommodation.hotel,accommodation&filter=rect:${bbox.minLon},${bbox.minLat},${bbox.maxLon},${bbox.maxLat}&limit=20&apiKey=${GEOAPIFY_API_KEY}`;

      console.log('Fetching hotels from URL:', url);

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Number of hotels:', data.features?.length || 0);

      if (data.features && data.features.length > 0) {
        const formattedHotels = data.features.map((feature, index) => {
          const props = feature.properties;
          const distance = calculateDistance(
            latitude,
            longitude,
            feature.geometry.coordinates[1],
            feature.geometry.coordinates[0]
          );

          return {
            id: props.place_id || `hotel-${index}`,
            name: props.name || 'Unnamed Hotel',
            category: props.categories?.[0]?.split('.')?.[1]?.replace(/_/g, ' ') || 'Hotel',
            stars: props.datasource?.raw?.stars || null,
            distance: distance < 1 ? `${(distance * 1000).toFixed(0)} m` : `${distance.toFixed(1)} km`,
            distanceValue: distance,
            coordinates: feature.geometry.coordinates,
            address: props.formatted || props.address_line1 || 'Address not available',
            phone: props.contact?.phone || props.datasource?.raw?.phone || null,
            website: props.website || props.datasource?.raw?.website || null,
          };
        });

        formattedHotels.sort((a, b) => a.distanceValue - b.distanceValue);
        setHotels(formattedHotels);
        console.log(`Successfully loaded ${formattedHotels.length} hotels`);
      } else {
        console.log('No hotels in response');
        Alert.alert('No Hotels Found', 'No hotels found in this area.');
        setHotels([]);
      }

      setIsLoadingHotels(false);
      setIsInitialLoad(false);
    } catch (error) {
      console.error('Error fetching hotels:', error);
      Alert.alert('Error', `Failed to fetch hotels: ${error.message}`);
      setIsLoadingHotels(false);
      setHotels([]);
      setIsInitialLoad(false);
    }
  };

  const handleSearchByZipCode = async () => {
    if (zipCode.length < 3) {
      Alert.alert('Invalid Zip Code', 'Please enter a valid zip code.');
      return;
    }

    try {
      setIsSearchingZip(true);
      setLocationError('');

      const location = await geocodeZipCode(zipCode);

      if (location) {
        setCity(location.city);
        setState(location.state);
        setUserCoordinates({ latitude: location.latitude, longitude: location.longitude });
        setLocationEnabled(true);
        await fetchHotels(location.latitude, location.longitude);
      } else {
        Alert.alert('Zip Code Not Found', 'Could not find the location for this zip code.');
      }

      setIsSearchingZip(false);
    } catch (error) {
      console.error('Error searching by zip code:', error);
      Alert.alert('Error', 'Failed to search by zip code. Please try again.');
      setIsSearchingZip(false);
    }
  };

  const checkLocationServices = async () => {
    try {
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        return { enabled: false, message: 'Location services are disabled' };
      }
      return { enabled: true };
    } catch (error) {
      return { enabled: false, message: 'Unable to check location services' };
    }
  };

  const requestLocationPermission = async () => {
    try {
      setIsLoadingLocation(true);
      setLocationError('');

      const servicesCheck = await checkLocationServices();
      if (!servicesCheck.enabled) {
        Alert.alert(
          'Turn On Location Services',
          'Please turn on location services in your device settings to find hotels near you.',
          [
            { 
              text: 'Use Zip Code', 
              style: 'cancel',
              onPress: () => setIsInitialLoad(false)
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
          'Location permission is required to show nearby hotels.',
          [{ 
            text: 'OK',
            onPress: () => setIsInitialLoad(false)
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

      setUserCoordinates({ latitude, longitude });

      const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });

      if (address) {
        setCity(address.city || address.subregion || 'Unknown City');
        setState(address.region || address.isoCountryCode || 'Unknown');
        setLocationEnabled(true);
        setLocationError('');
        await fetchHotels(latitude, longitude);
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

  const handleToggleLocation = async (value) => {
    if (value) {
      await requestLocationPermission();
    } else {
      setLocationEnabled(false);
      setCity('');
      setState('');
      setLocationError('');
      setUserCoordinates(null);
      setHotels([]);
    }
  };

  const handleRetryLocation = async () => {
    await requestLocationPermission();
  };

  const renderLoadingState = () => (
    <View className="flex-1 items-center justify-center py-20">
      <ActivityIndicator size="large" color="#10b981" />
      <Text className="text-gray-500 dark:text-gray-400 mt-4">Searching for hotels...</Text>
    </View>
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Text className="text-6xl mb-4">🏨</Text>
      <Text className="text-lg font-semibold text-black dark:text-white mb-2">
        No Hotels Found
      </Text>
      <Text className="text-sm text-gray-500 dark:text-gray-400 text-center px-8">
        Enable location or search by zip code to find hotels near you
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-black">
      <View className="px-4 pt-2 pb-1">
        <Text className="text-3xl font-bold text-black dark:text-white">Hotels</Text>
      </View>

      <FlatList
        data={hotels}
        renderItem={({ item }) => (
          <HotelCard item={item} onPress={() => handleHotelPress(item)} />
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
            hasHotels={hotels.length > 0}
          />
        }
        ListEmptyComponent={(isLoadingHotels || isInitialLoad) ? renderLoadingState() : renderEmptyState()}
        contentContainerClassName="px-4 pb-4"
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
