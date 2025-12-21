import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function RestaurantDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parse the restaurant data from params
  const restaurant = {
    name: params.name || 'Restaurant',
    foodEmoji: params.foodEmoji || '🍽️',
    foodItems: params.foodItems ? JSON.parse(params.foodItems) : [],
    distance: params.distance || 'N/A',
    openingHours: params.openingHours || 'Not available',
    address: params.address || 'Address not available',
    phone: params.phone || null,
    website: params.website || null,
    latitude: parseFloat(params.latitude) || 0,
    longitude: parseFloat(params.longitude) || 0,
  };

  // Open in Google Maps
  const openInMaps = () => {
    const scheme = Platform.select({
      ios: 'maps:',
      android: 'geo:',
    });
    
    const latLng = `${restaurant.latitude},${restaurant.longitude}`;
    const label = encodeURIComponent(restaurant.name);
    
    const url = Platform.select({
      ios: `${scheme}?q=${label}&ll=${latLng}`,
      android: `${scheme}${latLng}?q=${label}`,
    });

    Linking.openURL(url).catch(() => {
      // Fallback to browser-based Google Maps
      const browserUrl = `https://www.google.com/maps/search/?api=1&query=${latLng}`;
      Linking.openURL(browserUrl);
    });
  };

  // Call phone number
  const callRestaurant = () => {
    if (restaurant.phone) {
      Linking.openURL(`tel:${restaurant.phone}`);
    }
  };

  // Open website
  const openWebsite = () => {
    if (restaurant.website) {
      Linking.openURL(restaurant.website);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-black">

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Restaurant Header Card */}
        <View className="bg-white dark:bg-gray-900 mx-4 mt-4 p-6 rounded-2xl shadow-sm">
          {/* Food Emoji */}
          <View className="items-center mb-4">
            <View className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 w-24 h-24 rounded-3xl items-center justify-center">
              <Text className="text-6xl">{restaurant.foodEmoji}</Text>
            </View>
          </View>

          {/* Restaurant Name */}
          <Text className="text-2xl font-bold text-black dark:text-white text-center mb-2">
            {restaurant.name}
          </Text>

          {/* Distance Badge */}
          <View className="items-center mb-4">
            <View className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full">
              <Text className="text-sm font-bold text-blue-600 dark:text-blue-400">
                📍 {restaurant.distance} away
              </Text>
            </View>
          </View>

          {/* Popular Food Items */}
          {restaurant.foodItems && restaurant.foodItems.length > 0 && (
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Popular Items
              </Text>
              <View className="flex-row flex-wrap">
                {restaurant.foodItems.map((food, index) => (
                  <View
                    key={index}
                    className="bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full mr-2 mb-2"
                  >
                    <Text className="text-sm text-gray-700 dark:text-gray-300">
                      {food}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Details Section */}
        <View className="bg-white dark:bg-gray-900 mx-4 mt-4 p-6 rounded-2xl shadow-sm">
          <Text className="text-lg font-bold text-black dark:text-white mb-4">
            Information
          </Text>

          {/* Opening Hours */}
          <View className="mb-4">
            <View className="flex-row items-start">
              <Text className="text-2xl mr-3">🕒</Text>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Opening Hours
                </Text>
                <Text className="text-base text-gray-600 dark:text-gray-400">
                  {restaurant.openingHours}
                </Text>
              </View>
            </View>
          </View>

          {/* Address */}
          <View className="mb-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <View className="flex-row items-start">
              <Text className="text-2xl mr-3">📍</Text>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Address
                </Text>
                <Text className="text-base text-gray-600 dark:text-gray-400">
                  {restaurant.address}
                </Text>
              </View>
            </View>
          </View>

          {/* Phone */}
          {restaurant.phone && (
            <View className="mb-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <TouchableOpacity
                onPress={callRestaurant}
                className="flex-row items-start"
                activeOpacity={0.7}
              >
                <Text className="text-2xl mr-3">📞</Text>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Phone
                  </Text>
                  <Text className="text-base text-blue-600 dark:text-blue-400">
                    {restaurant.phone}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Website */}
          {restaurant.website && (
            <View className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <TouchableOpacity
                onPress={openWebsite}
                className="flex-row items-start"
                activeOpacity={0.7}
              >
                <Text className="text-2xl mr-3">🌐</Text>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Website
                  </Text>
                  <Text className="text-base text-blue-600 dark:text-blue-400" numberOfLines={1}>
                    {restaurant.website}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Google Maps Button */}
        <View className="mx-4 mt-6 mb-6">
          <TouchableOpacity
            onPress={openInMaps}
            className="bg-blue-600 dark:bg-blue-500 py-4 rounded-2xl shadow-lg"
            activeOpacity={0.8}
          >
            <View className="flex-row items-center justify-center">
              <Text className="text-xl mr-2">🗺️</Text>
              <Text className="text-lg font-bold text-white">
                Navigate in Google Maps
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}