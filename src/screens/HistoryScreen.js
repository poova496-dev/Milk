// History Screen - View daily milk entry history with filters
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, StatusBar, Modal, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SHADOWS, SPACING, RADIUS } from '../config/theme';
import { getDailyEntries, deleteEntry } from '../services/entryService';
import { getCustomers } from '../services/customerService';
import { formatDate, formatTime, formatCurrency, formatLiters, getMilkTypeLabel, formatDateDB } from '../utils/helpers';
import { Alert } from 'react-native';

const HistoryScreen = ({ navigation }) => {
  const [entries, setEntries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerFilter, setShowCustomerFilter] = useState(false);
  const [dateRange, setDateRange] = useState('all'); // 'today', 'week', 'month', 'all'

  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return { startDate: formatDateDB(now), endDate: formatDateDB(now) };
      case 'week': {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { startDate: formatDateDB(weekAgo), endDate: formatDateDB(now) };
      }
      case 'month': {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return { startDate: formatDateDB(monthStart), endDate: formatDateDB(now) };
      }
      default:
        return {};
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [customerList, entryList] = await Promise.all([
        getCustomers(true),
        getDailyEntries({
          customer_id: selectedCustomer?.customer_id || undefined,
          ...getDateFilter(),
        }),
      ]);
      setCustomers(customerList);
      setEntries(entryList);
    } catch (error) {
      Alert.alert('Error', 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [selectedCustomer, dateRange])
  );

  // Summary calculations
  const totalLiters = entries.reduce((sum, e) => sum + parseFloat(e.quantity_liters), 0);
  const totalAmount = entries.reduce((sum, e) => sum + parseFloat(e.total_amount), 0);

  const handleDeleteEntry = (entry) => {
    Alert.alert(
      'Delete Entry',
      `Delete this ${formatLiters(entry.quantity_liters)} entry for ${entry.customer_name} on ${formatDate(entry.entry_date)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEntry(entry.entry_id);
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete entry');
            }
          },
        },
      ]
    );
  };

  const renderEntry = ({ item }) => (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <View style={styles.entryCustomerBadge}>
          <Text style={styles.entryCustomerText}>{item.customer_name}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDeleteEntry(item)}>
          <Text style={{ fontSize: 16 }}>🗑️</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.entryDetails}>
        <View style={styles.entryDetail}>
          <Text style={styles.detailLabel}>📅 Date</Text>
          <Text style={styles.detailValue}>{formatDate(item.entry_date)}</Text>
        </View>
        <View style={styles.entryDetail}>
          <Text style={styles.detailLabel}>🕐 Time</Text>
          <Text style={styles.detailValue}>{formatTime(item.created_at)}</Text>
        </View>
        <View style={styles.entryDetail}>
          <Text style={styles.detailLabel}>🥛 Qty</Text>
          <Text style={[styles.detailValue, { fontWeight: '700' }]}>{formatLiters(item.quantity_liters)}</Text>
        </View>
        <View style={styles.entryDetail}>
          <Text style={styles.detailLabel}>💰 Amount</Text>
          <Text style={[styles.detailValue, { color: COLORS.primaryDark, fontWeight: '700' }]}>
            {formatCurrency(item.total_amount)}
          </Text>
        </View>
      </View>
      <View style={styles.entryFooter}>
        <Text style={styles.entryFooterText}>
          Type: {getMilkTypeLabel(item.milk_type_selected)} • Rate: {formatCurrency(item.rate_per_liter_used)}/L
        </Text>
      </View>
    </View>
  );

  const dateFilters = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'All Time', value: 'all' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primaryDark} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Entry History</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Customer Filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.customerFilter}
          onPress={() => setShowCustomerFilter(true)}
        >
          <Text style={styles.customerFilterText}>
            {selectedCustomer ? selectedCustomer.customer_name : '👥 All Customers'}
          </Text>
          <Text>▼</Text>
        </TouchableOpacity>

        {selectedCustomer && (
          <TouchableOpacity
            style={styles.clearFilterBtn}
            onPress={() => setSelectedCustomer(null)}
          >
            <Text style={styles.clearFilterText}>✕ Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Date Range Filter */}
      <View style={styles.dateFilterRow}>
        {dateFilters.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.dateFilterBtn, dateRange === f.value && styles.dateFilterBtnActive]}
            onPress={() => setDateRange(f.value)}
          >
            <Text style={[styles.dateFilterText, dateRange === f.value && styles.dateFilterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Liters</Text>
          <Text style={styles.summaryValue}>{totalLiters.toFixed(2)} L</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Amount</Text>
          <Text style={[styles.summaryValue, { color: COLORS.primaryDark }]}>{formatCurrency(totalAmount)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Entries</Text>
          <Text style={styles.summaryValue}>{entries.length}</Text>
        </View>
      </View>

      {/* Entry List */}
      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.entry_id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} colors={[COLORS.primaryDark]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No entries found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
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
              {customers.map((customer) => (
                <TouchableOpacity
                  key={customer.customer_id}
                  style={[
                    styles.pickerItem,
                    selectedCustomer?.customer_id === customer.customer_id && styles.pickerItemActive,
                  ]}
                  onPress={() => {
                    setSelectedCustomer(customer);
                    setShowCustomerFilter(false);
                  }}
                >
                  <Text style={[
                    styles.pickerItemText,
                    selectedCustomer?.customer_id === customer.customer_id && { color: COLORS.white },
                  ]}>
                    {customer.customer_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.pickerCloseBtn}
              onPress={() => setShowCustomerFilter(false)}
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
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  customerFilter: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderGray,
  },
  customerFilterText: { fontSize: 14, fontWeight: '500', color: COLORS.textDark },
  clearFilterBtn: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  clearFilterText: { fontSize: 12, color: COLORS.errorRed, fontWeight: '600' },
  dateFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.xs,
  },
  dateFilterBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderGray,
  },
  dateFilterBtnActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
  },
  dateFilterText: { fontSize: 11, fontWeight: '600', color: COLORS.textGray },
  dateFilterTextActive: { color: COLORS.white },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGreen,
    marginHorizontal: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 10, color: COLORS.textGray },
  summaryValue: { fontSize: 14, fontWeight: '700', color: COLORS.textDark, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: COLORS.borderGray },
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxxl },
  entryCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  entryCustomerBadge: {
    backgroundColor: COLORS.lightGreen,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  entryCustomerText: { fontSize: 13, fontWeight: '600', color: COLORS.primaryDark },
  entryDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  entryDetail: { width: '45%' },
  detailLabel: { fontSize: 11, color: COLORS.textGray },
  detailValue: { fontSize: 14, color: COLORS.textDark, marginTop: 1 },
  entryFooter: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  entryFooterText: { fontSize: 11, color: COLORS.textLight },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 50, marginBottom: SPACING.md },
  emptyText: { fontSize: 16, fontWeight: '600', color: COLORS.textGray },
  emptySubtext: { fontSize: 13, color: COLORS.textLight, marginTop: SPACING.xs },
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
    maxHeight: '60%',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primaryDark,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  pickerList: { maxHeight: 350 },
  pickerItem: {
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.backgroundLight,
  },
  pickerItemActive: { backgroundColor: COLORS.primaryDark },
  pickerItemText: { fontSize: 15, fontWeight: '600', color: COLORS.textDark },
  pickerCloseBtn: { padding: SPACING.md, alignItems: 'center', marginTop: SPACING.md },
  pickerCloseBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.textGray },
});

export default HistoryScreen;
