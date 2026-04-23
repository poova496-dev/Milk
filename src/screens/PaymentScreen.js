// Payment Screen - Generate bills and collect payments
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, StatusBar, Modal, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SHADOWS, SPACING, RADIUS } from '../config/theme';
import { getCustomers } from '../services/customerService';
import { getEntriesForBilling } from '../services/entryService';
import { getLastPaymentDate, savePayment, checkDuplicatePayment } from '../services/paymentService';
import { generateInvoiceNumber, saveInvoice } from '../services/invoiceService';
import { formatDate, formatDateDB, formatCurrency, formatLiters, getLogoBase64 } from '../utils/helpers';
import { generateInvoiceHTML } from '../utils/invoiceTemplate';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const PaymentScreen = ({ navigation }) => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(new Date());
  const [entries, setEntries] = useState([]);
  const [totalLiters, setTotalLiters] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [calculated, setCalculated] = useState(false);
  const [successData, setSuccessData] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadCustomers();
    }, [])
  );

  const loadCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
      if (data.length === 1) {
        handleCustomerSelect(data[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load customers');
    }
  };

  const handleCustomerSelect = async (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerPicker(false);
    setCalculated(false);

    try {
      // Get last payment date to determine bill start
      const lastPaidDate = await getLastPaymentDate(customer.customer_id);
      if (lastPaidDate) {
        const nextDay = new Date(lastPaidDate);
        nextDay.setDate(nextDay.getDate() + 1);
        setStartDate(nextDay);
      } else {
        // No previous payments, get earliest entry date
        const allEntries = await getEntriesForBilling(customer.customer_id, '2000-01-01', formatDateDB(new Date()));
        if (allEntries.length > 0) {
          setStartDate(new Date(allEntries[0].entry_date));
        } else {
          setStartDate(new Date());
        }
      }
      setEndDate(new Date());
    } catch (error) {
      Alert.alert('Error', 'Failed to load payment info');
    }
  };

  const calculateBill = async () => {
    if (!selectedCustomer || !startDate) return;

    try {
      setLoading(true);
      const billEntries = await getEntriesForBilling(
        selectedCustomer.customer_id,
        formatDateDB(startDate),
        formatDateDB(endDate)
      );

      setEntries(billEntries);
      const liters = billEntries.reduce((sum, e) => sum + parseFloat(e.quantity_liters), 0);
      const amount = billEntries.reduce((sum, e) => sum + parseFloat(e.total_amount), 0);
      setTotalLiters(liters);
      setTotalAmount(amount);
      setPaidAmount(String(amount.toFixed(2)));
      setCalculated(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to calculate bill');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (type, daysOffset) => {
    if (type === 'start') {
      const newDate = new Date(startDate);
      newDate.setDate(newDate.getDate() + daysOffset);
      setStartDate(newDate);
      setCalculated(false);
    } else {
      const newDate = new Date(endDate);
      newDate.setDate(newDate.getDate() + daysOffset);
      if (newDate <= new Date()) {
        setEndDate(newDate);
        setCalculated(false);
      }
    }
  };

  const handlePayment = async () => {
    if (!calculated || entries.length === 0) {
      Alert.alert('No Bill', 'Please calculate the bill first');
      return;
    }

    const paid = parseFloat(paidAmount) || 0;
    if (paid <= 0) {
      Alert.alert('Validation', 'Please enter paid amount');
      return;
    }

    // Check for duplicate
    const isDuplicate = await checkDuplicatePayment(
      selectedCustomer.customer_id,
      formatDateDB(startDate),
      formatDateDB(endDate)
    );

    if (isDuplicate) {
      Alert.alert(
        'Duplicate Payment',
        'A payment already exists for this billing period. Continue anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => processPayment(paid) },
        ]
      );
    } else {
      processPayment(paid);
    }
  };

  const processPayment = async (paid) => {
    try {
      setLoading(true);

      // Generate invoice number
      const invoiceNumber = await generateInvoiceNumber();

      // Save payment
      const payment = await savePayment({
        customer_id: selectedCustomer.customer_id,
        bill_start_date: formatDateDB(startDate),
        bill_end_date: formatDateDB(endDate),
        total_liters: totalLiters,
        total_amount: totalAmount,
        paid_amount: paid,
        payment_method: paymentMethod,
        notes: notes,
      });

      // Save invoice
      const invoiceData = {
        invoice_number: invoiceNumber,
        payment_id: payment.payment_id,
        customer_id: selectedCustomer.customer_id,
        customer_name: selectedCustomer.customer_name,
        invoice_date: formatDateDB(new Date()),
        bill_start_date: formatDateDB(startDate),
        bill_end_date: formatDateDB(endDate),
        total_liters: totalLiters,
        total_amount: totalAmount,
        paid_amount: paid,
      };

      await saveInvoice(invoiceData);

      // Generate and show invoice
      const logoDataUri = await getLogoBase64();
      const html = generateInvoiceHTML(invoiceData, entries, logoDataUri);

      // Create PDF for sharing/viewing
      const { uri } = await Print.printToFileAsync({ html });

      // Reset form
      setCalculated(false);
      setEntries([]);
      setTotalLiters(0);
      setTotalAmount(0);
      setPaidAmount('');
      setNotes('');
      
      // Reload customer to update the next billing start date
      if (selectedCustomer) {
        handleCustomerSelect(selectedCustomer);
      }

      // Show success modal
      setSuccessData({ invoiceData, entries, html, uri, paid });
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save payment');
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = ['Cash', 'UPI', 'Bank Transfer', 'Other'];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primaryDark} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Customer Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Select Customer *</Text>
          {customers.length === 1 ? (
            <View style={styles.autoSelectedCard}>
              <Text style={styles.autoSelectedName}>{customers[0].customer_name}</Text>
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

        {/* Date Range */}
        {selectedCustomer && startDate && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Bill Start Date</Text>
              <View style={styles.dateRow}>
                <TouchableOpacity style={styles.dateArrowBtn} onPress={() => handleDateChange('start', -1)}>
                  <Text style={styles.dateArrowText}>◀</Text>
                </TouchableOpacity>
                <View style={styles.dateDisplay}>
                  <Text style={styles.dateText}>📅 {formatDate(startDate)}</Text>
                </View>
                <TouchableOpacity style={styles.dateArrowBtn} onPress={() => handleDateChange('start', 1)}>
                  <Text style={styles.dateArrowText}>▶</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Bill End Date</Text>
              <View style={styles.dateRow}>
                <TouchableOpacity style={styles.dateArrowBtn} onPress={() => handleDateChange('end', -1)}>
                  <Text style={styles.dateArrowText}>◀</Text>
                </TouchableOpacity>
                <View style={styles.dateDisplay}>
                  <Text style={styles.dateText}>📅 {formatDate(endDate)}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.dateArrowBtn, endDate >= new Date() && { opacity: 0.3 }]}
                  onPress={() => handleDateChange('end', 1)}
                >
                  <Text style={styles.dateArrowText}>▶</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Calculate Button */}
            <TouchableOpacity
              style={[styles.calcButton, loading && { opacity: 0.6 }]}
              onPress={calculateBill}
              disabled={loading}
            >
              <Text style={styles.calcButtonText}>
                {loading ? 'Calculating...' : '🧮 Calculate Bill'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Bill Summary */}
        {calculated && (
          <>
            <View style={styles.billCard}>
              <Text style={styles.billHeader}>📋 Bill Summary</Text>
              <Text style={styles.billPeriod}>
                {formatDate(startDate)} — {formatDate(endDate)}
              </Text>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Total Entries</Text>
                <Text style={styles.billValue}>{entries.length}</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Total Liters</Text>
                <Text style={styles.billValue}>{formatLiters(totalLiters)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.billRow}>
                <Text style={styles.billTotalLabel}>Total Amount</Text>
                <Text style={styles.billTotalValue}>{formatCurrency(totalAmount)}</Text>
              </View>
            </View>

            {entries.length > 0 && (
              <>
                {/* Payment Method */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Payment Method</Text>
                  <View style={styles.methodRow}>
                    {paymentMethods.map((method) => (
                      <TouchableOpacity
                        key={method}
                        style={[styles.methodBtn, paymentMethod === method && styles.methodBtnActive]}
                        onPress={() => setPaymentMethod(method)}
                      >
                        <Text style={[styles.methodText, paymentMethod === method && styles.methodTextActive]}>
                          {method}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Paid Amount */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Paid Amount (₹)</Text>
                  <TextInput
                    style={styles.paidInput}
                    value={paidAmount}
                    onChangeText={setPaidAmount}
                    keyboardType="decimal-pad"
                    placeholder="Enter paid amount"
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>

                {/* Notes */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Notes (Optional)</Text>
                  <TextInput
                    style={[styles.paidInput, { height: 60, textAlignVertical: 'top' }]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Add payment notes..."
                    placeholderTextColor={COLORS.textLight}
                    multiline
                  />
                </View>

                {/* Save Payment Button */}
                <TouchableOpacity
                  style={[styles.payButton, loading && { opacity: 0.6 }]}
                  onPress={handlePayment}
                  disabled={loading}
                >
                  <Text style={styles.payButtonText}>
                    {loading ? 'Processing...' : '💰 Save Payment & Generate Invoice'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {entries.length === 0 && (
              <View style={styles.noEntriesCard}>
                <Text style={styles.noEntriesText}>No milk entries found for this period</Text>
              </View>
            )}
          </>
        )}

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
                  style={[styles.pickerItem, selectedCustomer?.customer_id === customer.customer_id && styles.pickerItemActive]}
                  onPress={() => handleCustomerSelect(customer)}
                >
                  <Text style={[styles.pickerItemText, selectedCustomer?.customer_id === customer.customer_id && { color: COLORS.white }]}>
                    {customer.customer_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.pickerCloseBtn} onPress={() => setShowCustomerPicker(false)}>
              <Text style={styles.pickerCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Success Modal */}
      <Modal visible={!!successData} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.pickerModal, { alignItems: 'center', padding: SPACING.xxl }]}>
            <Text style={{ fontSize: 50, marginBottom: SPACING.md }}>✅</Text>
            <Text style={styles.pickerTitle}>Payment Saved!</Text>
            <Text style={{ textAlign: 'center', color: COLORS.textGray, marginBottom: SPACING.xl }}>
              Payment of {successData ? formatCurrency(successData.paid) : ''} collected.
            </Text>
            
            <View style={{ width: '100%', gap: SPACING.md }}>
              <TouchableOpacity
                style={[styles.payButton, { marginTop: 0 }]}
                onPress={() => {
                  navigation.navigate('InvoicePreview', {
                    invoiceData: successData.invoiceData,
                    entries: successData.entries,
                    pdfUri: successData.uri,
                  });
                  setSuccessData(null);
                }}
              >
                <Text style={styles.payButtonText}>👁️ View Invoice</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.payButton, { marginTop: 0, backgroundColor: COLORS.secondary }]}
                onPress={() => Sharing.shareAsync(successData.uri)}
              >
                <Text style={styles.payButtonText}>📤 Share Invoice</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.payButton, { marginTop: 0, backgroundColor: COLORS.textLight }]}
                onPress={() => {
                  setSuccessData(null);
                  navigation.navigate('Dashboard');
                }}
              >
                <Text style={styles.payButtonText}>Done</Text>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.lg, paddingTop: SPACING.xl,
  },
  backBtn: { padding: SPACING.xs },
  backText: { color: COLORS.white, fontSize: 15 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.lg },
  section: { marginBottom: SPACING.lg },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textDark, marginBottom: SPACING.sm },
  autoSelectedCard: {
    backgroundColor: COLORS.lightGreen, padding: SPACING.lg, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.secondary,
  },
  autoSelectedName: { fontSize: 16, fontWeight: '600', color: COLORS.primaryDark },
  selector: {
    backgroundColor: COLORS.white, padding: SPACING.lg, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.borderGray,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  selectorText: { fontSize: 15, color: COLORS.textDark, fontWeight: '500' },
  selectorPlaceholder: { fontSize: 15, color: COLORS.textLight },
  selectorArrow: { fontSize: 12, color: COLORS.textGray },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  dateArrowBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.lightGreen,
    justifyContent: 'center', alignItems: 'center',
  },
  dateArrowText: { fontSize: 14, color: COLORS.primaryDark },
  dateDisplay: {
    flex: 1, backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: RADIUS.md,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderGray,
  },
  dateText: { fontSize: 15, fontWeight: '600', color: COLORS.textDark },
  calcButton: {
    backgroundColor: COLORS.secondary, paddingVertical: SPACING.lg,
    borderRadius: RADIUS.md, alignItems: 'center', marginBottom: SPACING.xl, ...SHADOWS.small,
  },
  calcButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  billCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.xl,
    marginBottom: SPACING.lg, ...SHADOWS.medium, borderWidth: 2, borderColor: COLORS.lightGreen,
  },
  billHeader: { fontSize: 18, fontWeight: '700', color: COLORS.primaryDark, marginBottom: SPACING.xs },
  billPeriod: { fontSize: 13, color: COLORS.textGray, marginBottom: SPACING.lg },
  billRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm,
  },
  billLabel: { fontSize: 14, color: COLORS.textGray },
  billValue: { fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  divider: { height: 1, backgroundColor: COLORS.borderGray, marginVertical: SPACING.sm },
  billTotalLabel: { fontSize: 16, fontWeight: '700', color: COLORS.primaryDark },
  billTotalValue: { fontSize: 22, fontWeight: '800', color: COLORS.primaryDark },
  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  methodBtn: {
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.md,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.borderGray,
  },
  methodBtnActive: { backgroundColor: COLORS.primaryDark, borderColor: COLORS.primaryDark },
  methodText: { fontSize: 13, fontWeight: '600', color: COLORS.textGray },
  methodTextActive: { color: COLORS.white },
  paidInput: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, fontSize: 18, fontWeight: '700',
    borderWidth: 2, borderColor: COLORS.secondary, textAlign: 'center', color: COLORS.textDark,
  },
  payButton: {
    backgroundColor: COLORS.primaryDark, paddingVertical: SPACING.lg, borderRadius: RADIUS.md,
    alignItems: 'center', ...SHADOWS.medium, marginTop: SPACING.md,
  },
  payButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  noEntriesCard: {
    backgroundColor: '#FFF3E0', padding: SPACING.xl, borderRadius: RADIUS.md, alignItems: 'center',
  },
  noEntriesText: { fontSize: 14, color: '#E65100', fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  pickerModal: {
    backgroundColor: COLORS.white, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl, maxHeight: '60%',
  },
  pickerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.primaryDark, textAlign: 'center', marginBottom: SPACING.lg },
  pickerList: { maxHeight: 350 },
  pickerItem: {
    padding: SPACING.lg, borderRadius: RADIUS.md, marginBottom: SPACING.sm, backgroundColor: COLORS.backgroundLight,
  },
  pickerItemActive: { backgroundColor: COLORS.primaryDark },
  pickerItemText: { fontSize: 15, fontWeight: '600', color: COLORS.textDark },
  pickerCloseBtn: { padding: SPACING.md, alignItems: 'center', marginTop: SPACING.md },
  pickerCloseBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.textGray },
});

export default PaymentScreen;
