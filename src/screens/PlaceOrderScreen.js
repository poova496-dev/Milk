// Place Order - customer enters liters, sees per-liter + total price, orders.
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  StatusBar, Alert, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING, RADIUS } from '../config/theme';
import { getActiveRate } from '../services/rateService';
import { createOrder, getActiveOrder } from '../services/orderService';
import { getCustomerPending } from '../services/paymentService';
import { getCustomerById } from '../services/customerService';
import { captureCurrentLocation } from '../utils/location';
import { formatCurrency } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

const QUICK_LITERS = ['0.5', '1', '1.5', '2'];

const PlaceOrderScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { customer, signOut, updateCustomer } = useAuth();
  const [rate, setRate] = useState(null);
  const [liters, setLiters] = useState('1');
  const [loading, setLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [active, setActive] = useState(customer?.is_active !== false);
  const [pending, setPending] = useState(0);
  const [activeOrder, setActiveOrder] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadRate();
      refreshStatus();
      loadPending();
      loadActiveOrder();
    }, [])
  );

  const loadPending = async () => {
    try {
      const amt = await getCustomerPending(customer.customer_id);
      setPending(amt);
    } catch (e) {
      // Keep last known pending on failure.
    }
  };

  const loadActiveOrder = async () => {
    try {
      const ord = await getActiveOrder(customer.customer_id);
      setActiveOrder(ord);
    } catch (e) {
      // Ignore; ordering check also runs server-side on place.
    }
  };

  const loadRate = async () => {
    try {
      setLoading(true);
      const r = await getActiveRate();
      setRate(r);
    } catch (error) {
      Alert.alert('Error', 'Could not load the current milk rate');
    } finally {
      setLoading(false);
    }
  };

  // Re-check the account status from the database so a seller deactivation
  // takes effect even while the customer stays logged in.
  const refreshStatus = async () => {
    try {
      const fresh = await getCustomerById(customer.customer_id);
      if (!fresh) return;
      const isActive = fresh.is_active !== false;
      setActive(isActive);
      updateCustomer({ ...customer, ...fresh });
      if (!isActive) {
        Alert.alert(
          'Account Inactive',
          'Your ID is inactive. Please contact the Seller to activate your account before ordering.'
        );
      }
    } catch (e) {
      // If the check fails (e.g. offline), keep the last known status.
    }
  };

  const perLiter = rate ? parseFloat(rate.rate_per_liter) : 0;
  const qty = parseFloat(liters) || 0;
  const total = qty * perLiter;

  const handlePlaceOrder = async () => {
    if (!active) {
      Alert.alert(
        'Account Inactive',
        'Your ID is inactive. Please contact the Seller to activate your account before ordering.'
      );
      return;
    }
    if (activeOrder) {
      Alert.alert(
        'Order In Progress',
        'You already have an active order. You can place a new order after it is delivered.',
        [{ text: 'View My Orders', onPress: () => navigation.navigate('MyOrders') }, { text: 'OK' }]
      );
      return;
    }
    if (qty <= 0) {
      Alert.alert('Validation', 'Please enter how many liters you want');
      return;
    }
    if (!rate) {
      Alert.alert('Unavailable', 'Milk rate is not set yet. Please try later.');
      return;
    }

    // Ensure we have a delivery location; use the saved one or capture now.
    let latitude = customer?.latitude;
    let longitude = customer?.longitude;
    if (latitude == null || longitude == null) {
      try {
        const c = await captureCurrentLocation();
        latitude = c.latitude;
        longitude = c.longitude;
        await updateCustomer({ ...customer, latitude, longitude });
      } catch (e) {
        Alert.alert('Location needed', e.message || 'Could not get your location');
        return;
      }
    }

    try {
      setPlacing(true);
      await createOrder({
        customer_id: customer.customer_id,
        customer_name: customer.customer_name,
        quantity_liters: qty,
        rate_per_liter: perLiter,
        total_amount: total,
        latitude,
        longitude,
      });
      // Reset the form back to its default state after a successful order.
      setLiters('1');
      await Promise.all([loadActiveOrder(), loadPending()]);
      Alert.alert('Order Placed', `Your order for ${qty} L (${formatCurrency(total)}) has been placed. The seller will confirm soon.`, [
        { text: 'View My Orders', onPress: () => navigation.navigate('MyOrders') },
        { text: 'OK' },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not place the order');
    } finally {
      setPlacing(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert('Logout', 'Do you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primaryDark} barStyle="light-content" />
      <View style={[styles.header, { paddingTop: Math.max(insets.top, SPACING.lg) }]}>
        <View>
          <Text style={styles.hello}>Hello,</Text>
          <Text style={styles.headerName}>{customer?.customer_name}</Text>
        </View>
        <TouchableOpacity onPress={confirmLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {!active && (
          <View style={styles.inactiveBanner}>
            <Text style={styles.inactiveTitle}>⚠️ Your ID is Inactive</Text>
            <Text style={styles.inactiveText}>
              You cannot place orders right now. Please contact the Seller to activate your account.
            </Text>
          </View>
        )}

        <View style={[styles.pendingCard, pending > 0 ? styles.pendingDue : styles.pendingClear]}>
          <Text style={styles.pendingLabel}>Pending Amount</Text>
          <Text style={[styles.pendingValue, pending > 0 ? styles.pendingValueDue : styles.pendingValueClear]}>
            {formatCurrency(pending)}
          </Text>
          {pending <= 0 && <Text style={styles.pendingSub}>You're all paid up 🎉</Text>}
        </View>

        {activeOrder && (
          <View style={styles.activeOrderBanner}>
            <Text style={styles.activeOrderTitle}>🚚 Order In Progress</Text>
            <Text style={styles.activeOrderText}>
              {activeOrder.quantity_liters} L • {activeOrder.status === 'accepted' ? 'Accepted, on the way' : 'Waiting for seller to confirm'}.
              {'\n'}You can place a new order once this one is delivered.
            </Text>
          </View>
        )}

        <View style={styles.rateCard}>
          <Text style={styles.rateLabel}>Today's Price</Text>
          <Text style={styles.rateValue}>{loading ? '...' : `${formatCurrency(perLiter)} / Liter`}</Text>
        </View>

        <Text style={styles.sectionLabel}>How many liters?</Text>
        <View style={styles.quickRow}>
          {QUICK_LITERS.map((q) => (
            <TouchableOpacity
              key={q}
              style={[styles.quickBtn, liters === q && styles.quickBtnActive]}
              onPress={() => setLiters(q)}
            >
              <Text style={[styles.quickText, liters === q && styles.quickTextActive]}>{q} L</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.litersInput}
          value={liters}
          onChangeText={setLiters}
          keyboardType="decimal-pad"
          placeholder="Enter liters"
          placeholderTextColor={COLORS.textLight}
        />

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Per Liter</Text>
            <Text style={styles.summaryValue}>{formatCurrency(perLiter)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Quantity</Text>
            <Text style={styles.summaryValue}>{qty} L</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, (placing || !active || !!activeOrder) && { opacity: 0.5 }]}
          onPress={handlePlaceOrder}
          disabled={placing || !active || !!activeOrder}
        >
          <Text style={styles.primaryBtnText}>
            {!active
              ? '🔒 Ordering Disabled'
              : activeOrder
                ? '⏳ Order In Progress'
                : placing
                  ? 'Placing...'
                  : '🥛 Place Order'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('MyOrders')}>
          <Text style={styles.secondaryBtnText}>📋 My Orders</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  header: {
    backgroundColor: COLORS.primaryDark, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.lg, paddingTop: SPACING.xl,
  },
  hello: { color: COLORS.lightGreen, fontSize: 13 },
  headerName: { color: COLORS.white, fontSize: 20, fontWeight: '700' },
  logoutBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.white },
  logoutText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },
  scroll: { padding: SPACING.xl },
  inactiveBanner: {
    backgroundColor: '#FFEBEE', borderRadius: RADIUS.md, padding: SPACING.lg,
    marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.errorRed,
  },
  inactiveTitle: { fontSize: 15, fontWeight: '800', color: COLORS.errorRed, marginBottom: SPACING.xs },
  inactiveText: { fontSize: 13, color: COLORS.errorRed, lineHeight: 18 },
  pendingCard: {
    borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: 'center',
    marginBottom: SPACING.lg, borderWidth: 1,
  },
  pendingDue: { backgroundColor: '#FFF3E0', borderColor: '#FFB74D' },
  pendingClear: { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' },
  pendingLabel: { fontSize: 13, color: COLORS.textGray, fontWeight: '600' },
  pendingValue: { fontSize: 24, fontWeight: '800', marginTop: SPACING.xs },
  pendingValueDue: { color: '#E65100' },
  pendingValueClear: { color: COLORS.primaryDark },
  pendingSub: { fontSize: 12, color: COLORS.secondary, marginTop: SPACING.xs },
  activeOrderBanner: {
    backgroundColor: '#E3F2FD', borderRadius: RADIUS.md, padding: SPACING.lg,
    marginBottom: SPACING.lg, borderWidth: 1, borderColor: '#64B5F6',
  },
  activeOrderTitle: { fontSize: 15, fontWeight: '800', color: '#1565C0', marginBottom: SPACING.xs },
  activeOrderText: { fontSize: 13, color: '#1565C0', lineHeight: 18 },
  rateCard: {
    backgroundColor: COLORS.lightGreen, borderRadius: RADIUS.lg, padding: SPACING.xl,
    alignItems: 'center', marginBottom: SPACING.xl,
  },
  rateLabel: { fontSize: 13, color: COLORS.secondary, fontWeight: '600' },
  rateValue: { fontSize: 26, fontWeight: '800', color: COLORS.primaryDark, marginTop: SPACING.xs },
  sectionLabel: { fontSize: 15, fontWeight: '700', color: COLORS.textDark, marginBottom: SPACING.md },
  quickRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  quickBtn: {
    flex: 1, paddingVertical: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.white,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderGray,
  },
  quickBtnActive: { backgroundColor: COLORS.primaryDark, borderColor: COLORS.primaryDark },
  quickText: { fontSize: 14, fontWeight: '700', color: COLORS.textGray },
  quickTextActive: { color: COLORS.white },
  litersInput: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    fontSize: 18, fontWeight: '700', textAlign: 'center', borderWidth: 2, borderColor: COLORS.secondary,
    color: COLORS.textDark, marginBottom: SPACING.xl,
  },
  summaryCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.xl, ...SHADOWS.small, marginBottom: SPACING.xl,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  summaryLabel: { fontSize: 14, color: COLORS.textGray },
  summaryValue: { fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  divider: { height: 1, backgroundColor: COLORS.borderGray, marginVertical: SPACING.sm },
  totalLabel: { fontSize: 16, fontWeight: '700', color: COLORS.primaryDark },
  totalValue: { fontSize: 22, fontWeight: '800', color: COLORS.primaryDark },
  primaryBtn: {
    backgroundColor: COLORS.primaryDark, paddingVertical: SPACING.lg, borderRadius: RADIUS.md, alignItems: 'center', ...SHADOWS.medium,
  },
  primaryBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: COLORS.white, paddingVertical: SPACING.lg, borderRadius: RADIUS.md, alignItems: 'center',
    marginTop: SPACING.md, borderWidth: 1, borderColor: COLORS.primaryDark,
  },
  secondaryBtnText: { color: COLORS.primaryDark, fontSize: 15, fontWeight: '700' },
});

export default PlaceOrderScreen;
