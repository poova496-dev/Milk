// Fixed Rate Screen - Set and manage milk rates
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ScrollView, StatusBar, FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING, RADIUS } from '../config/theme';
import { getActiveRate, getRateHistory, saveRate } from '../services/rateService';
import { formatDate, formatCurrency, formatDateDB } from '../utils/helpers';

const FixedRateScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [activeRate, setActiveRate] = useState(null);
  const [rateHistory, setRateHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    rate_name: '',
    rate_per_liter: '',
    rate_for_1_liter: '',
    rate_for_half_liter: '',
    rate_for_quarter_liter: '',
    rate_for_1_75_liter: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [active, history] = await Promise.all([
        getActiveRate(),
        getRateHistory(),
      ]);
      setActiveRate(active);
      setRateHistory(history);
    } catch (error) {
      console.error('Rate load error:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleRatePerLiterChange = (text) => {
    const rate = parseFloat(text) || 0;
    setForm({
      ...form,
      rate_per_liter: text,
      rate_for_1_liter: rate ? String(rate) : '',
      rate_for_half_liter: rate ? String((rate * 0.5).toFixed(2)) : '',
      rate_for_quarter_liter: rate ? String((rate * 0.25).toFixed(2)) : '',
      rate_for_1_75_liter: rate ? String((rate * 1.75).toFixed(2)) : '',
    });
  };

  const handleSave = async () => {
    if (!form.rate_per_liter || parseFloat(form.rate_per_liter) <= 0) {
      Alert.alert('Validation', 'Please enter a valid rate per liter');
      return;
    }

    Alert.alert(
      'Confirm New Rate',
      `Set new rate to ${formatCurrency(form.rate_per_liter)} per liter?\n\nThis will apply to all new entries from today.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await saveRate({
                rate_name: form.rate_name || `Rate - ${formatDate(new Date())}`,
                rate_per_liter: parseFloat(form.rate_per_liter),
                rate_for_1_liter: parseFloat(form.rate_for_1_liter) || parseFloat(form.rate_per_liter),
                rate_for_half_liter: parseFloat(form.rate_for_half_liter) || parseFloat(form.rate_per_liter) * 0.5,
                rate_for_quarter_liter: parseFloat(form.rate_for_quarter_liter) || parseFloat(form.rate_per_liter) * 0.25,
                rate_for_1_75_liter: parseFloat(form.rate_for_1_75_liter) || parseFloat(form.rate_per_liter) * 1.75,
                effective_from: formatDateDB(new Date()),
              });

              Alert.alert('✅ Rate Saved', 'New milk rate has been set successfully');
              setShowForm(false);
              setForm({ rate_name: '', rate_per_liter: '', rate_for_1_liter: '', rate_for_half_liter: '', rate_for_quarter_liter: '', rate_for_1_75_liter: '' });
              loadData();
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to save rate');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primaryDark} barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, SPACING.lg) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fixed Rate</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Current Active Rate */}
        {activeRate ? (
          <View style={styles.activeRateCard}>
            <Text style={styles.activeRateHeader}>Current Active Rate</Text>
            <Text style={styles.activeRateValue}>
              {formatCurrency(activeRate.rate_per_liter)} / Liter
            </Text>
            <View style={styles.rateBreakdown}>
              <View style={styles.rateBreakdownItem}>
                <Text style={styles.rateBreakdownLabel}>1 L</Text>
                <Text style={styles.rateBreakdownValue}>{formatCurrency(activeRate.rate_for_1_liter)}</Text>
              </View>
              <View style={styles.rateBreakdownItem}>
                <Text style={styles.rateBreakdownLabel}>½ L</Text>
                <Text style={styles.rateBreakdownValue}>{formatCurrency(activeRate.rate_for_half_liter)}</Text>
              </View>
              <View style={styles.rateBreakdownItem}>
                <Text style={styles.rateBreakdownLabel}>¼ L</Text>
                <Text style={styles.rateBreakdownValue}>{formatCurrency(activeRate.rate_for_quarter_liter)}</Text>
              </View>
              <View style={styles.rateBreakdownItem}>
                <Text style={styles.rateBreakdownLabel}>1.75 L</Text>
                <Text style={styles.rateBreakdownValue}>{formatCurrency(activeRate.rate_for_1_75_liter)}</Text>
              </View>
            </View>
            <Text style={styles.effectiveFrom}>
              Effective from: {formatDate(activeRate.effective_from)}
            </Text>
          </View>
        ) : (
          <View style={styles.noRateCard}>
            <Text style={styles.noRateIcon}>⚠️</Text>
            <Text style={styles.noRateText}>No rate set yet</Text>
            <Text style={styles.noRateSubtext}>Please set a milk rate to start making entries</Text>
          </View>
        )}

        {/* Set New Rate Button / Form */}
        {!showForm ? (
          <TouchableOpacity style={styles.setRateBtn} onPress={() => setShowForm(true)}>
            <Text style={styles.setRateBtnText}>⚙️ Set New Rate</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Set New Milk Rate</Text>

            <Text style={styles.inputLabel}>Rate Name (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Summer Rate 2026"
              placeholderTextColor={COLORS.textLight}
              value={form.rate_name}
              onChangeText={(text) => setForm({ ...form, rate_name: text })}
            />

            <Text style={styles.inputLabel}>Rate Per Liter (₹) *</Text>
            <TextInput
              style={[styles.input, styles.mainInput]}
              placeholder="e.g., 40"
              placeholderTextColor={COLORS.textLight}
              value={form.rate_per_liter}
              onChangeText={handleRatePerLiterChange}
              keyboardType="decimal-pad"
              autoFocus
            />

            <Text style={styles.subHeader}>Auto-calculated rates (editable)</Text>

            <View style={styles.rateRow}>
              <View style={styles.rateField}>
                <Text style={styles.rateFieldLabel}>1 Liter</Text>
                <TextInput
                  style={styles.rateInput}
                  value={form.rate_for_1_liter}
                  onChangeText={(t) => setForm({ ...form, rate_for_1_liter: t })}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.rateField}>
                <Text style={styles.rateFieldLabel}>½ Liter</Text>
                <TextInput
                  style={styles.rateInput}
                  value={form.rate_for_half_liter}
                  onChangeText={(t) => setForm({ ...form, rate_for_half_liter: t })}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.rateRow}>
              <View style={styles.rateField}>
                <Text style={styles.rateFieldLabel}>¼ Liter</Text>
                <TextInput
                  style={styles.rateInput}
                  value={form.rate_for_quarter_liter}
                  onChangeText={(t) => setForm({ ...form, rate_for_quarter_liter: t })}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.rateField}>
                <Text style={styles.rateFieldLabel}>1.75 Liter</Text>
                <TextInput
                  style={styles.rateInput}
                  value={form.rate_for_1_75_liter}
                  onChangeText={(t) => setForm({ ...form, rate_for_1_75_liter: t })}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.formBtn, styles.cancelFormBtn]}
                onPress={() => setShowForm(false)}
              >
                <Text style={styles.cancelFormBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formBtn, styles.saveFormBtn]}
                onPress={handleSave}
              >
                <Text style={styles.saveFormBtnText}>Save Rate</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Rate History */}
        {rateHistory.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Rate History</Text>
            {rateHistory.map((rate) => (
              <View key={rate.rate_id} style={[styles.historyCard, rate.is_active && styles.historyCardActive]}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyName}>{rate.rate_name}</Text>
                  {rate.is_active && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>ACTIVE</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.historyRate}>{formatCurrency(rate.rate_per_liter)} / L</Text>
                <Text style={styles.historyDate}>From: {formatDate(rate.effective_from)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  activeRateCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    ...SHADOWS.medium,
  },
  activeRateHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: SPACING.sm,
  },
  activeRateValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginBottom: SPACING.md,
  },
  rateBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  rateBreakdownItem: {
    backgroundColor: COLORS.lightGreen,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    minWidth: 70,
  },
  rateBreakdownLabel: { fontSize: 11, color: COLORS.textGray },
  rateBreakdownValue: { fontSize: 14, fontWeight: '700', color: COLORS.primaryDark },
  effectiveFrom: { fontSize: 12, color: COLORS.textGray },
  noRateCard: {
    backgroundColor: '#FFF3E0',
    padding: SPACING.xxl,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  noRateIcon: { fontSize: 40, marginBottom: SPACING.sm },
  noRateText: { fontSize: 16, fontWeight: '600', color: '#E65100' },
  noRateSubtext: { fontSize: 13, color: COLORS.textGray, marginTop: SPACING.xs },
  setRateBtn: {
    backgroundColor: COLORS.primaryDark,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.medium,
  },
  setRateBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    ...SHADOWS.medium,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginBottom: SPACING.lg,
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
  mainInput: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    borderColor: COLORS.secondary,
    borderWidth: 2,
  },
  subHeader: {
    fontSize: 12,
    color: COLORS.textGray,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  rateRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  rateField: { flex: 1 },
  rateFieldLabel: { fontSize: 12, color: COLORS.textGray, marginBottom: 4 },
  rateInput: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    textAlign: 'center',
    color: COLORS.textDark,
  },
  formActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  formBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  cancelFormBtn: { backgroundColor: COLORS.backgroundLight, borderWidth: 1, borderColor: COLORS.borderGray },
  saveFormBtn: { backgroundColor: COLORS.primaryDark },
  cancelFormBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.textGray },
  saveFormBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.white },
  historySection: { marginTop: SPACING.md },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: SPACING.md,
  },
  historyCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  historyCardActive: { borderLeftWidth: 4, borderLeftColor: COLORS.secondary },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyName: { fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  activeBadge: {
    backgroundColor: COLORS.lightGreen,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  activeBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.secondary },
  historyRate: { fontSize: 16, fontWeight: '700', color: COLORS.primaryDark, marginTop: 4 },
  historyDate: { fontSize: 12, color: COLORS.textGray, marginTop: 2 },
});

export default FixedRateScreen;
