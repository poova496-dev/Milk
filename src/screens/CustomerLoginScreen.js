// Customer Login - phone + password. Hidden gear icon opens the seller login.
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  StatusBar, Alert, Image, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING, RADIUS } from '../config/theme';
import { loginCustomer } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const CustomerLoginScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { signInCustomer } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const customer = await loginCustomer({ phone, password });
      await signInCustomer(customer);
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'Could not log in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primaryDark} barStyle="light-content" />

      {/* Hidden seller access (looks like a settings icon) */}
      <TouchableOpacity
        style={[styles.gearBtn, { top: Math.max(insets.top, SPACING.lg) }]}
        onPress={() => navigation.navigate('SellerLogin')}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.gearIcon}>⚙️</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.brand}>MANJULA MILK</Text>
            <Text style={styles.tagline}>Fresh Milk, Healthy Life</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Customer Login</Text>

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="Enter your phone number"
              placeholderTextColor={COLORS.textLight}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Enter your password"
              placeholderTextColor={COLORS.textLight}
            />

            <TouchableOpacity
              style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.primaryBtnText}>{loading ? 'Logging in...' : 'Login'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('CustomerSignup')}>
              <Text style={styles.linkText}>New here? </Text>
              <Text style={[styles.linkText, styles.linkStrong]}>Create an account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryDark },
  gearBtn: { position: 'absolute', right: SPACING.lg, zIndex: 10, padding: SPACING.xs },
  gearIcon: { fontSize: 24 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: SPACING.xl },
  logoWrap: { alignItems: 'center', marginBottom: SPACING.xl },
  logo: { width: 90, height: 90, marginBottom: SPACING.sm },
  brand: { fontSize: 22, fontWeight: '800', color: COLORS.white, letterSpacing: 1 },
  tagline: { fontSize: 12, color: COLORS.lightGreen, fontStyle: 'italic', marginTop: 2 },
  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.xl, ...SHADOWS.large,
  },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.primaryDark, marginBottom: SPACING.lg, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textDark, marginBottom: SPACING.xs, marginTop: SPACING.md },
  input: {
    backgroundColor: COLORS.backgroundLight, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, fontSize: 15, borderWidth: 1, borderColor: COLORS.borderGray, color: COLORS.textDark,
  },
  primaryBtn: {
    backgroundColor: COLORS.primaryDark, paddingVertical: SPACING.lg, borderRadius: RADIUS.md,
    alignItems: 'center', marginTop: SPACING.xl, ...SHADOWS.small,
  },
  primaryBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.lg },
  linkText: { fontSize: 14, color: COLORS.textGray },
  linkStrong: { color: COLORS.secondary, fontWeight: '700' },
});

export default CustomerLoginScreen;
