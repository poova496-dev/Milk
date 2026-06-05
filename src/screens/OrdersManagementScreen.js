// Orders Management (Seller) - accept incoming orders, open delivery location,
// mark delivered and choose payment (Cash / UPI / Billing).
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, RefreshControl, Alert, Modal, Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING, RADIUS } from '../config/theme';
import { getOrders, acceptOrder, cancelOrder, deliverOrder } from '../services/orderService';
import { openInMaps } from '../utils/location';
import { formatCurrency, formatDate, formatTime } from '../utils/helpers';

const TABS = [
  { key: 'pending', label: 'New' },
  { key: 'accepted', label: 'To Deliver' },
  { key: 'delivered', label: 'Delivered' },
];

const PAYMENT_METHODS = ['Cash', 'UPI', 'Billing'];

const OrdersManagementScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState(route.params?.initialTab || 'pending');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [deliverTarget, setDeliverTarget] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const initial = route.params?.initialTab;
      if (initial) {
        setTab(initial);
        navigation.setParams({ initialTab: undefined });
      }
    }, [route.params?.initialTab, navigation])
  );

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [tab])
  );

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getOrders({ status: tab });
      setOrders(data);
    } catch (error) {
      Alert.alert('Error', 'Could not load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (order) => {
    try {
      setBusyId(order.order_id);
      await acceptOrder(order.order_id);
      await loadOrders();
    } catch (error) {
      Alert.alert('Error', 'Could not accept the order');
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = (order) => {
    Alert.alert('Cancel Order', `Cancel ${parseFloat(order.quantity_liters)} L order for ${order.customer_name}?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            setBusyId(order.order_id);
            await cancelOrder(order.order_id);
            await loadOrders();
          } catch (e) {
            Alert.alert('Error', 'Could not cancel');
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  };

  const handleDeliverWithMethod = async (method) => {
    const order = deliverTarget;
    setDeliverTarget(null);
    try {
      setBusyId(order.order_id);
      await deliverOrder(order, method);
      Alert.alert('Delivered', `Order marked delivered. Payment: ${method}${method === 'Billing' ? ' (added to account)' : ''}.`);
      await loadOrders();
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not complete delivery');
    } finally {
      setBusyId(null);
    }
  };

  const callCustomer = (phone) => {
    if (!phone) {
      Alert.alert('No phone number', 'This customer has no saved phone number.');
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const renderOrder = ({ item }) => {
    const busy = busyId === item.order_id;
    const hasLoc = item.latitude != null && item.longitude != null;
    const phone = item.customers?.mobile_number;
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.customer}>{item.customer_name}</Text>
          <Text style={styles.qty}>{parseFloat(item.quantity_liters)} L</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Amount</Text>
          <Text style={styles.value}>{formatCurrency(item.total_amount)} ({formatCurrency(item.rate_per_liter)}/L)</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Ordered</Text>
          <Text style={styles.value}>{formatDate(item.ordered_at)} {formatTime(item.ordered_at)}</Text>
        </View>
        {item.status === 'delivered' && (
          <View style={styles.row}>
            <Text style={styles.label}>Payment</Text>
            <Text style={[styles.value, { color: COLORS.secondary, fontWeight: '700' }]}>{item.payment_method}</Text>
          </View>
        )}

        {/* Actions per status */}
        {item.status === 'pending' && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: COLORS.secondary }, busy && { opacity: 0.6 }]}
              onPress={() => handleAccept(item)}
              disabled={busy}
            >
              <Text style={styles.actionText}>✓ Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: COLORS.errorRed }, busy && { opacity: 0.6 }]}
              onPress={() => handleCancel(item)}
              disabled={busy}
            >
              <Text style={styles.actionText}>✕ Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status === 'accepted' && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: phone ? '#1565C0' : COLORS.textLight }]}
              onPress={() => callCustomer(phone)}
            >
              <Text style={styles.actionText}>📞 Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: hasLoc ? COLORS.primaryDark : COLORS.textLight }]}
              onPress={() => hasLoc ? openInMaps(item.latitude, item.longitude, item.customer_name) : Alert.alert('No location', 'This order has no saved location.')}
            >
              <Text style={styles.actionText}>📍 Map</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: COLORS.secondary }, busy && { opacity: 0.6 }]}
              onPress={() => setDeliverTarget(item)}
              disabled={busy}
            >
              <Text style={styles.actionText}>🚚 Delivered</Text>
            </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Orders</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.order_id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadOrders} colors={[COLORS.primaryDark]} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>No {TABS.find((t) => t.key === tab)?.label.toLowerCase()} orders</Text>
          </View>
        }
      />

      {/* Payment method modal */}
      <Modal visible={!!deliverTarget} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>How was it paid?</Text>
            {deliverTarget && (
              <Text style={styles.modalSub}>
                {deliverTarget.customer_name} • {parseFloat(deliverTarget.quantity_liters)} L • {formatCurrency(deliverTarget.total_amount)}
              </Text>
            )}
            <View style={{ gap: SPACING.md, marginTop: SPACING.lg }}>
              {PAYMENT_METHODS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.methodBtn, m === 'Billing' && { backgroundColor: COLORS.warningOrange }]}
                  onPress={() => handleDeliverWithMethod(m)}
                >
                  <Text style={styles.methodText}>
                    {m === 'Cash' ? '💵 Cash' : m === 'UPI' ? '📱 UPI' : '🧾 Billing (add to account)'}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setDeliverTarget(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  tabRow: { flexDirection: 'row', padding: SPACING.lg, gap: SPACING.sm },
  tabBtn: {
    flex: 1, paddingVertical: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.white,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderGray,
  },
  tabBtnActive: { backgroundColor: COLORS.primaryDark, borderColor: COLORS.primaryDark },
  tabText: { fontSize: 13, fontWeight: '700', color: COLORS.textGray },
  tabTextActive: { color: COLORS.white },
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxxl },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOWS.small },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  customer: { fontSize: 16, fontWeight: '700', color: COLORS.primaryDark },
  qty: { fontSize: 18, fontWeight: '800', color: COLORS.secondary },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  label: { fontSize: 13, color: COLORS.textGray },
  value: { fontSize: 13, fontWeight: '600', color: COLORS.textDark },
  actions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  actionBtn: { flex: 1, paddingVertical: SPACING.md, paddingHorizontal: 2, borderRadius: RADIUS.md, alignItems: 'center' },
  actionText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 50, marginBottom: SPACING.md },
  emptyText: { fontSize: 16, fontWeight: '600', color: COLORS.textGray },
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'center', padding: SPACING.xl },
  modalCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.xxl },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.primaryDark, textAlign: 'center' },
  modalSub: { fontSize: 13, color: COLORS.textGray, textAlign: 'center', marginTop: SPACING.xs },
  methodBtn: { backgroundColor: COLORS.primaryDark, paddingVertical: SPACING.lg, borderRadius: RADIUS.md, alignItems: 'center' },
  methodText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  cancelBtn: { paddingVertical: SPACING.md, alignItems: 'center' },
  cancelText: { color: COLORS.textGray, fontSize: 14, fontWeight: '600' },
});

export default OrdersManagementScreen;
