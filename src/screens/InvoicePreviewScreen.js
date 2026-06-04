// Invoice Preview Screen - View, download, and share invoices
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Alert, Dimensions, Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING, RADIUS } from '../config/theme';
import { formatDate, formatCurrency, formatLiters, getLogoBase64 } from '../utils/helpers';
import { generateInvoiceHTML } from '../utils/invoiceTemplate';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

const InvoicePreviewScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { invoiceData, entries = [], pdfUri } = route.params || {};
  const [loading, setLoading] = useState(false);

  if (!invoiceData) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, SPACING.lg) }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invoice Preview</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No invoice data available</Text>
        </View>
      </View>
    );
  }

  const handlePrint = async () => {
    try {
      setLoading(true);
      const logoDataUri = await getLogoBase64();
      const html = generateInvoiceHTML(invoiceData, entries, logoDataUri);
      await Print.printAsync({ html });
    } catch (error) {
      Alert.alert('Error', 'Failed to print invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      setLoading(true);
      const logoDataUri = await getLogoBase64();
      const html = generateInvoiceHTML(invoiceData, entries, logoDataUri);
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Invoice ${invoiceData.invoice_number}`,
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      const logoDataUri = await getLogoBase64();
      const html = generateInvoiceHTML(invoiceData, entries, logoDataUri);
      const { uri } = await Print.printToFileAsync({ html });
      Alert.alert('✅ PDF Generated', `Invoice saved to: ${uri}`, [
        { text: 'Share', onPress: () => Sharing.shareAsync(uri) },
        { text: 'OK' },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  // No need for grouping standardQtys / extraMilk anymore as we display day-wise

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primaryDark} barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, SPACING.lg) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice Preview</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Invoice Card */}
        <View style={styles.invoiceCard}>
          {/* Invoice Header */}
          <View style={styles.invoiceHeader}>
            <View style={styles.businessInfo}>
              <View style={styles.logoCircle}>
                <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
              </View>
              <View>
                <Text style={styles.businessName}>MANJULA</Text>
                <Text style={styles.businessNameSub}>MILK FORMING</Text>
                <Text style={styles.tagline}>Fresh Milk, Healthy Life</Text>
              </View>
            </View>
            <View style={styles.invoiceBadge}>
              <Text style={styles.invoiceBadgeText}>INVOICE</Text>
            </View>
          </View>

          {/* Business Address */}
          <View style={styles.addressSection}>
            <Text style={styles.addressText}>📍 Naranikuppam (vil), Kodipall (Po),</Text>
            <Text style={styles.addressText}>   Krishnagiri (Tk) (Dt), Tamilnadu .635115</Text>
            <Text style={styles.addressText}>📞 Mob: 9585278394</Text>
          </View>

          {/* Invoice Meta */}
          <View style={styles.metaSection}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Invoice No:</Text>
              <Text style={styles.metaValue}>{invoiceData.invoice_number}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Date:</Text>
              <Text style={styles.metaValue}>{formatDate(invoiceData.invoice_date)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Customer:</Text>
              <Text style={[styles.metaValue, { fontWeight: '700' }]}>{invoiceData.customer_name}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Billing Period:</Text>
              <Text style={styles.metaValue}>
                {formatDate(invoiceData.bill_start_date)} — {formatDate(invoiceData.bill_end_date)}
              </Text>
            </View>
          </View>

          {/* Entries Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Sr</Text>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Date</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Liter's</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Rate</Text>
            <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'right' }]}>Total</Text>
          </View>

          {/* Date-wise entries */}
          {(() => {
            const sortedEntries = [...entries].sort((a, b) => new Date(a.entry_date) - new Date(b.entry_date));
            if (sortedEntries.length === 0) {
              return (
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', color: COLORS.textGray }]}>
                    No entries found
                  </Text>
                </View>
              );
            }
            return sortedEntries.map((e, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>
                  {idx + 1}
                </Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>
                  {formatDate(e.entry_date)}
                </Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>
                  {parseFloat(e.quantity_liters).toFixed(2)}
                </Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                  ₹{parseFloat(e.rate_per_liter_used).toFixed(2)}
                </Text>
                <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right', fontWeight: '500' }]}>
                  ₹{parseFloat(e.total_amount).toFixed(2)}
                </Text>
              </View>
            ));
          })()}

          {/* Summary Row Details */}
          <View style={{flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.md, paddingBottom: 0}}>
             <Text style={{fontSize: 13, color: COLORS.textGray}}>Total Days: <Text style={{fontWeight: '700', color: COLORS.textDark}}>{entries.length}</Text></Text>
             <Text style={{fontSize: 13, color: COLORS.textGray}}>Total Liters: <Text style={{fontWeight: '700', color: COLORS.textDark}}>{parseFloat(invoiceData.total_liters).toFixed(2)} L</Text></Text>
          </View>

          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>{formatCurrency(invoiceData.total_amount)}</Text>
          </View>

          <View style={styles.paidRow}>
            <Text style={styles.paidLabel}>Paid Amount</Text>
            <Text style={styles.paidAmount}>{formatCurrency(invoiceData.paid_amount)}</Text>
          </View>

          {parseFloat(invoiceData.total_amount) !== parseFloat(invoiceData.paid_amount) && (
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Balance</Text>
              <Text style={styles.balanceAmount}>
                {formatCurrency(parseFloat(invoiceData.total_amount) - parseFloat(invoiceData.paid_amount))}
              </Text>
            </View>
          )}

          {/* Footer */}
          <View style={styles.invoiceFooter}>
            <Text style={styles.thankYou}>Thank you for your business!</Text>
            <Text style={styles.footerNote}>Manjula Milk Forming • 9585278394</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.primaryDark }]}
            onPress={handlePrint}
            disabled={loading}
          >
            <Text style={styles.actionBtnText}>🖨️ Print</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.secondary }]}
            onPress={handleDownload}
            disabled={loading}
          >
            <Text style={styles.actionBtnText}>📥 Download PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#E65100' }]}
            onPress={handleShare}
            disabled={loading}
          >
            <Text style={styles.actionBtnText}>📤 Share</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.lg },
  invoiceCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.xl,
    ...SHADOWS.large, borderWidth: 2, borderColor: COLORS.primaryDark,
  },
  invoiceHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  businessInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  logoCircle: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.lightGreen,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden'
  },
  logoImage: { width: 40, height: 40 },
  businessName: { fontSize: 18, fontWeight: '800', color: COLORS.primaryDark },
  businessNameSub: { fontSize: 16, fontWeight: '700', color: COLORS.primaryDark, marginTop: -3 },
  tagline: { fontSize: 10, color: COLORS.secondary, fontStyle: 'italic' },
  invoiceBadge: {
    backgroundColor: COLORS.primaryDark, paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs, borderRadius: RADIUS.sm,
  },
  invoiceBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.white },
  addressSection: {
    paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.borderGray,
    marginBottom: SPACING.md,
  },
  addressText: { fontSize: 11, color: COLORS.textGray, lineHeight: 16 },
  metaSection: {
    backgroundColor: COLORS.lightGreen, padding: SPACING.md, borderRadius: RADIUS.sm,
    marginBottom: SPACING.lg,
  },
  metaRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2,
  },
  metaLabel: { fontSize: 12, color: COLORS.textGray },
  metaValue: { fontSize: 12, color: COLORS.textDark, fontWeight: '500' },
  tableHeader: {
    flexDirection: 'row', backgroundColor: COLORS.primaryDark, padding: SPACING.sm,
    borderRadius: RADIUS.sm, marginBottom: SPACING.xs,
  },
  tableHeaderText: { fontSize: 11, fontWeight: '700', color: COLORS.white },
  tableRow: {
    flexDirection: 'row', padding: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  tableCell: { fontSize: 12, color: COLORS.textDark },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.primaryDark, padding: SPACING.md, borderRadius: RADIUS.sm,
    marginTop: SPACING.sm,
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: COLORS.white, flex: 2 },
  totalLiters: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)', flex: 1, textAlign: 'center' },
  totalAmount: { fontSize: 16, fontWeight: '800', color: COLORS.white, flex: 1, textAlign: 'right' },
  paidRow: {
    flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.md,
    backgroundColor: '#E8F5E9', borderRadius: RADIUS.sm, marginTop: SPACING.sm,
  },
  paidLabel: { fontSize: 14, fontWeight: '600', color: COLORS.secondary },
  paidAmount: { fontSize: 16, fontWeight: '700', color: COLORS.secondary },
  balanceRow: {
    flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.md,
    backgroundColor: '#FFEBEE', borderRadius: RADIUS.sm, marginTop: SPACING.sm,
  },
  balanceLabel: { fontSize: 14, fontWeight: '600', color: COLORS.errorRed },
  balanceAmount: { fontSize: 16, fontWeight: '700', color: COLORS.errorRed },
  invoiceFooter: {
    marginTop: SPACING.xl, paddingTop: SPACING.md, borderTopWidth: 1,
    borderTopColor: COLORS.borderGray, alignItems: 'center',
  },
  thankYou: { fontSize: 14, fontStyle: 'italic', color: COLORS.secondary, fontWeight: '600' },
  footerNote: { fontSize: 10, color: COLORS.textLight, marginTop: SPACING.xs },
  actionButtons: {
    flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xl,
  },
  actionBtn: {
    flex: 1, paddingVertical: SPACING.md, borderRadius: RADIUS.md,
    alignItems: 'center', ...SHADOWS.small,
  },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 16, color: COLORS.textGray },
});

export default InvoicePreviewScreen;
