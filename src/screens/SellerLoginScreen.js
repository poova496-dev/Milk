// Seller Login - hidden admin access (id: Admin, password: 852585).
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  StatusBar, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING, RADIUS } from '../config/theme';
import { verifySeller } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const SellerLoginScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { signInAdmin } = useAuth();
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (verifySeller(id.trim(), password)) {
      await signInAdmin();
    } else {
      Alert.alert('Access Denied', 'Invalid seller ID or password.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primaryDark} barStyle="light-content" />
      <View style={[styles.header, { paddingTop: Math.max(insets.top, SPACING.lg) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seller Login</Text>
        <View style={{ width: 50 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.lockIcon}>🔐</Text>
            <Text style={styles.title}>Seller / Admin Access</Text>

            <Text style={styles.label}>Seller ID</Text>
            <TextInput
              style={styles.input} value={id} onChangeText={setId} autoCapitalize="none"
              placeholder="Enter seller ID" placeholderTextColor={COLORS.textLight}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input} value={password} onChangeText={setPassword} secureTextEntry
              keyboardType="number-pad" placeholder="Enter password" placeholderTextColor={COLORS.textLight}
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin}>
              <Text style={styles.primaryBtnText}>Enter Seller Panel</Text>
            </TouchableOpacity>
          </View>
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
  scroll: { flexGrow: 1, justifyContent: 'center', padding: SPACING.xl },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.xxl, ...SHADOWS.large },
  lockIcon: { fontSize: 44, textAlign: 'center', marginBottom: SPACING.sm },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.primaryDark, marginBottom: SPACING.lg, textAlign: 'center' },
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
});

export default SellerLoginScreen;
