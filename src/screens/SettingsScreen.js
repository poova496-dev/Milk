// Settings Screen
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Alert, Linking, Image,
} from 'react-native';
import { COLORS, SHADOWS, SPACING, RADIUS } from '../config/theme';

const SettingsScreen = ({ navigation }) => {
  const handleAbout = () => {
    Alert.alert(
      'About Manjula Milk Forming',
      'Version 1.0.0\n\nA milk sales management app for daily entry, billing, and invoice generation.\n\nBusiness: Manjula Milk Forming\nAddress: Naranikuppam (vil), Kodipall (Po), Krishnagiri (Tk) (Dt), Tamilnadu - 635115\nPhone: 9585278394',
      [{ text: 'OK' }]
    );
  };

  const handleContact = () => {
    Linking.openURL('tel:9585278394');
  };

  const settingsItems = [
    {
      icon: '⚙️',
      title: 'Milk Rate Settings',
      subtitle: 'Set or update milk rate per liter',
      onPress: () => navigation.navigate('FixedRate'),
    },
    {
      icon: '👥',
      title: 'Manage Customers',
      subtitle: 'Add, edit, or remove customers',
      onPress: () => navigation.navigate('Customers'),
    },
    {
      icon: '📊',
      title: 'Payment History',
      subtitle: 'View all past payments and invoices',
      onPress: () => navigation.navigate('PaymentHistory'),
    },
    {
      icon: '📋',
      title: 'Entry History',
      subtitle: 'View all daily milk entries',
      onPress: () => navigation.navigate('History'),
    },
    {
      icon: '📞',
      title: 'Contact Support',
      subtitle: 'Call 9585278394',
      onPress: handleContact,
    },
    {
      icon: 'ℹ️',
      title: 'About App',
      subtitle: 'App version and business info',
      onPress: handleAbout,
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primaryDark} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* App Info Card */}
        <View style={styles.appInfoCard}>
          <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
          <Text style={styles.appName}>Manjula Milk Forming</Text>
          <Text style={styles.appTagline}>Fresh Milk, Healthy Life</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>

        {/* Settings Items */}
        {settingsItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.settingsItem}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <Text style={styles.settingsIcon}>{item.icon}</Text>
            <View style={styles.settingsContent}>
              <Text style={styles.settingsTitle}>{item.title}</Text>
              <Text style={styles.settingsSubtitle}>{item.subtitle}</Text>
            </View>
            <Text style={styles.settingsArrow}>›</Text>
          </TouchableOpacity>
        ))}

        {/* Business Info */}
        <View style={styles.businessCard}>
          <Text style={styles.businessCardTitle}>Business Details</Text>
          <Text style={styles.businessCardText}>📍 Naranikuppam (vil), Kodipall (Po)</Text>
          <Text style={styles.businessCardText}>    Krishnagiri (Tk) (Dt)</Text>
          <Text style={styles.businessCardText}>    Tamilnadu - 635115</Text>
          <Text style={styles.businessCardText}>📞 9585278394</Text>
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
  appInfoCard: {
    backgroundColor: COLORS.primaryDark, borderRadius: RADIUS.lg,
    padding: SPACING.xxl, alignItems: 'center', marginBottom: SPACING.xl,
    ...SHADOWS.medium,
  },
  logoImage: {
    width: 80, height: 80, marginBottom: SPACING.md, borderRadius: 40,
    backgroundColor: 'white'
  },
  appName: { fontSize: 20, fontWeight: '700', color: COLORS.white },
  appTagline: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', marginTop: 2 },
  appVersion: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: SPACING.sm },
  settingsItem: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.lg,
    marginBottom: SPACING.sm, flexDirection: 'row', alignItems: 'center',
    ...SHADOWS.small,
  },
  settingsIcon: { fontSize: 24, marginRight: SPACING.md },
  settingsContent: { flex: 1 },
  settingsTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textDark },
  settingsSubtitle: { fontSize: 12, color: COLORS.textGray, marginTop: 2 },
  settingsArrow: { fontSize: 24, color: COLORS.textLight },
  businessCard: {
    backgroundColor: COLORS.lightGreen, borderRadius: RADIUS.md,
    padding: SPACING.xl, marginTop: SPACING.lg,
  },
  businessCardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.primaryDark, marginBottom: SPACING.md },
  businessCardText: { fontSize: 13, color: COLORS.textGray, lineHeight: 20 },
});

export default SettingsScreen;
