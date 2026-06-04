// Daily Milk Entry Screen
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, ScrollView, StatusBar, Platform, Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING, RADIUS } from '../config/theme';
import { getCustomers } from '../services/customerService';
import { getActiveRate } from '../services/rateService';
import { addDailyEntry } from '../services/entryService';
import { formatDate, formatDateDB, calculateAmount, formatCurrency } from '../utils/helpers';

const QUANTITY_OPTIONS = [
  { label: '¼ L', value: 0.25, display: '0.25' },
  { label: '½ L', value: 0.5, display: '0.5' },
  { label: '1 L', value: 1, display: '1' },
  { label: '1.75 L', value: 1.75, display: '1.75' },
];

const DailyEntryScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [entryDate, setEntryDate] = useState(new Date());
  const [selectedQty, setSelectedQty] = useState(null);
  const [customQty, setCustomQty] = useState('');
  const [activeRate, setActiveRate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadData = async () => {
    try {
      const [customerList, rate] = await Promise.all([
        getCustomers(),
        getActiveRate(),
      ]);

      setCustomers(customerList);

      // Auto-select if only one customer
      if (customerList.length === 1) {
        setSelectedCustomer(customerList[0]);
      }

      if (rate) {
        setActiveRate(rate);
      } else {
        Alert.alert('No Rate Set', 'Please set a milk rate first before making entries.', [
          { text: 'Set Rate', onPress: () => navigation.navigate('FixedRate') },
          { text: 'Cancel', style: 'cancel' },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
      // Reset form
      setSelectedQty(null);
      setCustomQty('');
    }, [])
  );

  const getQuantity = () => {
    if (customQty && parseFloat(customQty) > 0) return parseFloat(customQty);
    if (selectedQty !== null) return selectedQty;
    return 0;
  };

  const getTotalAmount = () => {
    const qty = getQuantity();
    if (!qty || !activeRate) return 0;
    return calculateAmount(qty, activeRate.rate_per_liter);
  };

  const handleQuantitySelect = (value) => {
    setSelectedQty(value);
    setCustomQty('');
  };

  const handleCustomQtyChange = (text) => {
    setCustomQty(text);
    if (text) setSelectedQty(null);
  };

  const handleSave = async () => {
    if (!selectedCustomer) {
      Alert.alert('Validation', 'Please select a customer');
      return;
    }
    const qty = getQuantity();
    if (!qty || qty <= 0) {
      Alert.alert('Validation', 'Please select or enter milk quantity');
      return;
    }
    if (!activeRate) {
      Alert.alert('Validation', 'No active rate found. Please set a rate first.');
      return;
    }

    const totalAmount = getTotalAmount();

    Alert.alert(
      'Confirm Entry',
      `Customer: ${selectedCustomer.customer_name}\nDate: ${formatDate(entryDate)}\nQuantity: ${qty} L\nRate: ${formatCurrency(activeRate.rate_per_liter)}/L\nTotal: ${formatCurrency(totalAmount)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async () => {
            try {
              setSaving(true);
              await addDailyEntry({
                customer_id: selectedCustomer.customer_id,
                customer_name: selectedCustomer.customer_name,
                entry_date: formatDateDB(entryDate),
                milk_type_selected: customQty ? 'custom' : String(selectedQty),
                quantity_liters: qty,
                rate_per_liter_used: activeRate.rate_per_liter,
                total_amount: totalAmount,
              });

              Alert.alert('✅ Saved!', `${qty}L milk entry saved for ${selectedCustomer.customer_name}`, [
                { text: 'Add Another', onPress: () => { setSelectedQty(null); setCustomQty(''); } },
                { text: 'Go Home', onPress: () => navigation.navigate('Dashboard') },
              ]);
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to save entry');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  // Simple date picker using text input
  const handleDateChange = (daysOffset) => {
    const newDate = new Date(entryDate);
    newDate.setDate(newDate.getDate() + daysOffset);
    // Don't allow future dates
    if (newDate <= new Date()) {
      setEntryDate(newDate);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primaryDark} barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, SPACING.lg) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Milk Entry</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Customer Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Customer *</Text>
          {customers.length === 1 ? (
            <View style={styles.autoSelectedCard}>
              <Text style={styles.autoSelectedName}>{customers[0].customer_name}</Text>
              <Text style={styles.autoSelectedBadge}>Auto-selected</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowCustomerPicker(true)}
            >
              <Text style={selectedCustomer ? styles.selectorText : styles.selectorPlaceholder}>
                {selectedCustomer ? selectedCustomer.customer_name : 'Select Customer...'}
              </Text>
              <Text style={styles.selectorArrow}>▼</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Entry Date</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateArrowBtn}
              onPress={() => handleDateChange(-1)}
            >
              <Text style={styles.dateArrowText}>◀</Text>
            </TouchableOpacity>
            <View style={styles.dateDisplay}>
              <Text style={styles.dateText}>📅 {formatDate(entryDate)}</Text>
            </View>
            <TouchableOpacity
              style={[styles.dateArrowBtn, entryDate >= new Date() && { opacity: 0.3 }]}
              onPress={() => handleDateChange(1)}
              disabled={entryDate.toDateString() === new Date().toDateString()}
            >
              <Text style={styles.dateArrowText}>▶</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.todayBtn}
            onPress={() => setEntryDate(new Date())}
          >
            <Text style={styles.todayBtnText}>Set to Today</Text>
          </TouchableOpacity>
        </View>

        {/* Quantity Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Milk Quantity *</Text>
          <View style={styles.qtyGrid}>
            {QUANTITY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.qtyButton,
                  selectedQty === opt.value && styles.qtyButtonActive,
                ]}
                onPress={() => handleQuantitySelect(opt.value)}
              >
                <Text style={[
                  styles.qtyButtonText,
                  selectedQty === opt.value && styles.qtyButtonTextActive,
                ]}>
                  {opt.label}
                </Text>
                <Text style={[
                  styles.qtyButtonSub,
                  selectedQty === opt.value && { color: COLORS.white },
                ]}>
                  {opt.display} Liter
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.orText}>— OR enter custom quantity —</Text>

          <TextInput
            style={[styles.customInput, customQty ? styles.customInputActive : null]}
            placeholder="Enter custom quantity (e.g., 2.5)"
            placeholderTextColor={COLORS.textLight}
            value={customQty}
            onChangeText={handleCustomQtyChange}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Rate Display */}
        {activeRate && (
          <View style={styles.rateCard}>
            <Text style={styles.rateLabel}>Current Rate</Text>
            <Text style={styles.rateValue}>{formatCurrency(activeRate.rate_per_liter)} / Liter</Text>
          </View>
        )}

        {/* Amount Summary */}
        {getQuantity() > 0 && activeRate && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Quantity</Text>
              <Text style={styles.summaryValue}>{getQuantity()} L</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Rate</Text>
              <Text style={styles.summaryValue}>{formatCurrency(activeRate.rate_per_liter)}/L</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>{formatCurrency(getTotalAmount())}</Text>
            </View>
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : '✅ Save Entry'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Customer Picker Modal */}
      <Modal visible={showCustomerPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>Select Customer</Text>
            <ScrollView style={styles.pickerList}>
              {customers.map((customer) => (
                <TouchableOpacity
                  key={customer.customer_id}
                  style={[
                    styles.pickerItem,
                    selectedCustomer?.customer_id === customer.customer_id && styles.pickerItemActive,
                  ]}
                  onPress={() => {
                    setSelectedCustomer(customer);
                    setShowCustomerPicker(false);
                  }}
                >
                  <Text style={[
                    styles.pickerItemText,
                    selectedCustomer?.customer_id === customer.customer_id && { color: COLORS.white },
                  ]}>
                    {customer.customer_name}
                  </Text>
                  {customer.mobile_number && (
                    <Text style={[
                      styles.pickerItemPhone,
                      selectedCustomer?.customer_id === customer.customer_id && { color: 'rgba(255,255,255,0.7)' },
                    ]}>
                      📞 {customer.mobile_number}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.pickerCloseBtn}
              onPress={() => setShowCustomerPicker(false)}
            >
              <Text style={styles.pickerCloseBtnText}>Close</Text>
            </TouchableOpacity>
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
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.lg },
  section: { marginBottom: SPACING.xl },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
  },
  autoSelectedCard: {
    backgroundColor: COLORS.lightGreen,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  autoSelectedName: { fontSize: 16, fontWeight: '600', color: COLORS.primaryDark },
  autoSelectedBadge: { fontSize: 11, color: COLORS.secondary, fontWeight: '600' },
  selector: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorText: { fontSize: 15, color: COLORS.textDark, fontWeight: '500' },
  selectorPlaceholder: { fontSize: 15, color: COLORS.textLight },
  selectorArrow: { fontSize: 12, color: COLORS.textGray },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dateArrowBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateArrowText: { fontSize: 16, color: COLORS.primaryDark },
  dateDisplay: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderGray,
  },
  dateText: { fontSize: 16, fontWeight: '600', color: COLORS.textDark },
  todayBtn: { alignSelf: 'center', marginTop: SPACING.sm },
  todayBtnText: { fontSize: 13, color: COLORS.secondary, fontWeight: '600' },
  qtyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  qtyButton: {
    flex: 1,
    minWidth: '40%',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.borderGray,
  },
  qtyButtonActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
  },
  qtyButtonText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  qtyButtonTextActive: { color: COLORS.white },
  qtyButtonSub: {
    fontSize: 11,
    color: COLORS.textGray,
    marginTop: 2,
  },
  orText: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textLight,
    marginVertical: SPACING.md,
  },
  customInput: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    textAlign: 'center',
    color: COLORS.textDark,
  },
  customInputActive: {
    borderColor: COLORS.secondary,
    borderWidth: 2,
  },
  rateCard: {
    backgroundColor: COLORS.lightGreen,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  rateLabel: { fontSize: 14, color: COLORS.textGray },
  rateValue: { fontSize: 16, fontWeight: '700', color: COLORS.primaryDark },
  summaryCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: COLORS.lightGreen,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  summaryLabel: { fontSize: 14, color: COLORS.textGray },
  summaryValue: { fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  divider: { height: 1, backgroundColor: COLORS.borderGray, marginVertical: SPACING.sm },
  totalLabel: { fontSize: 16, fontWeight: '700', color: COLORS.primaryDark },
  totalValue: { fontSize: 20, fontWeight: '700', color: COLORS.primaryDark },
  saveButton: {
    backgroundColor: COLORS.primaryDark,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  saveButtonText: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
    maxHeight: '70%',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primaryDark,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  pickerList: { maxHeight: 400 },
  pickerItem: {
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.backgroundLight,
  },
  pickerItemActive: { backgroundColor: COLORS.primaryDark },
  pickerItemText: { fontSize: 15, fontWeight: '600', color: COLORS.textDark },
  pickerItemPhone: { fontSize: 12, color: COLORS.textGray, marginTop: 2 },
  pickerCloseBtn: {
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  pickerCloseBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.textGray },
});

export default DailyEntryScreen;
