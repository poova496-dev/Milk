// Dashboard Screen - Home screen with summary cards and quick actions
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, StatusBar, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SHADOWS, SPACING, RADIUS } from '../config/theme';
import { getCustomerCount } from '../services/customerService';
import { getTodaySummary } from '../services/entryService';
import { getTotalPendingAmount, getMonthlyCollected } from '../services/paymentService';
import { formatCurrency, formatLiters, getGreeting, formatDate } from '../utils/helpers';

const DashboardScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    todayLiters: 0,
    todayAmount: 0,
    pendingAmount: 0,
    monthCollected: 0,
    todayEntries: 0,
  });

  const loadDashboardData = async () => {
    try {
      const [customerCount, todaySummary, pending, monthlyCollected] = await Promise.all([
        getCustomerCount(),
        getTodaySummary(),
        getTotalPendingAmount().catch(() => 0),
        getMonthlyCollected().catch(() => 0),
      ]);

      setStats({
        totalCustomers: customerCount,
        todayLiters: todaySummary.totalLiters,
        todayAmount: todaySummary.totalAmount,
        todayEntries: todaySummary.entryCount,
        pendingAmount: pending,
        monthCollected: monthlyCollected,
      });
    } catch (error) {
      console.error('Dashboard load error:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const quickActions = [
    { title: 'Add Entry', icon: '📝', screen: 'DailyEntry', color: '#2E7D32' },
    { title: 'History', icon: '📋', screen: 'History', color: '#1565C0' },
    { title: 'Payment', icon: '💰', screen: 'Payment', color: '#E65100' },
    { title: 'Payment\nHistory', icon: '📊', screen: 'PaymentHistory', color: '#6A1B9A' },
    { title: 'Fixed Rate', icon: '⚙️', screen: 'FixedRate', color: '#00838F' },
    { title: 'Customers', icon: '👥', screen: 'Customers', color: '#4E342E' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primaryDark} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{getGreeting()} 👋</Text>
            <Text style={styles.businessName}>Manjula Milk Forming</Text>
          </View>
          <View style={styles.headerLogoCircle}>
            <Text style={styles.headerLogoText}>🥛</Text>
          </View>
        </View>
        <Text style={styles.dateText}>📅 {formatDate(new Date())}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primaryDark]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <Text style={styles.sectionTitle}>Today's Summary</Text>
        <View style={styles.cardRow}>
          <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
            <Text style={styles.cardIcon}>🥛</Text>
            <Text style={styles.cardValue}>{formatLiters(stats.todayLiters)}</Text>
            <Text style={styles.cardLabel}>Today Liters</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
            <Text style={styles.cardIcon}>💵</Text>
            <Text style={styles.cardValue}>{formatCurrency(stats.todayAmount)}</Text>
            <Text style={styles.cardLabel}>Today Amount</Text>
          </View>
        </View>

        <View style={styles.cardRow}>
          <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
            <Text style={styles.cardIcon}>👥</Text>
            <Text style={styles.cardValue}>{stats.totalCustomers}</Text>
            <Text style={styles.cardLabel}>Total Customers</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FCE4EC' }]}>
            <Text style={styles.cardIcon}>⏳</Text>
            <Text style={[styles.cardValue, stats.pendingAmount > 0 && { color: COLORS.errorRed }]}>
              {formatCurrency(stats.pendingAmount)}
            </Text>
            <Text style={styles.cardLabel}>Pending Collections</Text>
          </View>
        </View>

        <View style={styles.cardRow}>
          <View style={[styles.statCard, styles.wideCard, { backgroundColor: '#E8F3E8' }]}>
            <Text style={styles.cardIcon}>📈</Text>
            <Text style={[styles.cardValue, { color: COLORS.secondary }]}>
              {formatCurrency(stats.monthCollected)}
            </Text>
            <Text style={styles.cardLabel}>This Month Collected</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionButton, { borderLeftColor: action.color }]}
              onPress={() => navigation.navigate(action.screen)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={styles.actionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today's entries count */}
        {stats.todayEntries > 0 && (
          <TouchableOpacity
            style={styles.todayBanner}
            onPress={() => navigation.navigate('History')}
          >
            <Text style={styles.todayBannerText}>
              📝 {stats.todayEntries} entries recorded today — Tap to view
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  header: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  businessName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 2,
  },
  headerLogoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogoText: {
    fontSize: 24,
  },
  dateText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: SPACING.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  cardRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  wideCard: {
    flex: 1,
  },
  cardIcon: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  cardLabel: {
    fontSize: 12,
    color: COLORS.textGray,
    marginTop: 2,
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  actionButton: {
    width: '30%',
    flexGrow: 1,
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderLeftWidth: 4,
    ...SHADOWS.small,
  },
  actionIcon: {
    fontSize: 30,
    marginBottom: SPACING.sm,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
    textAlign: 'center',
  },
  todayBanner: {
    backgroundColor: COLORS.lightGreen,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  todayBannerText: {
    fontSize: 13,
    color: COLORS.secondary,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default DashboardScreen;
