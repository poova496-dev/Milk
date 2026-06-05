// Customer Signup - name, phone, password, optional email, GPS location capture.
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  StatusBar, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING, RADIUS } from '../config/theme';
import { signupCustomer } from '../services/authService';
import { captureCurrentLocation } from '../utils/location';
import { useAuth } from '../context/AuthContext';

const CustomerSignupScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { signInCustomer } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const handleCaptureLocation = async () => {
    try {
      setLocating(true);
      const c = await captureCurrentLocation();
      setCoords(c);
    } catch (error) {
      Alert.alert('Location', error.message || 'Could not get your location');
    } finally {
      setLocating(false);
    }
  };

  const handleSignup = async () => {
    if (!coords) {
      Alert.alert('Location Required', 'Please capture your location so we can deliver to you.');
      return;
    }
    try {
      setLoading(true);
      const customer = await signupCustomer({
        name,
        phone,
        password,
        email,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      await signInCustomer(customer);
    } catch (error) {
      Alert.alert('Signup Failed', error.message || 'Could not create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primaryDark} barStyle="light-content" />
      <View style={[styles.header, { paddingTop: Math.max(insets.top, SPACING.lg) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
        <View style={{ width: 50 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input} value={name} onChangeText={setName}
            placeholder="Your full name" placeholderTextColor={COLORS.textLight}
          />

          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad"
            placeholder="Used to log in" placeholderTextColor={COLORS.textLight}
          />

          <Text style={styles.label}>Password *</Text>
          <TextInput
            style={styles.input} value={password} onChangeText={setPassword} secureTextEntry
            placeholder="At least 4 characters" placeholderTextColor={COLORS.textLight}
          />

          <Text style={styles.label}>Email (optional)</Text>
          <TextInput
            style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address"
            autoCapitalize="none" placeholder="you@example.com" placeholderTextColor={COLORS.textLight}
          />

          <Text style={styles.label}>Delivery Location *</Text>
          <TouchableOpacity
            style={[styles.locationBtn, coords && styles.locationBtnDone]}
            onPress={handleCaptureLocation}
            disabled={locating}
          >
            <Text style={[styles.locationBtnText, coords && { color: COLORS.secondary }]}>
              {locating ? 'Getting location...' : coords ? '✓ Location captured (tap to update)' : '📍 Capture my GPS location'}
            </Text>
          </TouchableOpacity>
          {coords && (
            <Text style={styles.coordsText}>
              Lat: {coords.latitude.toFixed(5)}, Lng: {coords.longitude.toFixed(5)}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.primaryBtnText}>{loading ? 'Creating...' : 'Sign Up'}</Text>
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  header: {
    backgroundColor: COLORS.primaryDark, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.lg, paddingTop: SPACING.xl,
  },
  backBtn: { padding: SPACING.xs },
  backText: { color: COLORS.white, fontSize: 15 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  scroll: { padding: SPACING.xl },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textDark, marginBottom: SPACING.xs, marginTop: SPACING.md },
  input: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, fontSize: 15, borderWidth: 1, borderColor: COLORS.borderGray, color: COLORS.textDark,
  },
  locationBtn: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md, paddingVertical: SPACING.lg, alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.secondary, borderStyle: 'dashed',
  },
  locationBtnDone: { borderStyle: 'solid', backgroundColor: COLORS.lightGreen },
  locationBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.secondary },
  coordsText: { fontSize: 12, color: COLORS.textGray, marginTop: SPACING.xs, textAlign: 'center' },
  primaryBtn: {
    backgroundColor: COLORS.primaryDark, paddingVertical: SPACING.lg, borderRadius: RADIUS.md,
    alignItems: 'center', marginTop: SPACING.xxl, ...SHADOWS.small,
  },
  primaryBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});

export default CustomerSignupScreen;
