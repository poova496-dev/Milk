// Customer Management Screen
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, Modal, RefreshControl, StatusBar, Switch,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING, RADIUS } from '../config/theme';
import {
  getCustomers, addCustomer, updateCustomer,
  deleteCustomer, toggleCustomerStatus,
} from '../services/customerService';
import { isValidPhone } from '../utils/helpers';

const CustomerScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [form, setForm] = useState({ customer_name: '', mobile_number: '' });

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await getCustomers(showInactive);
      setCustomers(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCustomers();
    }, [showInactive])
  );

  const filteredCustomers = customers.filter(c => {
    const search = searchText.toLowerCase();
    return (
      c.customer_name.toLowerCase().includes(search) ||
      (c.mobile_number && c.mobile_number.includes(search))
    );
  });

  const openAddModal = () => {
    setEditingCustomer(null);
    setForm({ customer_name: '', mobile_number: '' });
    setShowModal(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setForm({
      customer_name: customer.customer_name,
      mobile_number: customer.mobile_number || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.customer_name.trim()) {
      Alert.alert('Validation', 'Customer name is required');
      return;
    }
    if (form.mobile_number && !isValidPhone(form.mobile_number)) {
      Alert.alert('Validation', 'Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.customer_id, {
          ...form,
          is_active: editingCustomer.is_active,
        });
        Alert.alert('Success', 'Customer updated successfully');
      } else {
        await addCustomer(form);
        Alert.alert('Success', 'Customer added successfully');
      }
      setShowModal(false);
      loadCustomers();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save customer');
    }
  };

  const handleDelete = (customer) => {
    Alert.alert(
      'Delete Customer',
      `Are you sure you want to delete "${customer.customer_name}"? This will also delete all their records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCustomer(customer.customer_id);
              Alert.alert('Deleted', 'Customer has been removed');
              loadCustomers();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete customer. They may have linked records.');
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = async (customer) => {
    try {
      await toggleCustomerStatus(customer.customer_id, !customer.is_active);
      loadCustomers();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const renderCustomer = ({ item }) => (
    <View style={[styles.customerCard, !item.is_active && styles.inactiveCard]}>
      <View style={styles.customerInfo}>
        <View style={[styles.avatar, { backgroundColor: item.is_active ? COLORS.lightGreen : '#EEE' }]}>
          <Text style={styles.avatarText}>
            {item.customer_name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.customerDetails}>
          <Text style={styles.customerName}>{item.customer_name}</Text>
          {item.mobile_number ? (
            <Text style={styles.customerPhone}>📞 {item.mobile_number}</Text>
          ) : (
            <Text style={[styles.customerPhone, { color: COLORS.textLight }]}>No phone added</Text>
          )}
          <Text style={[styles.statusBadge, { color: item.is_active ? COLORS.secondary : COLORS.errorRed }]}>
            {item.is_active ? '● Active' : '● Inactive'}
          </Text>
        </View>
      </View>
      <View style={styles.customerActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#E3F2FD' }]}
          onPress={() => openEditModal(item)}
        >
          <Text style={{ fontSize: 16 }}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: item.is_active ? '#FFF3E0' : '#E8F5E9' }]}
          onPress={() => handleToggleStatus(item)}
        >
          <Text style={{ fontSize: 16 }}>{item.is_active ? '🚫' : '✅'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#FFEBEE' }]}
          onPress={() => handleDelete(item)}
        >
          <Text style={{ fontSize: 16 }}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primaryDark} barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, SPACING.lg) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customers</Text>
        <TouchableOpacity onPress={openAddModal} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search by name or phone..."
          placeholderTextColor={COLORS.textLight}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Show inactive toggle */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Show inactive customers</Text>
        <Switch
          value={showInactive}
          onValueChange={setShowInactive}
          trackColor={{ false: '#D9D9D9', true: COLORS.lightGreen }}
          thumbColor={showInactive ? COLORS.secondary : '#999'}
        />
      </View>

      {/* Customer Count */}
      <Text style={styles.countText}>
        {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} found
      </Text>

      {/* Customer List */}
      <FlatList
        data={filteredCustomers}
        renderItem={renderCustomer}
        keyExtractor={(item) => item.customer_id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadCustomers} colors={[COLORS.primaryDark]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>No customers found</Text>
            <Text style={styles.emptySubtext}>Tap "+ Add" to add your first customer</Text>
          </View>
        }
      />

      {/* Add/Edit Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </Text>

            <Text style={styles.inputLabel}>Customer Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter customer name"
              placeholderTextColor={COLORS.textLight}
              value={form.customer_name}
              onChangeText={(text) => setForm({ ...form, customer_name: text })}
              autoFocus
            />

            <Text style={styles.inputLabel}>Mobile Number (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 10-digit mobile number"
              placeholderTextColor={COLORS.textLight}
              value={form.mobile_number}
              onChangeText={(text) => setForm({ ...form, mobile_number: text })}
              keyboardType="phone-pad"
              maxLength={10}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleSave}
              >
                <Text style={styles.saveBtnText}>
                  {editingCustomer ? 'Update' : 'Add Customer'}
                </Text>
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
    backgroundColor: COLORS.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  backBtn: { padding: SPACING.xs },
  backText: { color: COLORS.white, fontSize: 15 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  addBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
  },
  addBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },
  searchContainer: { padding: SPACING.lg, paddingBottom: SPACING.sm },
  searchInput: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    color: COLORS.textDark,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xs,
  },
  filterLabel: { fontSize: 13, color: COLORS.textGray },
  countText: {
    fontSize: 12,
    color: COLORS.textGray,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.sm,
  },
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxxl },
  customerCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  inactiveCard: { opacity: 0.6 },
  customerInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: COLORS.primaryDark },
  customerDetails: { flex: 1 },
  customerName: { fontSize: 16, fontWeight: '600', color: COLORS.textDark },
  customerPhone: { fontSize: 13, color: COLORS.textGray, marginTop: 2 },
  statusBadge: { fontSize: 11, fontWeight: '600', marginTop: 3 },
  customerActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.sm },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 50, marginBottom: SPACING.md },
  emptyText: { fontSize: 16, fontWeight: '600', color: COLORS.textGray },
  emptySubtext: { fontSize: 13, color: COLORS.textLight, marginTop: SPACING.xs },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.xxl,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textGray,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    color: COLORS.textDark,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xxl,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  cancelBtn: { backgroundColor: COLORS.backgroundLight, borderWidth: 1, borderColor: COLORS.borderGray },
  saveBtn: { backgroundColor: COLORS.primaryDark },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.textGray },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.white },
});

export default CustomerScreen;
