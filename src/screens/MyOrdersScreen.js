// My Orders - customer's order list with live status.
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, RefreshControl, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING, RADIUS } from '../config/theme';
import { getOrders } from '../services/orderService';
import { formatCurrency, formatDate, formatTime } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

const STATUS_META = {
  pending: { label: 'Pending', color: COLORS.warningOrange, bg: '#FFF3E0' },
  accepted: { label: 'Accepted - On the way', color: COLORS.secondary, bg: COLORS.lightGreen },
  delivered: { label: 'Delivered', color: COLORS.primaryDark, bg: COLORS.lightGreen },
  cancelled: { label: 'Cancelled', color: COLORS.errorRed, bg: '#FFEBEE' },
};

const MyOrdersScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { customer } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [])
  );

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getOrders({ customer_id: customer.customer_id });
      setOrders(data);
    } catch (error) {
      Alert.alert('Error', 'Could not load your orders');
    } finally {
      setLoading(false);
    }
  };

  const renderOrder = ({ item }) => {
    const meta = STATUS_META[item.status] || STATUS_META.pending;
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.qty}>{parseFloat(item.quantity_liters)} L</Text>
          <View style={[styles.badge, { backgroundColor: meta.bg }]}>
            <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Amount</Text>
          <Text style={styles.value}>{formatCurrency(item.total_amount)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Ordered</Text>
          <Text style={styles.value}>{formatDate(item.ordered_at)} {formatTime(item.ordered_at)}</Text>
        </View>
        {item.status === 'delivered' && item.payment_method && (
          <View style={styles.row}>
            <Text style={styles.label}>Payment</Text>
            <Text style={styles.value}>{item.payment_method}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primaryDark} barStyle="light-content" />
      <View style={[styles.header, { paddingTop: Math.max(insets.top, SPACING.lg) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: 50 }} />
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.order_id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadOrders} colors={[COLORS.primaryDark]} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyText}>No orders yet</Text>
          </View>
        }
      />
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
  listContent: { padding: SPACING.lg },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOWS.small },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  qty: { fontSize: 18, fontWeight: '800', color: COLORS.primaryDark },
  badge: { paddingHorizontal: SPACING.md, paddingVertical: 4, borderRadius: RADIUS.sm },
  badgeText: { fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  label: { fontSize: 13, color: COLORS.textGray },
  value: { fontSize: 13, fontWeight: '600', color: COLORS.textDark },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 50, marginBottom: SPACING.md },
  emptyText: { fontSize: 16, fontWeight: '600', color: COLORS.textGray },
});

export default MyOrdersScreen;
