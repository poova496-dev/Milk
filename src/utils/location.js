// Location helpers - GPS capture (expo-location) and opening an external map.
import { Linking, Platform } from 'react-native';
import * as Location from 'expo-location';

/**
 * Request permission and return the device's current coordinates.
 * @returns {Promise<{latitude:number, longitude:number}>}
 * @throws if permission denied or location unavailable
 */
export const captureCurrentLocation = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied. Please allow location access.');
  }
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
  };
};

/**
 * Open the given coordinates in the device's map app.
 */
export const openInMaps = (latitude, longitude, label = 'Delivery location') => {
  if (latitude == null || longitude == null) return;
  const latLng = `${latitude},${longitude}`;
  const url = Platform.select({
    ios: `maps:0,0?q=${encodeURIComponent(label)}@${latLng}`,
    android: `geo:0,0?q=${latLng}(${encodeURIComponent(label)})`,
  });
  // Fallback to Google Maps web URL if the native scheme fails.
  const webUrl = `https://www.google.com/maps/search/?api=1&query=${latLng}`;
  Linking.openURL(url).catch(() => Linking.openURL(webUrl));
};
