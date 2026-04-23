// Payment History Screen
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, StatusBar, Modal, ScrollView, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SHADOWS, SPACING, RADIUS } from '../config/theme';
import { getPaymentHistory } from '../services/paymentService';
import { getCustomers } from '../services/customerService';
import { getInvoiceByPaymentId } from '../services/invoiceService';
import { getEntriesForBilling } from '../services/entryService';
import { formatDate, formatTime, formatCurrency, formatLiters, getLogoBase64 } from '../utils/helpers';
import { generateInvoiceHTML } from '../utils/invoiceTemplate';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const PaymentHistoryScreen = ({ navigation }) => {
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerFilter, setShowCustomerFilter] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [customerList, paymentList] = await Promise.all([
        getCustomers(true),
        getPaymentHistory({ customer_id: selectedCustomer?.customer_id }),
      ]);
      setCustomers(customerList);
      setPayments(paymentList);
    } catch (error) {
      Alert.alert('Error', 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [selectedCustomer])
  );

  const handleViewInvoice = async (payment) => {
    try {
      const invoice = await getInvoiceByPaymentId(payment.payment_id);
      if (!invoice) {
        Alert.alert('No Invoice', 'Invoice not found for this payment');
        return;
      }

      const entries = await getEntriesForBilling(
        payment.customer_id,
        payment.bill_start_date,
        payment.bill_end_date
      );

      const logoDataUri = await getLogoBase64();
      const html = generateInvoiceHTML(invoice, entries, logoDataUri);
      const { uri } = await Print.printToFileAsync({ html });
      navigation.navigate('InvoicePreview', {
        invoiceData: invoice,
        entries,
        pdfUri: uri,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load invoice');
    }
  };

  const handleShareInvoice = async (payment) => {
    try {
      const invoice = await getInvoiceByPaymentId(payment.payment_id);
      if (!invoice) {
        Alert.alert('No Invoice', 'Invoice not found for this payment');
        return;
      }

      const entries = await getEntriesForBilling(
        payment.customer_id,
        payment.bill_start_date,
        payment.bill_end_date
      );

      const logoDataUri = await getLogoBase64();
      const html = generateInvoiceHTML(invoice, entries, logoDataUri);
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert('Error', 'Failed to share invoice');
    }
  };

  const handleDownloadInvoice = async (payment) => {
    try {
      const invoice = await getInvoiceByPaymentId(payment.payment_id);
      if (!invoice) {
        Alert.alert('No Invoice', 'Invoice not found');
        return;
      }

      const entries = await getEntriesForBilling(
        payment.customer_id,
        payment.bill_start_date,
        payment.bill_end_date
      );

      const logoDataUri = await getLogoBase64();
      const html = generateInvoiceHTML(invoice, entries, logoDataUri);
      await Print.printAsync({ html });
    } catch (error) {
      Alert.alert('Error', 'Failed to print/download invoice');
    }
  };

  const totalCollected = payments.reduce((sum, p) => sum + parseFloat(p.paid_amount), 0);

  const renderPayment = ({ item }) => {
    const customerName = item.customers?.customer_name || 'Unknown';

    return (
      <View style={styles.paymentCard}>
        <View style={styles.paymentHeader}>
          <View style={styles.customerBadge}>
            <Text style={styles.customerBadgeText}>{customerName}</Text>
          </View>
          <Text style={styles.paymentMethodBadge}>{item.payment_method}</Text>
        </View>

        <View style={styles.paymentDetails}>
          <View style={styles.paymentDetail}>
            <Text style={styles.detailLabel}>📅 Payment Date</Text>
            <Text style={styles.detailValue}>{formatDate(item.payment_date)}</Text>
          </View>
          <View style={styles.paymentDetail}>
            <Text style={styles.detailLabel}>📆 Billing Period</Text>
            <Text style={styles.detailValue}>
              {formatDate(item.bill_start_date)} — {formatDate(item.bill_end_date)}
            </Text>
          </View>
          <View style={styles.paymentDetail}>
            <Text style={styles.detailLabel}>🥛 Total Liters</Text>
            <Text style={styles.detailValue}>{formatLiters(item.total_liters)}</Text>
          </View>
          <View style={styles.paymentDetail}>
            <Text style={styles.detailLabel}>💵 Bill Amount</Text>
            <Text style={styles.detailValue}>{formatCurrency(item.total_amount)}</Text>
          </View>
          <View style={styles.paymentDetail}>
            <Text style={styles.detailLabel}>✅ Paid Amount</Text>
            <Text style={[styles.detailValue, { color: COLORS.secondary, fontWeight: '700', fontSize: 16 }]}>
              {formatCurrency(item.paid_amount)}
            </Text>
          </View>
        </View>

        {item.notes ? (
          <Text style={styles.notesText}>📝 {item.notes}</Text>
        ) : null}

        <View style={styles.invoiceActions}>
          <TouchableOpacity
            style={[styles.invoiceBtn, { backgroundColor: '#E3F2FD' }]}
            onPress={() => handleViewInvoice(item)}
          >
            <Text style={styles.invoiceBtnText}>👁 View</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.invoiceBtn, { backgroundColor: '#E8F5E9' }]}
            onPress={() => handleDownloadInvoice(item)}
          >
            <Text style={styles.invoiceBtnText}>🖨 Print</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.invoiceBtn, { backgroundColor: '#FFF3E0' }]}
            onPress={() => handleShareInvoice(item)}
          >
            <Text style={styles.invoiceBtnText}>📤 Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primaryDark} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment History</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Customer Filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity style={styles.customerFilter} onPress={() => setShowCustomerFilter(true)}>
          <Text style={styles.customerFilterText}>
            {selectedCustomer ? selectedCustomer.customer_name : '👥 All Customers'}
          </Text>
          <Text>▼</Text>
        </TouchableOpacity>
        {selectedCustomer && (
          <TouchableOpacity style={styles.clearFilterBtn} onPress={() => setSelectedCustomer(null)}>
            <Text style={styles.clearFilterText}>✕ Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Summary */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Payments</Text>
          <Text style={styles.summaryValue}>{payments.length}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Collected</Text>
          <Text style={[styles.summaryValue, { color: COLORS.primaryDark }]}>{formatCurrency(totalCollected)}</Text>
        </View>
      </View>

      {/* Payment List */}
      <FlatList
        data={payments}
        renderItem={renderPayment}
        keyExtractor={(item) => item.payment_id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} colors={[COLORS.primaryDark]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💰</Text>
            <Text style={styles.emptyText}>No payments found</Text>
            <Text style={styles.emptySubtext}>Payment records will appear here</Text>
          </View>
        }
      />

      {/* Customer Filter Modal */}
      <Modal visible={showCustomerFilter} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>Filter by Customer</Text>
            <ScrollView style={styles.pickerList}>
              <TouchableOpacity
                style={[styles.pickerItem, !selectedCustomer && styles.pickerItemActive]}
                onPress={() => { setSelectedCustomer(null); setShowCustomerFilter(false); }}
              >
                <Text style={[styles.pickerItemText, !selectedCustomer && { color: COLORS.white }]}>
                  👥 All Customers
                </Text>
              </TouchableOpacity>
              {customers.map((c) => (
                <TouchableOpacity
                  key={c.customer_id}
                  style={[styles.pickerItem, selectedCustomer?.customer_id === c.customer_id && styles.pickerItemActive]}
                  onPress={() => { setSelectedCustomer(c); setShowCustomerFilter(false); }}
                >
                  <Text style={[styles.pickerItemText, selectedCustomer?.customer_id === c.customer_id && { color: COLORS.white }]}>
                    {c.customer_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.pickerCloseBtn} onPress={() => setShowCustomerFilter(false)}>
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
    backgroundColor: COLORS.primaryDark, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg, paddingTop: SPACING.xl,
  },
  backBtn: { padding: SPACING.xs },
  backText: { color: COLORS.white, fontSize: 15 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  filterContainer: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.lg,
    paddingBottom: SPACING.sm, gap: SPACING.sm,
  },
  customerFilter: {
    flex: 1, backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: RADIUS.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.borderGray,
  },
  customerFilterText: { fontSize: 14, fontWeight: '500', color: COLORS.textDark },
  clearFilterBtn: {
    backgroundColor: '#FFEBEE', paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm, borderRadius: RADIUS.sm,
  },
  clearFilterText: { fontSize: 12, color: COLORS.errorRed, fontWeight: '600' },
  summaryBar: {
    flexDirection: 'row', backgroundColor: COLORS.lightGreen,
    marginHorizontal: SPACING.lg, padding: SPACING.md, borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 10, color: COLORS.textGray },
  summaryValue: { fontSize: 15, fontWeight: '700', color: COLORS.textDark, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: COLORS.borderGray },
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxxl },
  paymentCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.lg,
    marginBottom: SPACING.md, ...SHADOWS.small,
  },
  paymentHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SPACING.md,
  },
  customerBadge: {
    backgroundColor: COLORS.lightGreen, paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs, borderRadius: RADIUS.sm,
  },
  customerBadgeText: { fontSize: 13, fontWeight: '600', color: COLORS.primaryDark },
  paymentMethodBadge: {
    fontSize: 12, fontWeight: '600', color: COLORS.secondary,
    backgroundColor: '#E8F5E9', paddingHorizontal: SPACING.sm,
    paddingVertical: 2, borderRadius: RADIUS.sm,
  },
  paymentDetails: { gap: SPACING.xs },
  paymentDetail: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3,
  },
  detailLabel: { fontSize: 12, color: COLORS.textGray },
  detailValue: { fontSize: 13, color: COLORS.textDark, fontWeight: '500' },
  notesText: {
    fontSize: 12, color: COLORS.textGray, fontStyle: 'italic',
    marginTop: SPACING.sm, paddingTop: SPACING.sm,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  invoiceActions: {
    flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md,
    paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  invoiceBtn: {
    flex: 1, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm, alignItems: 'center',
  },
  invoiceBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.textDark },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 50, marginBottom: SPACING.md },
  emptyText: { fontSize: 16, fontWeight: '600', color: COLORS.textGray },
  emptySubtext: { fontSize: 13, color: COLORS.textLight, marginTop: SPACING.xs },
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  pickerModal: {
    backgroundColor: COLORS.white, borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl, padding: SPACING.xl, maxHeight: '60%',
  },
  pickerTitle: {
    fontSize: 18, fontWeight: '700', color: COLORS.primaryDark,
    textAlign: 'center', marginBottom: SPACING.lg,
  },
  pickerList: { maxHeight: 350 },
  pickerItem: {
    padding: SPACING.lg, borderRadius: RADIUS.md, marginBottom: SPACING.sm,
    backgroundColor: COLORS.backgroundLight,
  },
  pickerItemActive: { backgroundColor: COLORS.primaryDark },
  pickerItemText: { fontSize: 15, fontWeight: '600', color: COLORS.textDark },
  pickerCloseBtn: { padding: SPACING.md, alignItems: 'center', marginTop: SPACING.md },
  pickerCloseBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.textGray },
});

export default PaymentHistoryScreen;
